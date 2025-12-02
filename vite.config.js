import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

// Load environment variables when starting Vite so define/clients can
// pick them up consistently in dev/preview builds.
dotenv.config()

export default defineConfig({
  base: '/Map',
  optimizeDeps: {
    include: ['xlsx', 'file-saver']
  },
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist'
  },
  define: {
    // Provide explicit token replacements for non-import.meta usages.
    __VITE_SUPABASE_URL__: JSON.stringify(process.env.VITE_SUPABASE_URL),
    __VITE_SUPABASE_ANON_KEY__: JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
    __VITE_ADMIN_EMAIL__: JSON.stringify(process.env.VITE_ADMIN_EMAIL),
    __VITE_ADMIN_PASSWORD__: JSON.stringify(process.env.VITE_ADMIN_PASSWORD),
  }
})
