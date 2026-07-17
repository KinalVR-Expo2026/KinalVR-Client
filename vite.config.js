import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mkcert from 'vite-plugin-mkcert'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), mkcert()],
  resolve: {
    dedupe: ['three']
  },
  server: {
    https: true,
    host: true,
    allowedHosts: true,
    proxy: {
      '/kinal-vr': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    },
    hmr: {
      timeout: 120000
    },
    watch: {
      usePolling: true
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
})