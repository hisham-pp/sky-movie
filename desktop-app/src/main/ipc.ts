import { BrowserWindow, dialog, ipcMain } from 'electron';
import type { OpenDialogOptions, SaveDialogOptions } from 'electron';
import type {
  MetadataUpdate,
  ScanLibraryRequest,
  SyncRequest,
  WatchProgressUpdate
} from '../shared/ipc';
import { ipcChannels } from '../shared/ipc';
import { BackupService } from './services/backupService';
import { CatalogService } from './services/catalogService';
import { LibraryScanner } from './services/libraryScanner';
import { MaintenanceService } from './services/maintenanceService';
import { MetadataProviderManager } from './services/metadataProvider';
import { PlayerService } from './services/playerService';
import { SettingsService } from './services/settingsService';
import { LocalSyncEngine } from './services/syncEngine';

interface IpcServices {
  catalog: CatalogService;
  backup: BackupService;
  scanner: LibraryScanner;
  metadata: MetadataProviderManager;
  player: PlayerService;
  maintenance: MaintenanceService;
  settings: SettingsService;
  sync: LocalSyncEngine;
  getMainWindow(): BrowserWindow | null;
}

export function registerIpcHandlers(services: IpcServices): void {
  ipcMain.handle(ipcChannels.scanLibrary, async (_event, requestInput?: string | ScanLibraryRequest) => {
    const request = normalizeScanRequest(requestInput);
    const settings = services.settings.getSettings();
    const folderPath = request.path ?? (await chooseDirectory(services.getMainWindow(), 'Choose library folder'));
    if (!folderPath) {
      return null;
    }

    return services.scanner.scanLibrary(folderPath, {
      mediaKind: request.mediaKind ?? settings.defaultScanMode,
      matcherStrategy: request.matcherStrategy ?? settings.defaultMatcherStrategy,
      extractFileMetadata: request.extractFileMetadata ?? settings.extractFileMetadata
    });
  });

  ipcMain.handle(ipcChannels.getMovies, (_event, query?: string) => services.catalog.getMovies(query));
  ipcMain.handle(ipcChannels.getMovieById, (_event, id: number) => services.catalog.getMovieById(id));
  ipcMain.handle(ipcChannels.getShows, (_event, query?: string) => services.catalog.getShows(query));
  ipcMain.handle(ipcChannels.getShowById, (_event, id: number) => services.catalog.getShowById(id));
  ipcMain.handle(ipcChannels.getLibrarySummary, () => services.scanner.getSummary());

  ipcMain.handle(ipcChannels.updateMetadata, (_event, update: MetadataUpdate) => {
    services.metadata.updateMetadata(update);
  });

  ipcMain.handle(ipcChannels.playMedia, (_event, mediaFileId: number) => services.player.playMedia(mediaFileId));

  ipcMain.handle(ipcChannels.updateWatchProgress, (_event, update: WatchProgressUpdate) => {
    services.player.updateWatchProgress(update);
  });

  ipcMain.handle(ipcChannels.exportLibrary, async (_event, request?: SyncRequest) => {
    const destinationPath =
      request?.destinationPath ?? (await chooseDirectory(services.getMainWindow(), 'Choose export destination'));
    if (!destinationPath) {
      return null;
    }

    return services.sync.exportLibrary({ type: request?.type ?? 'metadata-only', ...request, destinationPath });
  });

  ipcMain.handle(ipcChannels.importLibrary, async (_event, path?: string) => {
    const importPath = path ?? (await chooseDirectory(services.getMainWindow(), 'Choose movie-library-sync folder'));
    if (!importPath) {
      return null;
    }

    return services.sync.importLibrary(importPath);
  });

  ipcMain.handle(ipcChannels.syncLibrary, async (_event, request: SyncRequest) => {
    const destinationPath =
      request.destinationPath ?? (await chooseDirectory(services.getMainWindow(), 'Choose sync destination'));
    if (!destinationPath) {
      return null;
    }

    return services.sync.syncLibrary({ ...request, destinationPath });
  });

  ipcMain.handle(ipcChannels.getSettings, () => services.settings.getSettings());
  ipcMain.handle(ipcChannels.updateSettings, (_event, update) => services.settings.updateSettings(update));
  ipcMain.handle(ipcChannels.clearLocalLibraryData, () => services.maintenance.clearLocalLibraryData());
  ipcMain.handle(ipcChannels.createBackup, async (_event, destinationPath?: string) => {
    const backupPath = destinationPath ?? (await chooseBackupSavePath(services.getMainWindow()));
    if (!backupPath) {
      return null;
    }

    return services.backup.createBackup(backupPath);
  });
  ipcMain.handle(ipcChannels.restoreBackup, async (_event, path?: string) => {
    const backupPath = path ?? (await chooseBackupOpenPath(services.getMainWindow()));
    if (!backupPath) {
      return null;
    }

    return services.backup.restoreBackup(backupPath);
  });
}

function normalizeScanRequest(request?: string | ScanLibraryRequest): ScanLibraryRequest {
  if (typeof request === 'string') {
    return { path: request };
  }

  return request ?? {};
}

async function chooseDirectory(window: BrowserWindow | null, title: string): Promise<string | null> {
  const options: OpenDialogOptions = {
    title,
    properties: ['openDirectory', 'createDirectory']
  };
  const result = window ? await dialog.showOpenDialog(window, options) : await dialog.showOpenDialog(options);

  return result.canceled ? null : result.filePaths[0] ?? null;
}

async function chooseBackupSavePath(window: BrowserWindow | null): Promise<string | null> {
  const options: SaveDialogOptions = {
    title: 'Save Sky Movie backup',
    defaultPath: `sky-movie-backup-${new Date().toISOString().slice(0, 10)}.skybackup.json`,
    filters: [{ name: 'Sky Movie Backup', extensions: ['json'] }]
  };
  const result = window ? await dialog.showSaveDialog(window, options) : await dialog.showSaveDialog(options);

  return result.canceled ? null : result.filePath ?? null;
}

async function chooseBackupOpenPath(window: BrowserWindow | null): Promise<string | null> {
  const options: OpenDialogOptions = {
    title: 'Restore Sky Movie backup',
    properties: ['openFile'],
    filters: [{ name: 'Sky Movie Backup', extensions: ['json'] }]
  };
  const result = window ? await dialog.showOpenDialog(window, options) : await dialog.showOpenDialog(options);

  return result.canceled ? null : result.filePaths[0] ?? null;
}
