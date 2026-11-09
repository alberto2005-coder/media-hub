'use strict';
const { app, BrowserWindow, Menu, dialog, ipcMain, net, session, shell } = require('electron');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const http = require('node:http');
const crypto = require('node:crypto');
const path = require('node:path');

const VIDEO = new Set(['.mp4', '.m4v', '.webm', '.mkv', '.mov', '.avi', '.ogv']);
const AUDIO = new Set(['.mp3', '.m4a', '.flac', '.ogg', '.opus', '.wav', '.aac']);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json',
  '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.webm': 'video/webm', '.mkv': 'video/x-matroska', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo', '.ogv': 'video/ogg',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.flac': 'audio/flac', '.ogg': 'audio/ogg', '.opus': 'audio/ogg', '.wav': 'audio/wav', '.aac': 'audio/aac'
};
const MAX_FILES = 20000;
const WEB_DIR = path.join(__dirname, '..', 'web');
const ENV_KEYS = ['TMDB_API_KEY', 'JAMENDO_CLIENT_ID'];
const isHttp = (u) => { try { return /^https?:$/.test(new URL(u).protocol); } catch { return false; } };

if (!app.requestSingleInstanceLock()) app.quit();

/* ---------- .env ---------- */
function envDirs() {
  const dirs = [process.env.PORTABLE_EXECUTABLE_DIR, app.isPackaged ? path.dirname(process.execPath) : path.join(__dirname, '..'), app.getPath('userData')];
  return [...new Set(dirs.filter(Boolean))];
}
function findEnvFile() { for (const d of envDirs()) { const f = path.join(d, '.env'); if (fsSync.existsSync(f)) return f; } return null; }
function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}
const ENV_TEMPLATE = `# Claves gratuitas de Media Hub. Guarda este archivo como ".env" junto al programa.
# TMDB (películas y series): https://www.themoviedb.org/settings/api
TMDB_API_KEY=
# Jamendo (música libre): https://devportal.jamendo.com
JAMENDO_CLIENT_ID=
`;

/* ---------- servidor local (127.0.0.1) ----------
   Sirve la interfaz por http para que los reproductores incrustados (YouTube) acepten el origen,
   y entrega los archivos de tu biblioteca con soporte de rangos (adelantar/retroceder). */
const TOKEN = crypto.randomBytes(16).toString('hex');
const allowedRoots = new Set();
let serverPort = 0;
const inside = (root, target) => { const r = path.relative(root, target); return r && !r.startsWith('..') && !path.isAbsolute(r); };

function startServer() {
  const server = http.createServer((req, res) => {
    try {
      const u = new URL(req.url, 'http://127.0.0.1');
      if (u.pathname === '/__local') return serveLocal(req, res, u);
      let rel = decodeURIComponent(u.pathname);
      if (rel === '/') rel = '/index.html';
      const file = path.join(WEB_DIR, rel);
      if (!inside(WEB_DIR, file)) { res.writeHead(403).end(); return; }
      const ext = path.extname(file).toLowerCase();
      if (!MIME[ext] || !fsSync.existsSync(file)) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[ext], 'Cache-Control': 'no-store' });
      fsSync.createReadStream(file).pipe(res);
    } catch { res.writeHead(400).end(); }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => { serverPort = server.address().port; resolve(); }));
}
function serveLocal(req, res, u) {
  if (u.searchParams.get('t') !== TOKEN) { res.writeHead(403).end(); return; }
  const file = path.resolve(u.searchParams.get('p') || '');
  const ext = path.extname(file).toLowerCase();
  const ok = (VIDEO.has(ext) || AUDIO.has(ext)) && [...allowedRoots].some((r) => inside(r, file));
  if (!ok || !fsSync.existsSync(file)) { res.writeHead(404).end(); return; }
  const size = fsSync.statSync(file).size;
  const type = MIME[ext] || 'application/octet-stream';
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range) {
    let start = range[1] ? parseInt(range[1], 10) : 0;
    let end = range[2] ? parseInt(range[2], 10) : size - 1;
    if (!range[1] && range[2]) { start = Math.max(0, size - parseInt(range[2], 10)); end = size - 1; }
    if (start >= size || end < start) { res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end(); return; }
    end = Math.min(end, size - 1);
    res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
    fsSync.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': size });
    fsSync.createReadStream(file).pipe(res);
  }
}
const localUrl = (file) => `http://127.0.0.1:${serverPort}/__local?t=${TOKEN}&p=${encodeURIComponent(file)}`;

