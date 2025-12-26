const http = require('http');
const fs = require('fs');
const path = require('path');

function startServer({ host = '127.0.0.1', port = 5173, root = path.resolve(__dirname, '..', 'dist') } = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      let filePath = path.join(root, urlPath);

      // Prevent directory traversal
      if (!filePath.startsWith(root)) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        return res.end('Bad request');
      }

      fs.stat(filePath, (err, stats) => {
        if (!err && stats.isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const map = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
            '.ico': 'image/x-icon',
          };
          const contentType = map[ext] || 'application/octet-stream';
          fs.readFile(filePath, (e, data) => {
            if (e) {
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              res.end('Not found');
            } else {
              res.writeHead(200, { 'Content-Type': contentType });
              res.end(data);
            }
          });
        } else {
          // SPA fallback to index.html
          fs.readFile(path.join(root, 'index.html'), (e, data) => {
            if (e) {
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              res.end('Not found');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(data);
            }
          });
        }
      });
    });

    server.on('error', (err) => reject(err));
    server.listen(port, host, () => resolve({ server, url: `http://${host}:${port}` }));
  });
}

module.exports = { startServer };
