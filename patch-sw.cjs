const fs = require('fs');
let content = fs.readFileSync('src/main.jsx', 'utf8');

const search = `// Register service worker for offline support
if ('serviceWorker' in navigator) {`;

const replace = `// Register service worker for offline support (excluding standard development/HMR)
const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

if ('serviceWorker' in navigator && !isDev) {`;

content = content.replace(search, replace);
fs.writeFileSync('src/main.jsx', content);
console.log('Patched main.jsx SW registration');
