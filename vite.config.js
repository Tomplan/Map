// Workaround config for dev server
export default {
  plugins: [],
  base: '/Map',
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist'
  }
};
