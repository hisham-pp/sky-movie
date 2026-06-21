import { contextBridge, ipcRenderer } from 'electron';
import type {
  AddToPlaylistRequest,
  ApplyMovieMetadataRequest,
  ApplyTvMetadataRequest,
  CreatePlaylistRequest,
  MetadataUpdate,
  MovieMetadataSearchRequest,
  RemoveFromPlaylistRequest,
  SkyMovieApi,
  SyncRequest,
  TvMetadataSearchRequest,
  UpdatePlaylistRequest,
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
    ipcRenderer.invoke(ipcChannels.reorderPlaylistItem, playlistId, itemId, newSortOrder)
};

contextBridge.exposeInMainWorld('skyMovie', api);
