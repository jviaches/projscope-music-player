import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';
import * as https from 'https';
import * as http from 'http';
import * as remoteMain from '@electron/remote/main';

let win: BrowserWindow = null;

const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

function createWindow(): BrowserWindow {

  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: 500,
    height: 680,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: serve,
      contextIsolation: false,
      plugins: true,
      backgroundThrottling: false,
      nativeWindowOpen: false,
      webSecurity: !serve
    },
    titleBarStyle: 'hiddenInset',
    frame: false,
    resizable: false,
    transparent: true,
    minimizable: true,
    maximizable: false,
    closable: false,
    icon: path.join(__dirname, '/../src/assets/icons/vinyl.png')
  });

  remoteMain.enable(win.webContents);

  if (serve) {
    win.webContents.openDevTools();
    require('electron-reload')(__dirname, {
      electron: require(path.join(__dirname, '/../node_modules/electron'))
    });
    win.loadURL('http://localhost:4200');
  } else {
    let pathIndex = './index.html';
    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
      pathIndex = '../dist/index.html';
    }
    win.loadURL(url.format({
      pathname: path.join(__dirname, pathIndex),
      protocol: 'file:',
      slashes: true
    }));
  }

  win.on('closed', () => { win = null; });

  return win;
}

// ─── RSS / Atom feed parser (regex-based; DOMParser not available in Node) ───

interface RssEpisode { title: string; url: string; }
interface RssFeedResult { feedTitle: string; episodes: RssEpisode[]; error?: string; }

function parseRssFeed(xml: string): RssFeedResult {
  const episodes: RssEpisode[] = [];

  // Feed title: RSS 2.0 channel title or Atom feed title
  const feedTitleMatch =
    xml.match(/<channel[^>]*>[\s\S]*?<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i) ||
    xml.match(/<feed[^>]*>[\s\S]*?<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
  const feedTitle = feedTitleMatch ? feedTitleMatch[1].trim() : 'Podcast Feed';

  // RSS 2.0: <item> blocks with <enclosure type="audio/...">
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[1];
    const enclosure =
      block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']audio[^"']*["']/i) ||
      block.match(/<enclosure[^>]+type=["']audio[^"']*["'][^>]+url=["']([^"']+)["']/i);
    const titleM = block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    if (enclosure) {
      episodes.push({ title: titleM ? titleM[1].trim() : 'Untitled Episode', url: enclosure[1] });
    }
  }

  // Atom fallback: <entry> blocks with <link rel="enclosure" type="audio/...">
  if (episodes.length === 0) {
    const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
    while ((m = entryRegex.exec(xml)) !== null) {
      const block = m[1];
      const link =
        block.match(/<link[^>]+rel=["']enclosure["'][^>]+href=["']([^"']+)["'][^>]*type=["']audio[^"']*["']/i) ||
        block.match(/<link[^>]+type=["']audio[^"']*["'][^>]+href=["']([^"']+)["']/i);
      const titleM = block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      if (link) {
        episodes.push({ title: titleM ? titleM[1].trim() : 'Untitled Episode', url: link[1] });
      }
    }
  }

  return { feedTitle, episodes };
}

function fetchUrl(feedUrl: string, cb: (err: string | null, body: string) => void): void {
  const mod = feedUrl.startsWith('https') ? https : http;
  let raw = '';

  const req = mod.get(feedUrl, (res) => {
    // Follow single redirect
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      fetchUrl(res.headers.location as string, cb);
      return;
    }
    res.setEncoding('utf8');
    res.on('data', (chunk: string) => { raw += chunk; });
    res.on('end', () => cb(null, raw));
  });

  req.on('error', (err) => cb(err.message, ''));
  req.setTimeout(15000, () => { req.destroy(); cb('Request timed out', ''); });
}

// ─── IPC handlers ────────────────────────────────────────────────────────────

const supportedExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma', '.webm'];

ipcMain.on('open-file-dialog', (event) => {
  dialog.showOpenDialog(win, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Music files', extensions: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'webm'] }],
  }).then(res => {
    if (!res.canceled && res.filePaths.length > 0) {
      event.sender.send('add-media', res.filePaths);
    }
  });
});

ipcMain.on('open-folder-dialog', (event) => {
  dialog.showOpenDialog(win, {
    title: 'Select music folder',
    properties: ['openDirectory'],
  }).then(res => {
    if (res.canceled || res.filePaths.length === 0) return;
    const musicFiles: string[] = [];

    const scanFolder = (dirPath: string) => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          scanFolder(fullPath);
        } else if (entry.isFile() && supportedExtensions.includes(path.extname(entry.name).toLowerCase())) {
          musicFiles.push(fullPath);
        }
      }
    };

    scanFolder(res.filePaths[0]);
    if (musicFiles.length > 0) event.sender.send('add-media', musicFiles);
  });
});

ipcMain.on('resize-app', (_event, height: number) => {
  win.resizable = true;
  win.setSize(win.getSize()[0], height);
  win.resizable = false;
});

ipcMain.on('minimize-app', () => win.minimize());

ipcMain.on('close-app', () => app.exit(0));

ipcMain.on('fetch-rss-feed', (event, feedUrl: string) => {
  fetchUrl(feedUrl, (err, body) => {
    if (err) {
      event.sender.send('rss-feed-result', { feedTitle: '', episodes: [], error: err });
      return;
    }
    event.sender.send('rss-feed-result', parseRssFeed(body));
  });
});

ipcMain.on('validate-stream-url', (event, streamUrl: string) => {
  try {
    const parsed = new URL(streamUrl);
    const mod = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'HEAD',
    };
    const req = mod.request(options, (res) => {
      const ct = (res.headers['content-type'] || '').toLowerCase();
      const isAudio = ct.includes('audio') || ct.includes('ogg') || ct.includes('mpeg')
        || ct.includes('octet-stream') || ct.includes('rss') || ct.includes('xml');
      event.sender.send('stream-url-validation-result', { ok: res.statusCode < 400, contentType: ct, isAudio });
    });
    req.on('error', (err) => event.sender.send('stream-url-validation-result', { ok: false, error: err.message }));
    req.setTimeout(8000, () => { req.destroy(); event.sender.send('stream-url-validation-result', { ok: false, error: 'Timeout' }); });
    req.end();
  } catch (err) {
    event.sender.send('stream-url-validation-result', { ok: false, error: String(err) });
  }
});

// ─── App lifecycle ────────────────────────────────────────────────────────────

try {
  app.on('ready', () => setTimeout(createWindow, 400));

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (win === null) createWindow();
  });
} catch (e) {
  // Catch Error
}
