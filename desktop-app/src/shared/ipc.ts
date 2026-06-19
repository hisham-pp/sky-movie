export type MediaKind = 'movie' | 'show';
export type MatchStatus = 'unmatched' | 'auto_matched' | 'manual_matched';
export type SyncType = 'full' | 'partial' | 'metadata-only' | 'files' | 'watch-progress';
export type LibraryScanMode = MediaKind | 'mixed';
export type MatcherStrategy = 'auto' | 'movie-title-year' | 'show-season-episode' | 'folder-name';
export type AppTheme = 'cinema' | 'midnight' | 'daylight' | 'ember';

export interface LibraryFolder {
  id: number;
  path: string;
  name: string;
  mediaKind: MediaKind | 'mixed';
  createdAt: string;
  updatedAt: string;
}

export interface MediaFile {
  id: number;
  libraryFolderId: number;
  mediaKind: MediaKind;
  absolutePath: string;
  relativePath: string;
  fileName: string;
  extension: string;
  fileSize: number;
  modifiedTime: string;
  createdTime: string;
  durationSeconds: number | null;
  resolution: string | null;
  videoCodec: string | null;
  audioTracks: string | null;
  subtitleTracks: string | null;
  matchedMovieId: number | null;
  matchedShowId: number | null;
  matchedEpisodeId: number | null;
  matchConfidence: number;
  matchStatus: MatchStatus;
}

export interface Movie {
  id: number;
  title: string;
  originalTitle: string | null;
  releaseYear: number | null;
  overview: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  runtimeMinutes: number | null;
  rating: number | null;
  favorite: boolean;
  addedAt: string;
  updatedAt: string;
}

export interface TvShow {
  id: number;
  title: string;
  originalTitle: string | null;
  firstAirYear: number | null;
  overview: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number | null;
  favorite: boolean;
  addedAt: string;
  updatedAt: string;
}

export interface Episode {
  id: number;
  showId: number;
  seasonNumber: number;
  episodeNumber: number;
  title: string | null;
  overview: string | null;
  runtimeMinutes: number | null;
  airDate: string | null;
  stillPath: string | null;
}

export interface LibrarySummary {
  movieCount: number;
  showCount: number;
  episodeCount: number;
  mediaFileCount: number;
  libraryFolderCount: number;
}

export interface ScanResult {
  folder: LibraryFolder;
  scannedFiles: number;
  importedFiles: number;
  movieMatches: number;
  showMatches: number;
  unmatchedFiles: number;
  movieIds: number[];
  showIds: number[];
}

export interface ScanLibraryRequest {
  path?: string;
  mediaKind?: LibraryScanMode;
  matcherStrategy?: MatcherStrategy;
  extractFileMetadata?: boolean;
}

export interface ScanLibrariesRequest {
  paths?: string[];
  mediaKind?: LibraryScanMode;
  matcherStrategy?: MatcherStrategy;
  extractFileMetadata?: boolean;
}

export interface DetailResult<TItem> {
  item: TItem | null;
  files: MediaFile[];
  episodes?: Episode[];
}

export interface MetadataUpdate {
  mediaKind: MediaKind;
  id: number;
  title?: string;
  overview?: string;
  releaseYear?: number | null;
  firstAirYear?: number | null;
  rating?: number | null;
  favorite?: boolean;
  posterPath?: string | null;
  backdropPath?: string | null;
}

export interface MovieMetadataSearchRequest {
  query: string;
  year?: number | null;
}

export interface MetadataSearchResult {
  provider: 'tmdb';
  providerId: number;
  title: string;
  originalTitle: string | null;
  year: number | null;
  overview: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: number | null;
}

export interface MovieMetadataSearchResult extends MetadataSearchResult {
  releaseYear: number | null;
}

export interface ApplyMovieMetadataRequest {
  movieId: number;
  provider: 'tmdb';
  providerId: number;
}

export interface TvMetadataSearchRequest {
  query: string;
  year?: number | null;
}

export interface TvMetadataSearchResult extends MetadataSearchResult {
  firstAirYear: number | null;
}

export interface ApplyTvMetadataRequest {
  showId: number;
  provider: 'tmdb';
  providerId: number;
}

export interface PlayMediaResult {
  mediaFileId: number;
  mediaUrl: string;
  title: string;
}

export interface WatchProgressUpdate {
  mediaFileId: number;
  positionSeconds: number;
  durationSeconds: number;
  completed?: boolean;
}