/* ---------- ventana ---------- */
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 820, minHeight: 560,
    backgroundColor: '#0e1014', title: 'Media Hub', autoHideMenuBar: true,
    icon: path.join(WEB_DIR, 'icons', 'icon-512.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  const home = `http://127.0.0.1:${serverPort}/`;
  win.loadURL(home);
  // Enlaces externos: siempre en el navegador del sistema
  win.webContents.setWindowOpenHandler(({ url }) => { if (isHttp(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(home)) { e.preventDefault(); if (isHttp(url)) shell.openExternal(url); } });
  win.webContents.on('before-input-event', (_e, i) => { if (i.type === 'keyDown' && i.key === 'F11') win.setFullScreen(!win.isFullScreen()); });
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  await startServer();
  // Los canales de TV (HLS) se piden con fetch/XHR a servidores ajenos que casi nunca envían CORS.
  // Solo para esas peticiones de datos de nuestra propia página se añade la cabecera de permiso.
  session.defaultSession.webRequest.onHeadersReceived({ urls: ['http://*/*', 'https://*/*'] }, (details, cb) => {
    const h = details.responseHeaders || {};
    if (details.resourceType === 'xhr' && !details.url.startsWith(`http://127.0.0.1:${serverPort}/`)) {
      for (const k of Object.keys(h)) if (k.toLowerCase().startsWith('access-control-allow-')) delete h[k];
      h['Access-Control-Allow-Origin'] = ['*'];
      h['Access-Control-Allow-Headers'] = ['*'];
    }
    cb({ responseHeaders: h });
  });
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

/* ---------- IPC ---------- */
ipcMain.handle('pick-folder', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'], title: 'Elige tu carpeta de contenido' });
  if (r.canceled) return null;
  allowedRoots.add(path.resolve(r.filePaths[0]));
  return r.filePaths[0];
});

ipcMain.handle('scan-folder', async (_e, root) => {
  if (typeof root !== 'string') return [];
  root = path.resolve(root);
  allowedRoots.add(root);
  const out = [];
  async function walk(dir) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const ent of entries) {
      if (out.length >= MAX_FILES) return;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) await walk(full);
      else if (ent.isFile()) {
        const ext = path.extname(ent.name).toLowerCase();
        const kind = VIDEO.has(ext) ? 'video' : AUDIO.has(ext) ? 'audio' : null;
        if (kind) out.push({ name: ent.name, rel: path.relative(root, full), path: full, url: localUrl(full), kind });
      }
    }
  }
  await walk(root);
  return out.sort((a, b) => a.rel.localeCompare(b.rel, undefined, { numeric: true }));
});

ipcMain.handle('fetch-text', async (_e, url) => {
  if (!isHttp(url)) throw new Error('URL no válida');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await net.fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.text();
  } finally { clearTimeout(timer); }
});

ipcMain.handle('open-path', async (_e, p) => {
  if (typeof p !== 'string') return 'ruta no válida';
  const ext = path.extname(p).toLowerCase();
  if (!VIDEO.has(ext) && !AUDIO.has(ext)) return 'tipo de archivo no permitido'; // solo medios, nunca ejecutables
  return shell.openPath(p);
});

ipcMain.handle('get-config', async () => {
  const f = findEnvFile();
  if (!f) return {};
  const all = parseEnv(await fs.readFile(f, 'utf8'));
  return Object.fromEntries(ENV_KEYS.filter((k) => all[k]).map((k) => [k, all[k]]));
});
ipcMain.handle('config-info', async () => {
  const f = findEnvFile();
  return { exists: !!f, file: f, dir: envDirs()[0] };
});
ipcMain.handle('init-env', async () => {
  let f = findEnvFile();
  if (!f) {
    f = path.join(envDirs()[0], '.env');
    try { await fs.writeFile(f, ENV_TEMPLATE, { flag: 'wx' }); } catch {
      f = path.join(app.getPath('userData'), '.env');
      await fs.mkdir(path.dirname(f), { recursive: true });
      await fs.writeFile(f, ENV_TEMPLATE, { flag: 'wx' }).catch(() => {});
    }
  }
  shell.showItemInFolder(f);
  return f;
});
