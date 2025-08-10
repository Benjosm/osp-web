import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import history from 'vite-plugin-history'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), history()],
  server: {
    host: '0.0.0.0',
    port: 8001,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  }
)
