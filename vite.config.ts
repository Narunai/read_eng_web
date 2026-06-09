import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/read_eng_web/',
  server: {
    proxy: {
      '/api-gdelt': {
        target: 'https://api.gdeltproject.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-gdelt/, '/api/v2/doc/doc'),
        secure: false,
      },
      '/api-guardian': {
        target: 'https://content.guardianapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-guardian/, ''),
        secure: false,
      }
    }
  }
})
