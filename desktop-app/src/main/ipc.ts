import { BrowserWindow, dialog, ipcMain, shell } from 'electron';
import mpvService from './services/mpvService';
import { logger } from './utils/logger';
import type { MpvOpenRequest } from '../shared/ipc';
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
import { PlaylistService } from './services/playlistService';
import { SettingsService } from './services/settingsService';
import { LocalSyncEngine } from './services/syncEngine';
import { UpdateService } from './services/updateService';


const log = logger('IPC');

// Wraps an IPC handler so any thrown error is logged and re-thrown as a
// plain string (IPC can't serialize Error objects across the context bridge).
function safe<T>(channel: string, fn: () => Promise<T> | T): Promise<T> {
  return Promise.resolve().then(fn).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`[${channel}]`, message);
    throw new Error(message);
  });
}

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
  playlist: PlaylistService;
  getMainWindow(): BrowserWindow | null;
}

export function registerIpcHandlers(services: IpcServices): void {
  const h = ipcMain.handle.bind(ipcMain);

  h(ipcChannels.chooseFolder, (_e, title?: string) =>
    safe(ipcChannels.chooseFolder, () => chooseDirectory(services.getMainWindow(), title ?? 'Choose folder'))
  );
  h(ipcChannels.chooseFolders, (_e, title?: string) =>
    safe(ipcChannels.chooseFolders, () => chooseDirectories(services.getMainWindow(), title ?? 'Choose library folders'))
  );

  h(ipcChannels.scanLibrary, async (_e, requestInput?: string | ScanLibraryRequest) =>
    safe(ipcChannels.scanLibrary, async () => {
      const request = normalizeScanRequest(requestInput);
      const folderPath = request.path ?? (await chooseDirectory(services.getMainWindow(), 'Choose library folder'));
      if (!folderPath) return null;
      return scanOneLibrary(services, folderPath, request);
    })
  );

  h(ipcChannels.scanLibraries, async (_e, requestInput?: string[] | ScanLibrariesRequest) =>
    safe(ipcChannels.scanLibraries, async () => {
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
    })
  );

  h(ipcChannels.getMovies,        (_e, query?: string) => safe(ipcChannels.getMovies,        () => services.catalog.getMovies(query)));
  h(ipcChannels.getMovieById,     (_e, id: number)     => safe(ipcChannels.getMovieById,     () => services.catalog.getMovieById(id)));
  h(ipcChannels.getShows,         (_e, query?: string) => safe(ipcChannels.getShows,         () => services.catalog.getShows(query)));
  h(ipcChannels.getShowById,      (_e, id: number)     => safe(ipcChannels.getShowById,      () => services.catalog.getShowById(id)));
  h(ipcChannels.getUnmatchedFiles, ()                  => safe(ipcChannels.getUnmatchedFiles, () => services.catalog.getUnmatchedFiles()));
  h(ipcChannels.getLibrarySummary, ()                  => safe(ipcChannels.getLibrarySummary, () => services.scanner.getSummary()));

  h(ipcChannels.updateMetadata, (_e, update: MetadataUpdate) =>
    safe(ipcChannels.updateMetadata, () => services.metadata.updateMetadata(update))
  );
  h(ipcChannels.searchMovieMetadata, (_e, request: MovieMetadataSearchRequest) =>
    safe(ipcChannels.searchMovieMetadata, () => services.metadata.searchMovieMetadata(request))
  );
  h(ipcChannels.applyMovieMetadata, (_e, request: ApplyMovieMetadataRequest) =>
    safe(ipcChannels.applyMovieMetadata, () => services.metadata.applyMovieMetadata(request))
  );
  h(ipcChannels.searchTvMetadata, (_e, request: TvMetadataSearchRequest) =>
    safe(ipcChannels.searchTvMetadata, () => services.metadata.searchTvMetadata(request))
  );
  h(ipcChannels.applyTvMetadata, (_e, request: ApplyTvMetadataRequest) =>
    safe(ipcChannels.applyTvMetadata, () => services.metadata.applyTvMetadata(request))
  );

  h(ipcChannels.markFileAsIgnored,   (_e, fileId: number) => safe(ipcChannels.markFileAsIgnored,   () => services.catalog.markFileAsIgnored(fileId)));
  h(ipcChannels.unmarkFileAsIgnored, (_e, fileId: number) => safe(ipcChannels.unmarkFileAsIgnored, () => services.catalog.unmarkFileAsIgnored(fileId)));
  h(ipcChannels.updateFileMatch, (_e, fileId: number, matchedMovieId: number | null, matchedShowId: number | null) =>
    safe(ipcChannels.updateFileMatch, () => services.catalog.updateFileMatch(fileId, matchedMovieId, matchedShowId))
  );
  h(ipcChannels.deleteMediaFile, (_e, fileId: number) =>
    safe(ipcChannels.deleteMediaFile, () => services.catalog.deleteMediaFile(fileId))
  );
  h(ipcChannels.showItemInFolder, (_e, fileId: number) =>
    safe(ipcChannels.showItemInFolder, () => {
      const file = services.catalog.getMediaFile(fileId);
      if (file) shell.showItemInFolder(file.absolutePath);
    })
  );

  h(ipcChannels.playMedia, (_e, mediaFileId: number) =>
    safe(ipcChannels.playMedia, () => services.player.playMedia(mediaFileId))
  );
  h(ipcChannels.openMediaExternally, (_e, mediaFileId: number) =>
    safe(ipcChannels.openMediaExternally, () => services.player.openExternally(mediaFileId))
  );
  h(ipcChannels.updateWatchProgress, (_e, update: WatchProgressUpdate) =>
    safe(ipcChannels.updateWatchProgress, () => services.player.updateWatchProgress(update))
  );
  h(ipcChannels.getLastWatched, (_e) =>
    safe(ipcChannels.getLastWatched, () => services.player.getLastWatched())
  );

  h(ipcChannels.getWatchHistory, (_e) =>
    safe(ipcChannels.getWatchHistory, () => services.player.getWatchHistory())
  );

  h(ipcChannels.clearWatchHistory, (_e) =>
    safe(ipcChannels.clearWatchHistory, () => services.player.clearWatchHistory())
  );

  h(ipcChannels.exportLibrary, async (_e, request?: SyncRequest) =>
    safe(ipcChannels.exportLibrary, async () => {
      const destinationPath =
        request?.destinationPath ?? (await chooseDirectory(services.getMainWindow(), 'Choose export destination'));
      if (!destinationPath) return null;
      return services.sync.exportLibrary({ type: request?.type ?? 'metadata-only', ...request, destinationPath });
    })
  );
  h(ipcChannels.importLibrary, async (_e, path?: string) =>
    safe(ipcChannels.importLibrary, async () => {
      const importPath = path ?? (await chooseDirectory(services.getMainWindow(), 'Choose movie-library-sync folder'));
      if (!importPath) return null;
      return services.sync.importLibrary(importPath);
    })
  );
  h(ipcChannels.syncLibrary, async (_e, request: SyncRequest) =>
    safe(ipcChannels.syncLibrary, async () => {
      const destinationPath =
        request.destinationPath ?? (await chooseDirectory(services.getMainWindow(), 'Choose sync destination'));
      if (!destinationPath) return null;
      return services.sync.syncLibrary({ ...request, destinationPath });
    })
  );

  h(ipcChannels.getSettings,          ()             => safe(ipcChannels.getSettings,          () => services.settings.getSettings()));
  h(ipcChannels.updateSettings,       (_e, update)   => safe(ipcChannels.updateSettings,       () => services.settings.updateSettings(update)));
  h(ipcChannels.clearLocalLibraryData, ()            => safe(ipcChannels.clearLocalLibraryData, () => services.maintenance.clearLocalLibraryData()));

  h(ipcChannels.createBackup, async (_e, destinationPath?: string) =>
    safe(ipcChannels.createBackup, async () => {
      const backupPath = destinationPath ?? (await chooseBackupSavePath(services.getMainWindow()));
      if (!backupPath) return null;
      return services.backup.createBackup(backupPath);
    })
  );
  h(ipcChannels.restoreBackup, async (_e, path?: string) =>
    safe(ipcChannels.restoreBackup, async () => {
      const backupPath = path ?? (await chooseBackupOpenPath(services.getMainWindow()));
      if (!backupPath) return null;
      return services.backup.restoreBackup(backupPath);
    })
  );

  h(ipcChannels.checkForUpdates,           () => safe(ipcChannels.checkForUpdates,           () => services.update.checkForUpdates()));
  h(ipcChannels.downloadUpdate,            () => safe(ipcChannels.downloadUpdate,            () => services.update.downloadUpdate()));
  h(ipcChannels.installUpdate,             () => safe(ipcChannels.installUpdate,             () => services.update.installUpdate()));
  h(ipcChannels.getUpdateStatus,           () => safe(ipcChannels.getUpdateStatus,           () => services.update.getStatus()));
  h(ipcChannels.dismissUpdateNotification, () => safe(ipcChannels.dismissUpdateNotification, () => services.update.dismissUpdateNotification()));
  h(ipcChannels.openExternalUrl, (_e, url: string) => safe(ipcChannels.openExternalUrl, async () => {
    // Only allow web URLs — never let the renderer open arbitrary file:// or app schemes.
    if (/^https?:\/\//i.test(url)) await shell.openExternal(url);
  }));

  // Playlist handlers
  h(ipcChannels.getPlaylists,       ()               => safe(ipcChannels.getPlaylists,       () => services.playlist.getPlaylists()));
  h(ipcChannels.getPlaylistById,    (_e, id: number) => safe(ipcChannels.getPlaylistById,    () => services.playlist.getPlaylistById(id)));
  h(ipcChannels.createPlaylist,     (_e, request)    => safe(ipcChannels.createPlaylist,     () => services.playlist.createPlaylist(request)));
  h(ipcChannels.updatePlaylist,     (_e, request)    => safe(ipcChannels.updatePlaylist,     () => services.playlist.updatePlaylist(request)));
  h(ipcChannels.deletePlaylist,     (_e, id: number) => safe(ipcChannels.deletePlaylist,     () => services.playlist.deletePlaylist(id)));
  h(ipcChannels.addToPlaylist,      (_e, request)    => safe(ipcChannels.addToPlaylist,      () => services.playlist.addToPlaylist(request)));
  h(ipcChannels.removeFromPlaylist, (_e, request)    => safe(ipcChannels.removeFromPlaylist, () => services.playlist.removeFromPlaylist(request)));
  h(ipcChannels.reorderPlaylistItem, (_e, playlistId: number, itemId: number, newSortOrder: number) =>
    safe(ipcChannels.reorderPlaylistItem, () => services.playlist.reorderPlaylistItem(playlistId, itemId, newSortOrder))
  );

  // ── mpv player ─────────────────────────────────────────────────────────────
  h(ipcChannels.mpvIsAvailable, () => mpvService.isAvailable);

  h(ipcChannels.mpvOpen, (event, req: MpvOpenRequest) =>
    safe(ipcChannels.mpvOpen, () => mpvService.openFile(req.filePath, event.sender, req.renderWidth, req.renderHeight))
  );
  h(ipcChannels.mpvClose, () => safe(ipcChannels.mpvClose, () => mpvService.closeSession()));
  h(ipcChannels.mpvPlay,  () => safe(ipcChannels.mpvPlay,  () => mpvService.play()));
  h(ipcChannels.mpvPause, () => safe(ipcChannels.mpvPause, () => mpvService.pause()));

  h(ipcChannels.mpvSeek,         (_e, s: number)          => safe(ipcChannels.mpvSeek,         () => mpvService.seek(s)));
  h(ipcChannels.mpvSetVolume,    (_e, v: number)          => safe(ipcChannels.mpvSetVolume,    () => mpvService.setVolume(v)));
  h(ipcChannels.mpvSetAudioTrack,(_e, id: number)         => safe(ipcChannels.mpvSetAudioTrack,() => mpvService.setAudioTrack(id)));
  h(ipcChannels.mpvSetSubTrack,  (_e, id: number)         => safe(ipcChannels.mpvSetSubTrack,  () => mpvService.setSubTrack(id)));
  h(ipcChannels.mpvSetSpeed,     (_e, s: number)          => safe(ipcChannels.mpvSetSpeed,     () => mpvService.setSpeed(s)));
  h(ipcChannels.mpvSetRenderSize,(_e, w: number, h2: number) => safe(ipcChannels.mpvSetRenderSize, () => mpvService.setRenderSize(w, h2)));
  h(ipcChannels.mpvSetSubFile,   (_e, path: string)       => safe(ipcChannels.mpvSetSubFile,   () => mpvService.setSubFile(path)));
  h(ipcChannels.mpvSetAudioFilter,(_e, filter: string)    => safe(ipcChannels.mpvSetAudioFilter,() => mpvService.setAudioFilter(filter)));

  // Synchronous close — called from the renderer's beforeunload handler via
  // ipcRenderer.sendSync. Blocks until mpv is fully destroyed so audio stops
  // before the page unloads (Ctrl+R, F5, window close, Vite hot-reload).
  ipcMain.on(ipcChannels.mpvForceClose, (event) => {
    mpvService.closeSession();
    event.returnValue = null;
  });
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
