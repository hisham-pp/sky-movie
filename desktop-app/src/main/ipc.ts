import { BrowserWindow, dialog, ipcMain } from 'electron';
import type { OpenDialogOptions, SaveDialogOptions } from 'electron';
import type {
  MetadataUpdate,
  ApplyMovieMetadataRequest,
  ApplyTvMetadataRequest,
  MovieMetadataSearchRequest,
  ScanLibrariesRequest,
  ScanLibraryRequest,
  SyncRequest,
  TvMetadataSearchRequest,
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
import { UpdateService } from './services/updateService';

interface IpcServices {
  catalog: CatalogService;
  backup: BackupService;
  scanner: LibraryScanner;
  metadata: MetadataProviderManager;
  player: PlayerService;
  maintenance: MaintenanceService;
  settings: SettingsService;
  sync: LocalSyncEngine;
  update: UpdateService;
  getMainWindow(): BrowserWindow | null;
}

export function registerIpcHandlers(services: IpcServices): void {
  ipcMain.handle(ipcChannels.chooseFolder, async (_event, title?: string) =>
    chooseDirectory(services.getMainWindow(), title ?? 'Choose folder')
  );
  ipcMain.handle(ipcChannels.chooseFolders, async (_event, title?: string) =>
    chooseDirectories(services.getMainWindow(), title ?? 'Choose library folders')
  );

  ipcMain.handle(ipcChannels.scanLibrary, async (_event, requestInput?: string | ScanLibraryRequest) => {
    const request = normalizeScanRequest(requestInput);
    const settings = services.settings.getSettings();
    const folderPath = request.path ?? (await chooseDirectory(services.getMainWindow(), 'Choose library folder'));
    if (!folderPath) {
      return null;
    }

    return scanOneLibrary(services, folderPath, request);
  });

  ipcMain.handle(ipcChannels.scanLibraries, async (_event, requestInput?: string[] | ScanLibrariesRequest) => {
    const request = normalizeScanLibrariesRequest(requestInput);
    const paths = request.paths?.length
      ? request.paths
      : await chooseDirectories(services.getMainWindow(), 'Choose library folders');
    const uniquePaths = [...new Set(paths.filter(Boolean))];
    const results = [];

    for (const folderPath of uniquePaths) {
      results.push(await scanOneLibrary(services, folderPath, request));
    }

    return results;
  });

  ipcMain.handle(ipcChannels.getMovies, (_event, query?: string) => services.catalog.getMovies(query));
  ipcMain.handle(ipcChannels.getMovieById, (_event, id: number) => services.catalog.getMovieById(id));
  ipcMain.handle(ipcChannels.getShows, (_event, query?: string) => services.catalog.getShows(query));
  ipcMain.handle(ipcChannels.getShowById, (_event, id: number) => services.catalog.getShowById(id));
  ipcMain.handle(ipcChannels.getUnmatchedFiles, () => services.catalog.getUnmatchedFiles());
  ipcMain.handle(ipcChannels.getLibrarySummary, () => services.scanner.getSummary());

  ipcMain.handle(ipcChannels.updateMetadata, (_event, update: MetadataUpdate) => {
    services.metadata.updateMetadata(update);
  });
  ipcMain.handle(ipcChannels.searchMovieMetadata, (_event, request: MovieMetadataSearchRequest) =>
    services.metadata.searchMovieMetadata(request)
  );
  ipcMain.handle(ipcChannels.applyMovieMetadata, (_event, request: ApplyMovieMetadataRequest) =>
    services.metadata.applyMovieMetadata(request)
  );
  ipcMain.handle(ipcChannels.searchTvMetadata, (_event, request: TvMetadataSearchRequest) =>
    services.metadata.searchTvMetadata(request)
  );
  ipcMain.handle(ipcChannels.applyTvMetadata, (_event, request: ApplyTvMetadataRequest) =>
    services.metadata.applyTvMetadata(request)
  );
  ipcMain.handle(ipcChannels.markFileAsIgnored, (_event, fileId: number) => {
    services.catalog.markFileAsIgnored(fileId);
  });
  ipcMain.handle(ipcChannels.updateFileMatch, (_event, fileId: number, matchedMovieId: number | null, matchedShowId: number | null) => {
    services.catalog.updateFileMatch(fileId, matchedMovieId, matchedShowId);
  });

  ipcMain.handle(ipcChannels.playMedia, (_event, mediaFileId: number) => services.player.playMedia(mediaFileId));
  ipcMain.handle(ipcChannels.openMediaExternally, (_event, mediaFileId: number) =>
    services.player.openExternally(mediaFileId)
  );

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
  ipcMain.handle(ipcChannels.checkForUpdates, () => services.update.checkForUpdates());
  ipcMain.handle(ipcChannels.downloadAndInstallUpdate, () => services.update.downloadAndInstallUpdate());
  ipcMain.handle(ipcChannels.getUpdateStatus, () => services.update.getStatus());
  ipcMain.handle(ipcChannels.dismissUpdateNotification, () => services.update.dismissUpdateNotification());
}

function normalizeScanRequest(request?: string | ScanLibraryRequest): ScanLibraryRequest {
  if (typeof request === 'string') {
    return { path: request };
  }

  return request ?? {};
}

function normalizeScanLibrariesRequest(request?: string[] | ScanLibrariesRequest): ScanLibrariesRequest {
  if (Array.isArray(request)) {
    return { paths: request };
  }

  return request ?? {};
}

function scanOneLibrary(services: IpcServices, folderPath: string, request: ScanLibraryRequest | ScanLibrariesRequest) {
  const settings = services.settings.getSettings();
  return services.scanner.scanLibrary(folderPath, {
    mediaKind: request.mediaKind ?? settings.defaultScanMode,
    matcherStrategy: request.matcherStrategy ?? settings.defaultMatcherStrategy,
    extractFileMetadata: request.extractFileMetadata ?? settings.extractFileMetadata
  });
}

async function chooseDirectory(window: BrowserWindow | null, title: string): Promise<string | null> {
  const options: OpenDialogOptions = {
    title,
    properties: ['openDirectory', 'createDirectory']
  };
  const result = window ? await dialog.showOpenDialog(window, options) : await dialog.showOpenDialog(options);

  return result.canceled ? null : result.filePaths[0] ?? null;
}

async function chooseDirectories(window: BrowserWindow | null, title: string): Promise<string[]> {
  const options: OpenDialogOptions = {
    title,
    properties: ['openDirectory', 'createDirectory', 'multiSelections']
  };
  const result = window ? await dialog.showOpenDialog(window, options) : await dialog.showOpenDialog(options);

  return result.canceled ? [] : result.filePaths;
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