export interface SyncFilter {
  addedAfter?: string;
  watchedState?: 'watched' | 'unwatched' | 'any';
  resolution?: '1080p' | '4K' | 'any';
  language?: string;
  genre?: string;
  year?: number;
  tag?: string;
  ratingAtLeast?: number;
  collection?: string;
  fileLocationIncludes?: string;
  maxFileSizeBytes?: number;
  onlyFavorites?: boolean;
  onlyShowsWithUnwatchedEpisodes?: boolean;
  excludeLargeFiles?: boolean;
  excludeWatchedContent?: boolean;
}

export interface SyncRequest {
  type: SyncType;
  destinationPath?: string;
  itemIds?: number[];
  mediaKind?: MediaKind | 'mixed';
  includePosterCache?: boolean;
  includeBackdropCache?: boolean;
  includeMediaFiles?: boolean;
  preserveFolderStructure?: boolean;
  renameFiles?: boolean;
  verifyCopiedFiles?: boolean;
  filters?: SyncFilter;
}

export interface SyncResult {
  destinationPath: string;
  manifestPath: string;
  itemCount: number;
  fileCount: number;
  totalSize: number;
  checksumSummary: string;
}

export interface AppSettings {
  theme: AppTheme;
  metadataProvider: 'local' | 'tmdb';
  tmdbApiKey: string;
  tmdbLanguage: string;
  autoScan: boolean;
  watchFolders: boolean;
  defaultSyncIncludesFiles: boolean;
  defaultScanMode: LibraryScanMode;
  defaultMatcherStrategy: MatcherStrategy;
  extractFileMetadata: boolean;
  libraryFolders: string[];
  deviceId: string;
}

export interface ClearLocalDataResult {
  removedRows: number;
  clearedCache: boolean;
}

export interface BackupResult {
  backupPath: string;
  tableCount: number;
  rowCount: number;
  createdAt: string;
}

export interface SkyMovieApi {
  chooseFolder(title?: string): Promise<string | null>;
  chooseFolders(title?: string): Promise<string[]>;
  scanLibrary(request?: ScanLibraryRequest | string): Promise<ScanResult | null>;
  scanLibraries(request?: ScanLibrariesRequest | string[]): Promise<ScanResult[]>;
  getMovies(query?: string): Promise<Movie[]>;
  getMovieById(id: number): Promise<DetailResult<Movie>>;
  getShows(query?: string): Promise<TvShow[]>;
  getShowById(id: number): Promise<DetailResult<TvShow>>;
  updateMetadata(update: MetadataUpdate): Promise<void>;
  searchMovieMetadata(request: MovieMetadataSearchRequest): Promise<MovieMetadataSearchResult[]>;
  applyMovieMetadata(request: ApplyMovieMetadataRequest): Promise<Movie>;
  searchTvMetadata(request: TvMetadataSearchRequest): Promise<TvMetadataSearchResult[]>;
  applyTvMetadata(request: ApplyTvMetadataRequest): Promise<TvShow>;
  playMedia(mediaFileId: number): Promise<PlayMediaResult>;
  updateWatchProgress(update: WatchProgressUpdate): Promise<void>;
  exportLibrary(request?: SyncRequest): Promise<SyncResult | null>;
  importLibrary(path?: string): Promise<SyncResult | null>;
  syncLibrary(request: SyncRequest): Promise<SyncResult | null>;
  getSettings(): Promise<AppSettings>;
  updateSettings(settings: Partial<AppSettings>): Promise<AppSettings>;
  getLibrarySummary(): Promise<LibrarySummary>;
  clearLocalLibraryData(): Promise<ClearLocalDataResult>;
  createBackup(destinationPath?: string): Promise<BackupResult | null>;
  restoreBackup(path?: string): Promise<BackupResult | null>;
}

export const ipcChannels = {
  chooseFolder: 'dialog:choose-folder',
  chooseFolders: 'dialog:choose-folders',
  scanLibrary: 'library:scan',
  scanLibraries: 'library:scan-many',
  getMovies: 'library:get-movies',
  getMovieById: 'library:get-movie-by-id',
  getShows: 'library:get-shows',
  getShowById: 'library:get-show-by-id',
  updateMetadata: 'metadata:update',
  searchMovieMetadata: 'metadata:search-movie',
  applyMovieMetadata: 'metadata:apply-movie',
  searchTvMetadata: 'metadata:search-tv',
  applyTvMetadata: 'metadata:apply-tv',
  playMedia: 'player:play-media',
  updateWatchProgress: 'watch:update-progress',
  exportLibrary: 'sync:export-library',
  importLibrary: 'sync:import-library',
  syncLibrary: 'sync:sync-library',
  getSettings: 'settings:get',
  updateSettings: 'settings:update',
  getLibrarySummary: 'library:summary',
  clearLocalLibraryData: 'maintenance:clear-local-library-data',
  createBackup: 'backup:create',
  restoreBackup: 'backup:restore'
} as const;
