import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

// Load environment variables when starting Vite so define/clients can
// pick them up consistently in dev/preview builds.
dotenv.config();

export default defineConfig({
  base: '/Map',
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
    // Manual chunking to isolate very large vendor libraries so the
    // initial app bundle stays small. This keeps exceljs/xlsx and
    // map-related packages (leaflet/react-leaflet) in separate files.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id) return;
          // node_modules packages
          if (id.includes('node_modules')) {
            // very large Excel libraries
            if (id.includes('exceljs')) return 'vendor-exceljs';
            if (id.includes('/xlsx') || id.includes('node_modules/xlsx')) return 'vendor-xlsx';

            // map related libs
            if (
              id.includes('leaflet') ||
              id.includes('react-leaflet') ||
              id.includes('@mapbox') ||
              id.includes('proj4')
            )
              return 'vendor-map';

            // UI / animation / icons
            if (
              id.includes('framer-motion') ||
              id.includes('material-icons') ||
              id.includes('react-icons')
            )
              return 'vendor-ui';

            // react runtime - be specific to avoid matching react-leaflet, react-router, etc.
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')
            )
              return 'vendor-react';

            // supabase client
            if (id.includes('@supabase') || id.includes('supabase-js')) return 'vendor-supabase';
            // targeted splits for other large libraries
            if (id.includes('react-router-dom')) return 'vendor-router';
            if (id.includes('i18next') || id.includes('react-i18next')) return 'vendor-i18n';
            if (id.includes('react-markdown')) return 'vendor-markdown';
            if (id.includes('html2canvas')) return 'vendor-canvas';
            if (
              id.includes('react-icons') ||
              id.includes('material-icons') ||
              id.includes('country-flag-icons')
            )
              return 'vendor-icons';

            // group remaining node_modules into a vendor chunk
            return 'vendor';
          }
        },
      },
    },
  },
  define: {
    // Provide explicit token replacements for non-import.meta usages.
    __VITE_SUPABASE_URL__: JSON.stringify(process.env.VITE_SUPABASE_URL),
    __VITE_SUPABASE_ANON_KEY__: JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
    __VITE_ADMIN_EMAIL__: JSON.stringify(process.env.VITE_ADMIN_EMAIL),
    __VITE_ADMIN_PASSWORD__: JSON.stringify(process.env.VITE_ADMIN_PASSWORD),
  },
});
