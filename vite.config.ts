import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React
          if (
            id.includes('/react/') ||
            id.includes('react-dom') ||
            id.includes('react-router-dom')
          ) {
            return 'vendor-react'
          }

          // Supabase
          if (id.includes('@supabase/supabase-js')) {
            return 'vendor-supabase'
          }

          // React Query
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query'
          }

          // Framer Motion
          if (id.includes('framer-motion')) {
            return 'vendor-framer'
          }

          // Forms
          if (
            id.includes('react-hook-form') ||
            id.includes('@hookform/resolvers') ||
            id.includes('zod')
          ) {
            return 'vendor-forms'
          }

          // Radix UI
          if (id.includes('@radix-ui')) {
            return 'vendor-radix'
          }

          // Lucide Icons
          if (id.includes('lucide-react')) {
            return 'vendor-icons'
          }

          // All remaining node_modules
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
})