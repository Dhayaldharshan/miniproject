const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
    let reqUrl = decodeURI(req.url.split('?')[0]);
    if (reqUrl === '' || reqUrl === '/') reqUrl = '/index.html';
    if (reqUrl.endsWith('/')) reqUrl += 'index.html';

    let relPath = reqUrl.replace(/^\/+/, '');

    // Search order:
    // 1. If not starting with frontend/, look inside frontend/
    // 2. Look in root
    // 3. If starting with frontend/, look inside frontend/ as well
    const candidates = [];
    if (!relPath.startsWith('frontend/')) {
        candidates.push(path.join(__dirname, '..', 'frontend', relPath));
        candidates.push(path.join(__dirname, '..', relPath));
    } else {
        candidates.push(path.join(__dirname, '..', relPath));
        candidates.push(path.join(__dirname, '..', relPath.replace(/^frontend\//, '')));
        candidates.push(path.join(__dirname, '..', 'frontend', relPath.replace(/^frontend\//, '')));
    }

    let resolvedPath = null;
    for (const cand of candidates) {
        try {
            if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
                resolvedPath = cand;
                break;
            }
        } catch (_) {}
    }

    if (!resolvedPath) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`404 Not Found: ${req.url}`);
        return;
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    fs.createReadStream(resolvedPath).pipe(res);
});

const PORT = 5500;
server.listen(PORT, '127.0.0.1', () => {
    console.log(`Frontend Live Server running on http://127.0.0.1:${PORT}/`);
});
