import { createReadStream, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { createServer } from 'node:http';

const port = Number(process.env.PORT || 3000);
const root = process.cwd();

const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png'
};

function sendConfig(res) {
    const missing = ['LEADS_API_ENDPOINT', 'LEADS_API_KEY'].filter((key) => !process.env[key]);

    if (missing.length > 0) {
        res.writeHead(500, { 'Content-Type': 'text/javascript; charset=utf-8' });
        res.end(`console.error(${JSON.stringify(`Missing landing environment variables: ${missing.join(', ')}`)});`);
        return;
    }

    res.writeHead(200, {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Cache-Control': 'no-store'
    });
    res.end([
        `window.LEADS_API_ENDPOINT = ${JSON.stringify(process.env.LEADS_API_ENDPOINT)};`,
        `window.LEADS_API_KEY = ${JSON.stringify(process.env.LEADS_API_KEY)};`,
        ''
    ].join('\n'));
}

function sendFile(req, res) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
    const normalizedPath = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    const filePath = join(root, normalizedPath);

    if (!filePath.startsWith(root) || !existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
    }

    res.writeHead(200, {
        'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream'
    });
    createReadStream(filePath).pipe(res);
}

createServer((req, res) => {
    if (req.url?.startsWith('/config.js')) {
        sendConfig(res);
        return;
    }

    sendFile(req, res);
}).listen(port, () => {
    console.log(`Landing running on http://localhost:${port}`);
});
