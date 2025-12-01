import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

export default defineConfig({
  base: '/Map',
  optimizeDeps: {
    include: ['xlsx']
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
    // Explicitly define environment variables for the client
    __VITE_SUPABASE_URL__: JSON.stringify(process.env.VITE_SUPABASE_URL),
    __VITE_SUPABASE_ANON_KEY__: JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
    __VITE_ADMIN_EMAIL__: JSON.stringify(process.env.VITE_ADMIN_EMAIL),
    __VITE_ADMIN_PASSWORD__: JSON.stringify(process.env.VITE_ADMIN_PASSWORD),
  },
})
