import { ipcMain } from 'electron'
import { execFile } from 'child_process'
import * as path from 'path'

export function setupGamesIPC() {
    ipcMain.handle('games:launch', async (_, { executablePath }) => {
        try {
            const child = execFile(executablePath, [], { cwd: path.dirname(executablePath) })

            child.on('error', (err) => {
                console.error('Failed to start game:', err)
            })

            return { success: true }
        } catch (error: any) {
            console.error('Launch error:', error)
            return { success: false, error: error.message }
        }
    })
}
