import { contextBridge, ipcRenderer } from 'electron';
import type {
  AddToPlaylistRequest,
  ApplyMovieMetadataRequest,
  ApplyTvMetadataRequest,
  CreatePlaylistRequest,
  MetadataUpdate,
  MovieMetadataSearchRequest,
  MpvEvent,
  MpvOpenRequest,
  MpvTrack,
  RemoveFromPlaylistRequest,
  SkyMovieApi,
  SyncRequest,
  TvMetadataSearchRequest,
  UpdatePlaylistRequest,
  UpdateProgressEvent,
  WatchProgressUpdate
} from '../shared/ipc';
import { ipcChannels } from '../shared/ipc';

const api: SkyMovieApi = {
  chooseFolder: (title?: string) => ipcRenderer.invoke(ipcChannels.chooseFolder, title),
  chooseFolders: (title?: string) => ipcRenderer.invoke(ipcChannels.chooseFolders, title),
  scanLibrary: (request) => ipcRenderer.invoke(ipcChannels.scanLibrary, request),
  scanLibraries: (request) => ipcRenderer.invoke(ipcChannels.scanLibraries, request),
  getMovies: (query?: string) => ipcRenderer.invoke(ipcChannels.getMovies, query),
  getMovieById: (id: number) => ipcRenderer.invoke(ipcChannels.getMovieById, id),
  getShows: (query?: string) => ipcRenderer.invoke(ipcChannels.getShows, query),
  getShowById: (id: number) => ipcRenderer.invoke(ipcChannels.getShowById, id),
  getUnmatchedFiles: () => ipcRenderer.invoke(ipcChannels.getUnmatchedFiles),
  updateMetadata: (update: MetadataUpdate) => ipcRenderer.invoke(ipcChannels.updateMetadata, update),
  searchMovieMetadata: (request: MovieMetadataSearchRequest) => ipcRenderer.invoke(ipcChannels.searchMovieMetadata, request),
  applyMovieMetadata: (request: ApplyMovieMetadataRequest) => ipcRenderer.invoke(ipcChannels.applyMovieMetadata, request),
  searchTvMetadata: (request: TvMetadataSearchRequest) => ipcRenderer.invoke(ipcChannels.searchTvMetadata, request),
  applyTvMetadata: (request: ApplyTvMetadataRequest) => ipcRenderer.invoke(ipcChannels.applyTvMetadata, request),
  markFileAsIgnored: (fileId: number) => ipcRenderer.invoke(ipcChannels.markFileAsIgnored, fileId),
  unmarkFileAsIgnored: (fileId: number) => ipcRenderer.invoke(ipcChannels.unmarkFileAsIgnored, fileId),
  updateFileMatch: (fileId: number, matchedMovieId: number | null, matchedShowId: number | null) => 
    ipcRenderer.invoke(ipcChannels.updateFileMatch, fileId, matchedMovieId, matchedShowId),
  deleteMediaFile: (fileId: number) => ipcRenderer.invoke(ipcChannels.deleteMediaFile, fileId),
  showItemInFolder: (fileId: number) => ipcRenderer.invoke(ipcChannels.showItemInFolder, fileId),
  playMedia: (mediaFileId: number) => ipcRenderer.invoke(ipcChannels.playMedia, mediaFileId),
  openMediaExternally: (mediaFileId: number) => ipcRenderer.invoke(ipcChannels.openMediaExternally, mediaFileId),
  updateWatchProgress: (update: WatchProgressUpdate) => ipcRenderer.invoke(ipcChannels.updateWatchProgress, update),
  exportLibrary: (request?: SyncRequest) => ipcRenderer.invoke(ipcChannels.exportLibrary, request),
  importLibrary: (path?: string) => ipcRenderer.invoke(ipcChannels.importLibrary, path),
  syncLibrary: (request: SyncRequest) => ipcRenderer.invoke(ipcChannels.syncLibrary, request),
  getSettings: () => ipcRenderer.invoke(ipcChannels.getSettings),
  updateSettings: (settings) => ipcRenderer.invoke(ipcChannels.updateSettings, settings),
  getLibrarySummary: () => ipcRenderer.invoke(ipcChannels.getLibrarySummary),
  clearLocalLibraryData: () => ipcRenderer.invoke(ipcChannels.clearLocalLibraryData),
  createBackup: (destinationPath?: string) => ipcRenderer.invoke(ipcChannels.createBackup, destinationPath),
  restoreBackup: (path?: string) => ipcRenderer.invoke(ipcChannels.restoreBackup, path),
  checkForUpdates: () => ipcRenderer.invoke(ipcChannels.checkForUpdates),
  downloadAndInstallUpdate: () => ipcRenderer.invoke(ipcChannels.downloadAndInstallUpdate),
  getUpdateStatus: () => ipcRenderer.invoke(ipcChannels.getUpdateStatus),
  dismissUpdateNotification: () => ipcRenderer.invoke(ipcChannels.dismissUpdateNotification),
  getPlaylists: () => ipcRenderer.invoke(ipcChannels.getPlaylists),
  getPlaylistById: (id: number) => ipcRenderer.invoke(ipcChannels.getPlaylistById, id),
  createPlaylist: (request: CreatePlaylistRequest) => ipcRenderer.invoke(ipcChannels.createPlaylist, request),
  updatePlaylist: (request: UpdatePlaylistRequest) => ipcRenderer.invoke(ipcChannels.updatePlaylist, request),
  deletePlaylist: (id: number) => ipcRenderer.invoke(ipcChannels.deletePlaylist, id),
  addToPlaylist: (request: AddToPlaylistRequest) => ipcRenderer.invoke(ipcChannels.addToPlaylist, request),
  removeFromPlaylist: (request: RemoveFromPlaylistRequest) => ipcRenderer.invoke(ipcChannels.removeFromPlaylist, request),
  reorderPlaylistItem: (playlistId: number, itemId: number, newSortOrder: number) =>
    ipcRenderer.invoke(ipcChannels.reorderPlaylistItem, playlistId, itemId, newSortOrder),
  onUpdateProgress: (callback: (event: UpdateProgressEvent) => void) => {
    const listener = (_: Electron.IpcRendererEvent, event: UpdateProgressEvent) => callback(event);
    ipcRenderer.on(ipcChannels.updateProgress, listener);
    return () => ipcRenderer.off(ipcChannels.updateProgress, listener);
  },
  // ── mpv player ────────────────────────────────────────────────────────────
  mpvIsAvailable:   () => ipcRenderer.invoke(ipcChannels.mpvIsAvailable),
  mpvOpen:          (req: MpvOpenRequest) => ipcRenderer.invoke(ipcChannels.mpvOpen, req),
  mpvClose:         () => ipcRenderer.invoke(ipcChannels.mpvClose),
  mpvPlay:          () => ipcRenderer.invoke(ipcChannels.mpvPlay),
  mpvPause:         () => ipcRenderer.invoke(ipcChannels.mpvPause),
  mpvSeek:          (s: number)  => ipcRenderer.invoke(ipcChannels.mpvSeek, s),
  mpvSetVolume:     (v: number)  => ipcRenderer.invoke(ipcChannels.mpvSetVolume, v),
  mpvSetAudioTrack: (id: number) => ipcRenderer.invoke(ipcChannels.mpvSetAudioTrack, id),
  mpvSetSubTrack:   (id: number) => ipcRenderer.invoke(ipcChannels.mpvSetSubTrack, id),
  mpvSetSpeed:      (s: number)  => ipcRenderer.invoke(ipcChannels.mpvSetSpeed, s),
  mpvSetRenderSize: (w: number, h: number) => ipcRenderer.invoke(ipcChannels.mpvSetRenderSize, w, h),
  mpvSetSubFile:    (path: string) => ipcRenderer.invoke(ipcChannels.mpvSetSubFile, path),
  onMpvFrame: (callback: (jpeg: Uint8Array) => void) => {
    const listener = (_: Electron.IpcRendererEvent, data: Uint8Array) => callback(data);
    ipcRenderer.on(ipcChannels.mpvFrame, listener);
    return () => ipcRenderer.off(ipcChannels.mpvFrame, listener);
  },
  onMpvEvent: (callback: (ev: MpvEvent) => void) => {
    const listener = (_: Electron.IpcRendererEvent, ev: MpvEvent) => callback(ev);
    ipcRenderer.on(ipcChannels.mpvEvent, listener);
    return () => ipcRenderer.off(ipcChannels.mpvEvent, listener);
  },
  onMpvTracks: (callback: (tracks: MpvTrack[]) => void) => {
    const listener = (_: Electron.IpcRendererEvent, tracks: MpvTrack[]) => callback(tracks);
    ipcRenderer.on(ipcChannels.mpvTracks, listener);
    return () => ipcRenderer.off(ipcChannels.mpvTracks, listener);
  }
};

contextBridge.exposeInMainWorld('skyMovie', api);
