// Bitcups Render Node HTTP entrypoint for TanStack Start's Vite SSR output.
// The compiled dist/server/server.js exports a fetch handler, not a listener.
import http from 'node:http';
import { Readable } from 'node:stream';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./dist/client/', import.meta.url));
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.gif':'image/gif', '.ico':'image/x-icon', '.woff':'font/woff', '.woff2':'font/woff2', '.txt':'text/plain; charset=utf-8', '.xml':'application/xml', '.webmanifest':'application/manifest+json', '.mp4':'video/mp4', '.avif':'image/avif' };
const { default: app } = await import('./dist/server/server.js');
if (typeof app?.fetch !== 'function') throw new Error('SSR build does not export a fetch handler');

const server = http.createServer(async (req, res) => {
  try {
    const origin = `http://${req.headers.host || 'localhost'}`;
    const url = new URL(req.url || '/', origin);
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.includes('\0')) { res.writeHead(400).end(); return; }
    // Vite client assets and public assets are emitted into dist/client.
    const file = resolve(root, '.' + pathname);
    if (file.startsWith(root.endsWith(sep) ? root : root + sep) && pathname !== '/') {
      try {
        const info = await stat(file);
        if (info.isFile()) {
          const bytes = await readFile(file);
          res.writeHead(200, { 'content-type': types[extname(file).toLowerCase()] || 'application/octet-stream', 'content-length': bytes.length, 'cache-control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600' });
          if (req.method === 'HEAD') res.end(); else res.end(bytes);
          return;
        }
      } catch (e) { if (e.code !== 'ENOENT' && e.code !== 'ENOTDIR') throw e; }
    }
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const target = `${proto}://${host}${req.url || '/'}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined && !['host', 'connection', 'transfer-encoding'].includes(key)) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
    const method = req.method || 'GET';
    const request = new Request(target, { method, headers, ...(method === 'GET' || method === 'HEAD' ? {} : { body: Readable.toWeb(req), duplex: 'half' }) });
    const response = await app.fetch(request, {}, {});
    const outHeaders = Object.fromEntries(response.headers.entries());
    res.writeHead(response.status, outHeaders);
    if (method === 'HEAD' || !response.body) { res.end(); return; }
    Readable.fromWeb(response.body).on('error', (err) => { console.error('Response stream error:', err); res.destroy(err); }).pipe(res);
  } catch (error) {
    console.error('Request error:', error);
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Internal server error');
  }
});
const port = Number(process.env.PORT || 10000);
server.listen(port, '0.0.0.0', () => console.log(`Bitcups listening on 0.0.0.0:${port}`));
