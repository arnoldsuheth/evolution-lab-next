import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],

  // GENESIS-4920-SPLIT
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (
            id.includes('three') ||
            id.includes('@react-three') ||
            id.includes('maath')
          ) return 'lion-3d'

          if (
            id.includes('react') ||
            id.includes('scheduler')
          ) return 'react-core'

          return 'vendor'
        },
      },
    },
  },})
