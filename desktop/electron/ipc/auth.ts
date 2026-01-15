import { ipcMain } from 'electron'

const API_BASE_URL = 'http://127.0.0.1:8000/api/users'

async function handleLogin(_event: any, credentials: any) {
    try {
        const response = await fetch(`${API_BASE_URL}/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Login failed')
        }

        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

async function handleRegister(_event: any, userData: any) {
    try {
        const response = await fetch(`${API_BASE_URL}/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(JSON.stringify(data) || 'Registration failed')
        }

        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export function setupAuthIPC() {
    ipcMain.handle('auth:login', handleLogin)
    ipcMain.handle('auth:register', handleRegister)
}
