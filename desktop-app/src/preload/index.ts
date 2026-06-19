import { contextBridge, ipcRenderer } from 'electron';
import type {
  ApplyMovieMetadataRequest,
  ApplyTvMetadataRequest,
  MetadataUpdate,
  MovieMetadataSearchRequest,
  SkyMovieApi,
  SyncRequest,
  TvMetadataSearchRequest,
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
  updateMetadata: (update: MetadataUpdate) => ipcRenderer.invoke(ipcChannels.updateMetadata, update),
  searchMovieMetadata: (request: MovieMetadataSearchRequest) => ipcRenderer.invoke(ipcChannels.searchMovieMetadata, request),
  applyMovieMetadata: (request: ApplyMovieMetadataRequest) => ipcRenderer.invoke(ipcChannels.applyMovieMetadata, request),
  searchTvMetadata: (request: TvMetadataSearchRequest) => ipcRenderer.invoke(ipcChannels.searchTvMetadata, request),
  applyTvMetadata: (request: ApplyTvMetadataRequest) => ipcRenderer.invoke(ipcChannels.applyTvMetadata, request),
  playMedia: (mediaFileId: number) => ipcRenderer.invoke(ipcChannels.playMedia, mediaFileId),
  updateWatchProgress: (update: WatchProgressUpdate) => ipcRenderer.invoke(ipcChannels.updateWatchProgress, update),
  exportLibrary: (request?: SyncRequest) => ipcRenderer.invoke(ipcChannels.exportLibrary, request),
  importLibrary: (path?: string) => ipcRenderer.invoke(ipcChannels.importLibrary, path),
  syncLibrary: (request: SyncRequest) => ipcRenderer.invoke(ipcChannels.syncLibrary, request),
  getSettings: () => ipcRenderer.invoke(ipcChannels.getSettings),
  updateSettings: (settings) => ipcRenderer.invoke(ipcChannels.updateSettings, settings),
  getLibrarySummary: () => ipcRenderer.invoke(ipcChannels.getLibrarySummary),
  clearLocalLibraryData: () => ipcRenderer.invoke(ipcChannels.clearLocalLibraryData),
  createBackup: (destinationPath?: string) => ipcRenderer.invoke(ipcChannels.createBackup, destinationPath),
  restoreBackup: (path?: string) => ipcRenderer.invoke(ipcChannels.restoreBackup, path)
};

contextBridge.exposeInMainWorld('skyMovie', api);
