import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Base path chi ap dung khi build production cho GitHub Pages
  // Khi dev local, su dung root /
  base: mode === 'production' ? '/Benh_An/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Toi uu bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          docx: ['docx', 'file-saver']
        }
      }
    }
  }
}))
