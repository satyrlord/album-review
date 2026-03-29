import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
};

// ── Helpers ────────────────────────────────────────────────────────

/** Read the full request body (capped at 4 KB to prevent abuse). */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 4096) { req.destroy(); reject(new Error('Body too large')); return; }
      chunks.push(chunk);
    });
    req.on('end',   () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

/** Validate and sanitise the album input string. */
function parseAlbumInput(raw) {
  if (typeof raw !== 'string') return null;
  const input = raw.trim();
  if (!input || input.length > 200) return null;

  // Expect "Artist - Album Title" or "Artist - Album Title (Year)"
  const sep = input.indexOf(' - ');
  if (sep < 1) return null;

  const artist = input.slice(0, sep).trim();
  let rest     = input.slice(sep + 3).trim();
  if (!artist || !rest) return null;

  // Optional trailing (YYYY)
  let year = 0;
  const ym = rest.match(/\((\d{4})\)\s*$/);
  if (ym) {
    year = parseInt(ym[1], 10);
    rest = rest.slice(0, ym.index).trim();
  }

  // Reject anything with suspicious characters (path traversal, shell injection)
  if (/[<>"`;|&$\\{}]/.test(artist + rest)) return null;

  return { artist, title: rest, year };
}

// ── API: POST /api/add-album ───────────────────────────────────────

async function handleAddAlbum(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
    return;
  }

  let body;
  try { body = JSON.parse(await readBody(req)); }
  catch { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' })); return; }

  const parsed = parseAlbumInput(body.input);
  if (!parsed) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Format: "Artist - Album Title" or "Artist - Album Title (YYYY)"' }));
    return;
  }

  const { artist, title, year } = parsed;
  const args = ['tsx', 'add_album.ts', `"${artist}"`, `"${title}"`];
  if (year) args.push(String(year));
  if (body.genre && typeof body.genre === 'string' && body.genre.length < 60) {
    args.push('--genre', `"${body.genre}"`);
  }

  console.log(`[API] add-album: "${artist}" / "${title}" / ${year || '(auto)'}`);

  const child = spawn('npx', args, {
    cwd: ROOT,
    shell: true,
    env: { ...process.env },
    timeout: 30_000,
  });

  let stdout = '', stderr = '';
  child.stdout.on('data', d => { stdout += d; });
  child.stderr.on('data', d => { stderr += d; });

  child.on('close', code => {
    const ok = code === 0;
    res.writeHead(ok ? 200 : 500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok, output: stdout.trim(), error: ok ? undefined : (stderr.trim() || stdout.trim()) }));
  });

  child.on('error', err => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: err.message }));
  });
}

// ── HTTP Server ────────────────────────────────────────────────────

http.createServer(async (req, res) => {
  const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];

  // API routes
  if (urlPath === '/api/add-album') {
    try { await handleAddAlbum(req, res); } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Internal server error' }));
    }
    return;
  }

  // Static file serving
  const filePath = path.join(ROOT, urlPath);

  // Security: prevent path traversal
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      res.end(err.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Serving on http://127.0.0.1:${PORT}`);
});
