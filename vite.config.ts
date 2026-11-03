import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Genesis 6.3.2 - GitHub Pages
export default defineConfig({
  base: '/evolution-lab-next/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500,
  },
})