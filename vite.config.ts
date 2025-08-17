import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 8001,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        secure: false,
      }
    },
    allowedHosts: [
      'osp.doublethinksolutions.com'
    ]
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
