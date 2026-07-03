import { app, BrowserWindow, Menu, protocol, ipcMain } from 'electron';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureAppDataLayout } from './appPaths';
import { TorrentManager } from './torrent/TorrentManager';
import { registerTorrentIpcHandlers } from './torrent/TorrentIpc';
import { createDatabaseContext, closeDatabaseContext } from './database/client';
import { registerIpcHandlers } from './ipc';
import { BackupService } from './services/backupService';
import { CatalogService } from './services/catalogService';
import { LibraryScanner } from './services/libraryScanner';
import { MaintenanceService } from './services/maintenanceService';
import { MetadataProviderManager } from './services/metadataProvider';
import { PlayerService } from './services/playerService';
import { PlaylistService } from './services/playlistService';
import { SettingsService } from './services/settingsService';
import { LocalSyncEngine } from './services/syncEngine';
import { UpdateService } from './services/updateService';
import { initFileLogging } from './utils/logger';

const currentDir = dirname(fileURLToPath(import.meta.url));
let mainWindow: BrowserWindow | null = null;
let torrentManager: TorrentManager | null = null;

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'sky-media',
    privileges: {
      standard: true,
      secure: true,
      stream: true,
      supportFetchAPI: true
    }
  },
  {
    scheme: 'sky-image',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true
    }
  }
]);

function createWindow(): BrowserWindow {
  // Remove the default application menu (File, Edit, View, Window, Help)
  Menu.setApplicationMenu(null);

  const window = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1080,
    minHeight: 720,
    title: 'Sky Movie',
    backgroundColor: '#111317',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: resolvePreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webgl: true,
      enableBlinkFeatures: 'PlatformHEVCDecoderSupport,AudioContext,WebAudio'
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    window.loadFile(join(currentDir, '../renderer/index.html'));
  }

  window.on('closed', () => {
    if (mainWindow === window) {
      mainWindow = null;
    }
  });

  return window;
}

function resolvePreloadPath(): string {
  const candidates = ['index.cjs', 'index.mjs', 'index.js'].map((fileName) => join(currentDir, '../preload', fileName));
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

// Enable hardware acceleration and audio — must be set before app.ready
// NOTE: only ONE --enable-features call is respected; combine all features here.
app.commandLine.appendSwitch(
  'enable-features',
  'VaapiVideoDecoder,VaapiVideoEncoder,CanvasOopRasterization,PlatformHEVCDecoderSupport,AudioContextLatencyHint'
);
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

app.whenReady().then(async () => {
  // Init file logging — writes to a logs/ folder next to the exe.
  // e.g. dist\win-unpacked\logs\sky-movie-YYYY-MM-DD.log
  try {
    initFileLogging(join(dirname(app.getPath('exe')), 'logs'));
  } catch (e) {
    process.stderr.write(`[Logger] File logging init failed: ${e}\n`);
  }

  const paths = ensureAppDataLayout();
  const { sqlite } = createDatabaseContext(paths);

  // TorrentManager is created immediately but boots WebTorrent lazily on
  // first use — player and other services stay on the critical startup path.
  torrentManager = new TorrentManager(paths.root);

  const catalog = new CatalogService(sqlite);
  const backup = new BackupService(sqlite, paths);
  const scanner = new LibraryScanner(sqlite);
  const player = new PlayerService(sqlite);
  const maintenance = new MaintenanceService(sqlite, paths);
  const settings = new SettingsService(sqlite);
  const metadata = new MetadataProviderManager(sqlite, paths, settings);
  const sync = new LocalSyncEngine(sqlite, paths, app.getVersion());
  const update = new UpdateService(() => mainWindow, settings);
  const playlist = new PlaylistService(sqlite);

  player.registerMediaProtocol();

  // Serve locally cached poster/backdrop images via sky-image:// so the
  // sandboxed renderer doesn't need file:// access.
  // URL format: sky-image://local/<percent-encoded-absolute-path>
  protocol.handle('sky-image', async (request) => {
    try {
      const url = new URL(request.url);
      // pathname starts with '/', strip it to get the encoded path
      const absolutePath = decodeURIComponent(url.pathname.slice(1));
      const { readFile } = await import('node:fs/promises');
      const data = await readFile(absolutePath);
      const ext = absolutePath.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      return new Response(data, {
        status: 200,
        headers: { 'Content-Type': mime, 'Cache-Control': 'max-age=604800' }
      });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });

  registerIpcHandlers({
    catalog,
    backup,
    scanner,
    metadata,
    player,
    maintenance,
    settings,
    sync,
    update,
    playlist,
    getMainWindow: () => mainWindow
  });

  registerTorrentIpcHandlers(torrentManager, () => mainWindow);

  mainWindow = createWindow();

  // Window control IPC (custom title bar buttons)
  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.handle('window:close', () => mainWindow?.close());

  // Forward renderer console messages to the main-process log file so they
  // appear alongside the streaming/player logs for debugging.
  mainWindow.webContents.on('console-message', (_event, level, message) => {
    if (level >= 3) {
      console.error('[Renderer]', message);
    } else if (level >= 2) {
      console.warn('[Renderer]', message);
    } else {
      console.log('[Renderer]', message);
    }
  });

  // Start periodic update checks
  update.startPeriodicChecks();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  torrentManager?.destroy().catch(console.error);
  closeDatabaseContext();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
