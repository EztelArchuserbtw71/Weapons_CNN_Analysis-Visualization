import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // TensorFlow.js (~1 MB) is split into its own chunk and only loaded when
    // a visitor uses "Try it", so its size doesn't slow the first page load.
    chunkSizeWarningLimit: 1200,
  },
})
