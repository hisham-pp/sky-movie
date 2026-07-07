export type MediaKind = 'movie' | 'show';
export type MatchStatus = 'unmatched' | 'auto_matched' | 'manual_matched' | 'ignored';
export type SyncType = 'full' | 'partial' | 'metadata-only' | 'files' | 'watch-progress';
export type LibraryScanMode = MediaKind | 'mixed';
export type MatcherStrategy = 'auto' | 'movie-title-year' | 'show-season-episode' | 'folder-name';
export type AppTheme = 'cinema' | 'midnight' | 'daylight' | 'ember' | 'ocean' | 'forest' | 'sunset' | 'noir' | 'lavender' | 'crimson';
// Extensible — new visual styles/control layouts can be added here over time
export type PlayerStyle = 'default' | 'youtube';

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

export interface Playlist {
  id: number;
  name: string;
  description: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistItem {
  id: number;
  playlistId: number;
  mediaKind: MediaKind;
  movieId: number | null;
  showId: number | null;
  sortOrder: number;
  movie: Movie | null;
  show: TvShow | null;
}

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
}

export interface UpdatePlaylistRequest {
  id: number;
  name?: string;
  description?: string;
}

export interface AddToPlaylistRequest {
  playlistId: number;
  mediaKind: MediaKind;
  movieId?: number;
  showId?: number;
}

export interface RemoveFromPlaylistRequest {
  playlistId: number;
  itemId: number;
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
  absolutePath: string;
  title: string;
  watchProgress: WatchProgressSnapshot | null;
  sidecarSubtitles?: SidecarSubtitle[];
}

export interface SidecarSubtitle {
  label: string;
  url: string;
  type: 'srt' | 'vtt' | 'ass';
}

export interface WatchProgressSnapshot {
  positionSeconds: number;
  durationSeconds: number;
  completed: boolean;
  updatedAt: string;
}

export interface WatchProgressUpdate {
  mediaFileId: number;
  positionSeconds: number;
  durationSeconds: number;
  completed?: boolean;
}

export interface LastWatchedInfo {
  mediaFileId: number;
  matchedMovieId: number | null;
  matchedShowId: number | null;
  title: string;
  positionSeconds: number;
  durationSeconds: number;
  completed: boolean;
  updatedAt: string;
}

