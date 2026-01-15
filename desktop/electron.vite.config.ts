import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'

export default defineConfig({
    main: {
        build: {
            outDir: 'dist/main',
            lib: {
                entry: 'electron/main.ts'
            }
        },
        plugins: [externalizeDepsPlugin()]
    },
    preload: {
        build: {
            outDir: 'dist/preload',
            lib: {
                entry: 'electron/preload.ts'
            }
        },
        plugins: [externalizeDepsPlugin()]
    }
})
