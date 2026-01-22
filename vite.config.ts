import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // Proxy /l/* requests to Supabase Edge Function for local link tracking
      '/l': {
        target: 'https://hfncjkqzflreyfxvobxx.supabase.co/functions/v1/track-link',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/l\//, ''),
      },
    },
  },
  build: {
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    // Let Vite handle chunking automatically - manual chunking was causing initialization issues
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})

