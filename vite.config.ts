import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    rollupOptions: {
      output: {
        // Phase A4 — split heavy third-party libraries out of the entry chunk so
        // the initial JS bundle stays small. Output chunking only; no app
        // behavior, routing, data, or approval logic is affected.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@supabase')) return 'vendor-supabase'
          return 'vendor'
        }
      }
    }
  }
})