export interface WatchHistoryItem {
  mediaFileId: number;
  matchedMovieId: number | null;
  matchedShowId: number | null;
  title: string;
  mediaKind: MediaKind;
  posterPath: string | null;
  positionSeconds: number;
  durationSeconds: number;
  completed: boolean;
  lastWatchedAt: string;
  watchCount: number;
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
  playerStyle: PlayerStyle;
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
  autoDownloadUpdates: boolean;
  hideSidebar: boolean;
  // Playback preferences (surfaced in the onboarding "Player Configuration" step)
  hardwareAcceleration: boolean;
  preferredAudioLanguage: string;
  preferredSubtitleLanguage: string;
  resumePlayback: boolean;
  autoPlayNextEpisode: boolean;
  // First-time onboarding: completion gate + last-viewed step so progress
  // survives the app being closed mid-tour.
  onboardingCompleted: boolean;
  onboardingStep: number;
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

export interface ReleaseInfo {
  version: string;
  releasedAt: string;
  notes: string;
  changes: string[];
  downloadUrl: string;
  webViewUrl: string;
  size: number;
  /**
   * Whether a directly-installable artifact exists for the current
   * platform/arch. When false the update still exists but must be fetched
   * from the release page (webViewUrl) rather than downloaded in-app.
   */
  directDownload: boolean;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseInfo: ReleaseInfo | null;
}

export interface UpdateDownloadProgress {
  bytesDownloaded: number;
  totalBytes: number;
  percentage: number;
}

export type UpdateStatus = 'idle' | 'checking' | 'downloading' | 'downloaded' | 'installing' | 'error';

export type UpdateProgressEvent =
  | { type: 'status'; status: UpdateStatus }
  | { type: 'download-progress'; bytesDownloaded: number; totalBytes: number; percentage: number }
  | { type: 'update-available'; version: string; notes: string };

// ── mpv player IPC ──────────────────────────────────────────────────────────

export interface MpvTrack {
  id: number;
  type: 'audio' | 'sub' | 'video';
  title?: string;
  lang?: string;
  codec?: string;
  default?: boolean;
  selected?: boolean;
}

export interface MpvPropertyEvent {
  type: 'property';
  name: string;
  value: number | boolean | string | null;
}

export interface MpvLifecycleEvent {
  type: 'end-file' | 'start-file' | 'file-loaded';
}

export type MpvEvent = MpvPropertyEvent | MpvLifecycleEvent;

export interface MpvOpenRequest {
  filePath: string;
  mediaFileId: number;
  renderWidth: number;
  renderHeight: number;
}

export interface SkyMovieApi extends TorrentApi {
  onUpdateProgress(callback: (event: UpdateProgressEvent) => void): () => void;
  // mpv player
  mpvIsAvailable(): Promise<boolean>;
  mpvOpen(req: MpvOpenRequest): Promise<void>;
  mpvClose(): Promise<void>;
  mpvPlay(): Promise<void>;
  mpvPause(): Promise<void>;
  mpvSeek(seconds: number): Promise<void>;
  mpvSetVolume(percent: number): Promise<void>;
  mpvSetAudioTrack(id: number): Promise<void>;
  mpvSetSubTrack(id: number): Promise<void>;
  mpvSetSpeed(speed: number): Promise<void>;
  mpvSetRenderSize(width: number, height: number): Promise<void>;
  mpvSetSubFile(path: string): Promise<void>;
  mpvSetAudioFilter(filter: string): Promise<void>;
  onMpvFrame(callback: (jpeg: Uint8Array) => void): () => void;
  onMpvEvent(callback: (ev: MpvEvent) => void): () => void;
  onMpvTracks(callback: (tracks: MpvTrack[]) => void): () => void;
  chooseFolder(title?: string): Promise<string | null>;
  chooseFolders(title?: string): Promise<string[]>;
  scanLibrary(request?: ScanLibraryRequest | string): Promise<ScanResult | null>;
  scanLibraries(request?: ScanLibrariesRequest | string[]): Promise<ScanResult[]>;
  getMovies(query?: string): Promise<Movie[]>;
  getMovieById(id: number): Promise<DetailResult<Movie>>;
  getShows(query?: string): Promise<TvShow[]>;
  getShowById(id: number): Promise<DetailResult<TvShow>>;
  getUnmatchedFiles(): Promise<MediaFile[]>;
  updateMetadata(update: MetadataUpdate): Promise<void>;
  searchMovieMetadata(request: MovieMetadataSearchRequest): Promise<MovieMetadataSearchResult[]>;
  applyMovieMetadata(request: ApplyMovieMetadataRequest): Promise<Movie>;
  searchTvMetadata(request: TvMetadataSearchRequest): Promise<TvMetadataSearchResult[]>;
  applyTvMetadata(request: ApplyTvMetadataRequest): Promise<TvShow>;
  markFileAsIgnored(fileId: number): Promise<void>;
  unmarkFileAsIgnored(fileId: number): Promise<void>;
  updateFileMatch(fileId: number, matchedMovieId: number | null, matchedShowId: number | null): Promise<void>;
  deleteMediaFile(fileId: number): Promise<void>;
  showItemInFolder(fileId: number): Promise<void>;
  playMedia(mediaFileId: number): Promise<PlayMediaResult>;
  openMediaExternally(mediaFileId: number): Promise<void>;
  updateWatchProgress(update: WatchProgressUpdate): Promise<void>;
  getLastWatched(): Promise<LastWatchedInfo | null>;
  getWatchHistory(): Promise<WatchHistoryItem[]>;
  clearWatchHistory(): Promise<void>;
  exportLibrary(request?: SyncRequest): Promise<SyncResult | null>;
  importLibrary(path?: string): Promise<SyncResult | null>;
  syncLibrary(request: SyncRequest): Promise<SyncResult | null>;
  getSettings(): Promise<AppSettings>;
  updateSettings(settings: Partial<AppSettings>): Promise<AppSettings>;
  getLibrarySummary(): Promise<LibrarySummary>;
  clearLocalLibraryData(): Promise<ClearLocalDataResult>;
  createBackup(destinationPath?: string): Promise<BackupResult | null>;
  restoreBackup(path?: string): Promise<BackupResult | null>;
  checkForUpdates(): Promise<UpdateCheckResult>;
  downloadUpdate(): Promise<void>;
  installUpdate(): Promise<void>;
  getUpdateStatus(): Promise<UpdateStatus>;
  dismissUpdateNotification(): Promise<void>;
  openExternalUrl(url: string): Promise<void>;
  getPlaylists(): Promise<Playlist[]>;
  getPlaylistById(id: number): Promise<PlaylistItem[]>;
  createPlaylist(request: CreatePlaylistRequest): Promise<Playlist>;
  updatePlaylist(request: UpdatePlaylistRequest): Promise<Playlist>;
  deletePlaylist(id: number): Promise<void>;
  addToPlaylist(request: AddToPlaylistRequest): Promise<void>;
  removeFromPlaylist(request: RemoveFromPlaylistRequest): Promise<void>;
  reorderPlaylistItem(playlistId: number, itemId: number, newSortOrder: number): Promise<void>;
  windowMinimize(): Promise<void>;
  windowMaximize(): Promise<void>;
  windowClose(): Promise<void>;
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
  getUnmatchedFiles: 'library:get-unmatched-files',
  updateMetadata: 'metadata:update',
  searchMovieMetadata: 'metadata:search-movie',
  applyMovieMetadata: 'metadata:apply-movie',
  searchTvMetadata: 'metadata:search-tv',
  applyTvMetadata: 'metadata:apply-tv',
  markFileAsIgnored: 'metadata:mark-file-ignored',
  unmarkFileAsIgnored: 'metadata:unmark-file-ignored',
  updateFileMatch: 'metadata:update-file-match',
  deleteMediaFile: 'media:delete-file',
  showItemInFolder: 'media:show-item-in-folder',
  playMedia: 'player:play-media',
  openMediaExternally: 'player:open-external',
  updateWatchProgress: 'watch:update-progress',
  getLastWatched: 'watch:get-last-watched',
  getWatchHistory: 'watch:get-history',
  clearWatchHistory: 'watch:clear-history',
  exportLibrary: 'sync:export-library',
  importLibrary: 'sync:import-library',
  syncLibrary: 'sync:sync-library',
  getSettings: 'settings:get',
  updateSettings: 'settings:update',
  getLibrarySummary: 'library:summary',
  clearLocalLibraryData: 'maintenance:clear-local-library-data',
  createBackup: 'backup:create',
  restoreBackup: 'backup:restore',
  checkForUpdates: 'update:check',
  downloadUpdate: 'update:download',
  installUpdate: 'update:install',
  openExternalUrl: 'app:open-external-url',
  getUpdateStatus: 'update:status',
  dismissUpdateNotification: 'update:dismiss-notification',
  updateProgress: 'update:progress',
  getPlaylists: 'playlist:get-all',
  getPlaylistById: 'playlist:get-by-id',
  createPlaylist: 'playlist:create',
  updatePlaylist: 'playlist:update',
  deletePlaylist: 'playlist:delete',
  addToPlaylist: 'playlist:add-item',
  removeFromPlaylist: 'playlist:remove-item',
  reorderPlaylistItem: 'playlist:reorder-item',
  // mpv
  mpvIsAvailable:    'mpv:is-available',
  mpvOpen:           'mpv:open',
  mpvClose:          'mpv:close',
  mpvPlay:           'mpv:play',
  mpvPause:          'mpv:pause',
  mpvSeek:           'mpv:seek',
  mpvSetVolume:      'mpv:set-volume',
  mpvSetAudioTrack:  'mpv:set-audio-track',
  mpvSetSubTrack:    'mpv:set-sub-track',
  mpvSetSpeed:       'mpv:set-speed',
  mpvSetRenderSize:  'mpv:set-render-size',
  mpvSetSubFile:     'mpv:set-sub-file',
  mpvSetAudioFilter: 'mpv:set-audio-filter',
  // push channels (main → renderer)
  mpvFrame:          'mpv:frame',
  mpvEvent:          'mpv:event',
  mpvTracks:         'mpv:tracks',
  // Synchronous close sent from beforeunload — kills mpv before the page unloads
  mpvForceClose:     'mpv:force-close',
  // Window controls
  windowMinimize:    'window:minimize',
  windowMaximize:    'window:maximize',
  windowClose:       'window:close',
  // Torrent
  torrentSearch:          'torrent:search',
  torrentAddMagnet:       'torrent:add-magnet',
  torrentPause:           'torrent:pause',
  torrentResume:          'torrent:resume',
  torrentRemove:          'torrent:remove',
  torrentDeleteFiles:     'torrent:delete-files',
  torrentMove:            'torrent:move',
  torrentList:            'torrent:list',
  torrentStats:           'torrent:stats',
  torrentGetSettings:     'torrent:get-settings',
  torrentUpdateSettings:  'torrent:update-settings',
  torrentOpenFolder:      'torrent:open-folder',
  torrentRecheck:         'torrent:recheck',
  torrentProgress:        'torrent:progress',   // push: main → renderer
  torrentSetPlaybackThrottle: 'torrent:set-playback-throttle',
} as const;

// ── Torrent Types ────────────────────────────────────────────────────────────

export type TorrentStatus =
  | 'metadata' | 'downloading' | 'paused' | 'queued'
  | 'checking'  | 'stalled'    | 'completed' | 'error';

export type TorrentCategory = 'movie' | 'tv' | 'anime' | 'malayalam' | 'other';

export interface TorrentFileInfo {
  name: string;
  path: string;
  size: number;
  progress: number;
}

export interface TorrentInfo {
  id: string;
  name: string;
  magnetUri: string;
  infoHash: string;
  status: TorrentStatus;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  downloaded: number;
  uploaded: number;
  totalSize: number;
  numPeers: number;
  numSeeds: number;
  ratio: number;
  eta: number;
  savePath: string;
  category: TorrentCategory;
  addedAt: string;
  completedAt: string | null;
  error: string | null;
  files: TorrentFileInfo[];
  posterPath: string | null;
  tmdbId: number | null;
}

export interface TorrentSearchResult {
  id: string;
  title: string;
  year: number | null;
  size: number;
  seeds: number;
  leeches: number;
  magnetUri: string;
  torrentUrl: string | null;
  quality: string | null;
  source: string | null;
  uploader: string | null;
  category: TorrentCategory;
  provider: string;
  posterUrl: string | null;
  imdbId: string | null;
  runtimeMinutes: number | null;
  addedAt: string | null;
}

export interface TorrentSearchRequest {
  query: string;
  category?: TorrentCategory | 'all';
  quality?: string;
  sortBy?: 'seeds' | 'peers' | 'size' | 'date';
  sortOrder?: 'asc' | 'desc';
}

export interface AddMagnetRequest {
  magnetUri: string;
  savePath?: string;
  category?: TorrentCategory;
  sequential?: boolean;
  paused?: boolean;
}

export interface TorrentSettings {
  downloadPath: string;
  maxSimultaneousDownloads: number;
  maxActiveTorrents: number;
  downloadSpeedLimit: number;
  uploadSpeedLimit: number;
  sequentialDownload: boolean;
  enableDht: boolean;
  enablePex: boolean;
  enableLsd: boolean;
  autoStart: boolean;
  autoSeed: boolean;
  seedRatio: number;
  autoDelete: boolean;
  moveCompleted: boolean;
  completedPath: string;
  diskCacheSizeMb: number;
  port: number;
  maxConnections: number;
}

export interface TorrentGlobalStats {
  downloadSpeed: number;
  uploadSpeed: number;
  activeTorrents: number;
  totalTorrents: number;
}

export interface TorrentProgressEvent {
  id: string;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  downloaded: number;
  uploaded: number;
  numPeers: number;
  numSeeds: number;
  eta: number;
  ratio: number;
  status: TorrentStatus;
}

export interface TorrentMoveRequest {
  id: string;
  newPath: string;
}

export interface TorrentApi {
  torrentSearch(req: TorrentSearchRequest): Promise<TorrentSearchResult[]>;
  torrentAddMagnet(req: AddMagnetRequest): Promise<TorrentInfo>;
  torrentPause(id: string): Promise<void>;
  torrentResume(id: string): Promise<void>;
  torrentRemove(id: string): Promise<void>;
  torrentDeleteFiles(id: string): Promise<void>;
  torrentMove(req: TorrentMoveRequest): Promise<void>;
  torrentList(): Promise<TorrentInfo[]>;
  torrentStats(): Promise<TorrentGlobalStats>;
  torrentGetSettings(): Promise<TorrentSettings>;
  torrentUpdateSettings(settings: Partial<TorrentSettings>): Promise<TorrentSettings>;
  torrentOpenFolder(id: string): Promise<void>;
  torrentRecheck(id: string): Promise<void>;
  torrentSetPlaybackThrottle(active: boolean): Promise<void>;
  onTorrentProgress(callback: (event: TorrentProgressEvent) => void): () => void;
}
