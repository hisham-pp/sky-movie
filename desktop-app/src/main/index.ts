import { app, BrowserWindow, protocol } from 'electron';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureAppDataLayout } from './appPaths';
import { createDatabaseContext } from './database/client';
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

const currentDir = dirname(fileURLToPath(import.meta.url));
let mainWindow: BrowserWindow | null = null;

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'sky-media',
    privileges: {
      standard: true,
      secure: true,
      stream: true,
      supportFetchAPI: true
    }
  }
]);

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1080,
    minHeight: 720,
    title: 'Sky Movie',
    backgroundColor: '#f7f4ef',
    webPreferences: {
      preload: resolvePreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webgl: true,
      enableBlinkFeatures: 'PlatformHEVCDecoderSupport'
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

app.whenReady().then(() => {
  // Enable hardware acceleration for better video rendering
  app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,VaapiVideoEncoder,CanvasOopRasterization');
  app.commandLine.appendSwitch('ignore-gpu-blocklist');
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
  
  // Enable additional audio codec support
  app.commandLine.appendSwitch('audio-buffer-size', '2048');
  app.commandLine.appendSwitch('enable-features', 'AudioContext,WebAudio');
  
  const paths = ensureAppDataLayout();
  const { sqlite } = createDatabaseContext(paths);

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

  mainWindow = createWindow();

  // Start periodic update checks
  update.startPeriodicChecks();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
