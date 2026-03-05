import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environmental variables
const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));

// Load environment variables when starting Vite so define/clients can
// pick them up consistently in dev/preview builds.
dotenv.config();

export default defineConfig({
  // Default to root (/) for Netlify, Vercel, Docker, etc.
  // Use VITE_BASE_PATH env var to override for subpaths (like GitHub Pages '/Map/')
  base: process.env.VITE_BASE_PATH || '/',
  define: {
    __APP_BASE_URL__: JSON.stringify(process.env.VITE_BASE_PATH || '/'),
  },
  optimizeDeps: {
    include: ['xlsx', 'file-saver'],
  },
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    // Let Vite/Rollup handle chunking automatically.
    // Manual chunking was causing React module initialization order issues
    // (e.g., "Cannot read properties of undefined (reading 'useState')")
  },
  define: {
    // Provide explicit token replacements for non-import.meta usages.
    __VITE_SUPABASE_URL__: JSON.stringify(process.env.VITE_SUPABASE_URL),
    __VITE_SUPABASE_ANON_KEY__: JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
    __VITE_ADMIN_EMAIL__: JSON.stringify(process.env.VITE_ADMIN_EMAIL),
    __VITE_ADMIN_PASSWORD__: JSON.stringify(process.env.VITE_ADMIN_PASSWORD),
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
});
