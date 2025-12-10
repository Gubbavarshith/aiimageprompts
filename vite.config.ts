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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - separate large libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'clerk-vendor': ['@clerk/clerk-react'],
          'framer-motion-vendor': ['framer-motion'],
          'recharts-vendor': ['recharts'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'ui-vendor': [
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
          ],
          'icons-vendor': ['@heroicons/react', 'lucide-react'],
          'utils-vendor': ['date-fns'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})

