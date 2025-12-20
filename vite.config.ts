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
  esbuild: {
    drop: ['console', 'debugger'],  // Remove console and debugger in production
  },
  build: {
    minify: 'esbuild',  // Use esbuild (faster, built-in with Vite)
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules into optimized chunks
          if (id.includes('node_modules')) {
            // React core - critical, load first
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            // Clerk - auth, can be lazy loaded
            if (id.includes('@clerk')) {
              return 'clerk-vendor'
            }
            // Framer Motion - animations, can be lazy loaded
            if (id.includes('framer-motion')) {
              return 'framer-motion-vendor'
            }
            // Charts - admin only, lazy load
            if (id.includes('recharts')) {
              return 'recharts-vendor'
            }
            // Supabase - backend, lazy load
            if (id.includes('@supabase')) {
              return 'supabase-vendor'
            }
            // TipTap - admin editor, lazy load
            if (id.includes('@tiptap')) {
              return 'tiptap-vendor'
            }
            // Three.js - 3D, lazy load
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-vendor'
            }
            // UI components - Radix, etc
            if (id.includes('@radix-ui') || id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'ui-vendor'
            }
            // Icons
            if (id.includes('@heroicons') || id.includes('lucide-react')) {
              return 'icons-vendor'
            }
            // Utils
            if (id.includes('date-fns')) {
              return 'utils-vendor'
            }
            // Other vendor code
            return 'vendor'
          }
        },
        // Optimize chunk names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 600,
    // Enable source maps only for production debugging (optional)
    sourcemap: false,
    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline small assets (<4KB)
    cssCodeSplit: true,
    reportCompressedSize: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@react-three/fiber', '@react-three/drei', 'three'],
  },
})

