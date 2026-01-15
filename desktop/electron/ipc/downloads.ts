import { ipcMain, dialog, BrowserWindow } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import { IncomingMessage } from 'http'

interface DownloadItem {
    id: string
    url: string
    savePath: string
    downloaded: number
    total: number
    status: 'pending' | 'downloading' | 'paused' | 'completed' | 'error' | 'cancelled'
    request?: any // simplify type
    resumeFrom?: number
}

class DownloadManager {
    private downloads: Map<string, DownloadItem> = new Map()
    private mainWindow: BrowserWindow | null = null

    setMainWindow(window: BrowserWindow) {
        this.mainWindow = window
    }

    startDownload(url: string, savePath: string, id: string) {
        const download: DownloadItem = {
            id,
            url,
            savePath,
            downloaded: 0,
            total: 0,
            status: 'pending'
        }
        this.downloads.set(id, download)
        this._start(download)
    }

    private _start(download: DownloadItem) {
        download.status = 'downloading'
        const file = fs.createWriteStream(download.savePath, {
            flags: download.resumeFrom ? 'a' : 'w'
        })

        const options: any = {}
        if (download.resumeFrom) {
            options.headers = {
                'Range': `bytes=${download.resumeFrom}-`
            }
        }

        const req = https.get(download.url, options, (res: IncomingMessage) => {
            if (res.statusCode && res.statusCode >= 400) {
                download.status = 'error'
                this.emitStatus(download, 'HTTP Error ' + res.statusCode)
                return
            }

            const totalLength = parseInt(res.headers['content-length'] || '0', 10)
            if (!download.resumeFrom) {
                download.total = totalLength
            }

            res.on('data', (chunk) => {
                download.downloaded += chunk.length
                file.write(chunk)
                this.emitProgress(download)
            })

            res.on('end', () => {
                if (download.status === 'downloading') {
                    file.end()
                    download.status = 'completed'
                    this.emitStatus(download)
                }
            })

            res.on('error', (err) => {
                download.status = 'error'
                this.emitStatus(download, err.message)
            })

        })

        req.on('error', (err) => {
            download.status = 'error'
            this.emitStatus(download, err.message)
        })

        download.request = req
    }

    pauseDownload(id: string) {
        const download = this.downloads.get(id)
        if (download && download.status === 'downloading' && download.request) {
            download.status = 'paused'
            download.request.destroy()
            download.resumeFrom = download.downloaded
            this.emitStatus(download)
        }
    }

    resumeDownload(id: string) {
        const download = this.downloads.get(id)
        if (download && download.status === 'paused') {
            this._start(download)
        }
    }

    cancelDownload(id: string) {
        const download = this.downloads.get(id)
        if (download) {
            if (download.status === 'downloading' && download.request) {
                download.request.destroy()
            }
            download.status = 'cancelled'
            // cleanup file
            fs.unlink(download.savePath, () => { })
            this.downloads.delete(id)
            this.emitStatus(download) // Notify cancelled
        }
    }

    private emitProgress(download: DownloadItem) {
        if (this.mainWindow) {
            this.mainWindow.webContents.send('download:progress', {
                id: download.id,
                downloaded: download.downloaded,
                total: download.total,
                progress: download.total ? (download.downloaded / download.total) : 0
            })
        }
    }

    private emitStatus(download: DownloadItem, error?: string) {
        if (this.mainWindow) {
            this.mainWindow.webContents.send('download:status', {
                id: download.id,
                status: download.status,
                error
            })
        }
    }
}

export const downloadManager = new DownloadManager()

export function setupDownloadsIPC(mainWindow: BrowserWindow) {
    downloadManager.setMainWindow(mainWindow)

    ipcMain.handle('downloads:start', (_, { url, savePath, id }) => {
        downloadManager.startDownload(url, savePath, id)
        return { success: true }
    })

    ipcMain.handle('downloads:pause', (_, { id }) => {
        downloadManager.pauseDownload(id)
        return { success: true }
    })

    ipcMain.handle('downloads:resume', (_, { id }) => {
        downloadManager.resumeDownload(id)
        return { success: true }
    })

    ipcMain.handle('downloads:cancel', (_, { id }) => {
        downloadManager.cancelDownload(id)
        return { success: true }
    })

    ipcMain.handle('installation:select-directory', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        })
        return result.filePaths[0]
    })
}
