import { ipcMain, BrowserWindow } from 'electron'
import { setupAuthIPC } from './auth'
import { setupDownloadsIPC } from './downloads'
import { setupGamesIPC } from './games'

export function setupIPC(mainWindow: BrowserWindow) {
    ipcMain.handle('get-app-version', () => '1.0.0')

    setupAuthIPC()
    setupDownloadsIPC(mainWindow)
    setupGamesIPC()
}
