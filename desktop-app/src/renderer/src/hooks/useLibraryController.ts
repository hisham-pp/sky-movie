import { useEffect, useState } from 'react';
import type {
  AddToPlaylistRequest,
  AppSettings,
  CreatePlaylistRequest,
  Episode,
  LibraryScanMode,
  LibrarySummary,
  MatcherStrategy,
  MediaFile,
  Movie,
  MovieMetadataSearchResult,
  Playlist,
  PlaylistItem,
  PlayMediaResult,
  RemoveFromPlaylistRequest,
  ScanResult,
  SkyMovieApi,
  TvMetadataSearchResult,
  TvShow,
  UpdatePlaylistRequest
} from '@shared/ipc';
import type { ViewMode } from '../types';

interface PendingMovieMetadataPrompt {
  movie: Movie;
  results: MovieMetadataSearchResult[];
}

interface AutoMetadataSummary {
  applied: number;
  queued: number;
  skipped: number;
  failed: number;
}

export function useLibraryController() {
  // Load persisted view from localStorage, default to 'movies'
  const getInitialView = (): ViewMode => {
    try {
      const savedView = localStorage.getItem('sky-movie-view');
      if (savedView && ['movies', 'shows', 'playlists', 'scan', 'settings'].includes(savedView)) {
        return savedView as ViewMode;
      }
    } catch (error) {
      console.error('Failed to load persisted view:', error);
    }
    return 'movies';
  };

  const [view, setView] = useState<ViewMode>(getInitialView());
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<TvShow[]>([]);
  const [summary, setSummary] = useState<LibrarySummary | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [scanMode, setScanMode] = useState<LibraryScanMode>('mixed');
  const [matcherStrategy, setMatcherStrategy] = useState<MatcherStrategy>('auto');
  const [extractFileMetadata, setExtractFileMetadata] = useState(true);
  const [libraryFolders, setLibraryFolders] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState('No media selected');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedShow, setSelectedShow] = useState<TvShow | null>(null);
  const [selectedEpisodes, setSelectedEpisodes] = useState<Episode[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [metadataQuery, setMetadataQuery] = useState('');
  const [metadataResults, setMetadataResults] = useState<Array<MovieMetadataSearchResult | TvMetadataSearchResult>>([]);
  const [metadataPromptQueue, setMetadataPromptQueue] = useState<PendingMovieMetadataPrompt[]>([]);
  const [player, setPlayer] = useState<PlayMediaResult | null>(null);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [status, setStatus] = useState('Ready');
  const [busy, setBusy] = useState(false);
  const [unmatchedFiles, setUnmatchedFiles] = useState<MediaFile[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);

  useEffect(() => {
    void refreshAll().catch((error) => {
      setStatus(`Startup failed: ${formatError(error)}`);
    });
  }, []);

  useEffect(() => {
    void refreshLists().catch((error) => {
      setStatus(`Refresh failed: ${formatError(error)}`);
    });
  }, [query]);

  async function refreshAll() {
    const api = getSkyMovieApi();
    const [nextSettings, nextSummary, nextPlaylists] = await Promise.all([
      api.getSettings(),
      api.getLibrarySummary(),
      api.getPlaylists()
    ]);

    setSettings(nextSettings);
    setScanMode(nextSettings.defaultScanMode);
    setMatcherStrategy(nextSettings.defaultMatcherStrategy);
    setExtractFileMetadata(nextSettings.extractFileMetadata);
    setLibraryFolders(nextSettings.libraryFolders ?? []);
    setSummary(nextSummary);
    setPlaylists(nextPlaylists);
    await refreshLists();
    await refreshUnmatchedFiles();
  }

  async function refreshLists() {
    const api = getSkyMovieApi();
    const [nextMovies, nextShows] = await Promise.all([
      api.getMovies(query),
      api.getShows(query)
    ]);
    setMovies(nextMovies);
    setShows(nextShows);
  }

  async function refreshUnmatchedFiles() {
    try {
      const api = getSkyMovieApi();
      const files = await api.getUnmatchedFiles();
      setUnmatchedFiles(files);
    } catch (error) {
      console.error('Failed to fetch unmatched files:', error);
      setUnmatchedFiles([]);
    }
  }

  async function scanLibrary() {
    setBusy(true);
    try {
      const api = getSkyMovieApi();
      const folderPath = libraryFolders[0] ?? (await api.chooseFolder('Choose library folder'));
      if (!folderPath) {
        setStatus('Scan cancelled');
        return;
      }

      setStatus('Scanning selected folder...');
      const result = await api.scanLibrary({
        path: folderPath,
        mediaKind: scanMode,
        matcherStrategy,
        extractFileMetadata
      });

      if (result) {
        setLastScan(result);
        setStatus(`Scanned ${result.scannedFiles} files from ${result.folder.name}`);
        const metadataSummary = await loadScannedMovieMetadata(result.movieIds);
        await refreshAll();
        setStatus(formatScanStatus(`Scanned ${result.scannedFiles} files from ${result.folder.name}`, metadataSummary));
      } else {
        setStatus('Scan cancelled');
      }
    } catch (error) {
      setStatus(`Scan failed: ${formatError(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function chooseLibraryFolders() {
    try {
      const pickedFolders = await getSkyMovieApi().chooseFolders('Choose library folders');
      if (pickedFolders.length) {
        const nextFolders = [...new Set([...libraryFolders, ...pickedFolders])];
        setLibraryFolders(nextFolders);
        await saveSettings({ libraryFolders: nextFolders });
        setStatus(`Selected ${pickedFolders.length} folder${pickedFolders.length === 1 ? '' : 's'}`);
      } else {
        setStatus('Folder selection cancelled');
      }
    } catch (error) {
      setStatus(`Folder selection failed: ${formatError(error)}`);
    }
  }

  async function removeLibraryFolder(path: string) {
    const nextFolders = libraryFolders.filter((folder) => folder !== path);
    setLibraryFolders(nextFolders);
    await saveSettings({ libraryFolders: nextFolders });
    setStatus('Library folder removed');
  }

  async function scanLibraries() {
    setBusy(true);
    try {
      let foldersToScan = libraryFolders;
      if (!foldersToScan.length) {
        foldersToScan = await getSkyMovieApi().chooseFolders('Choose library folders');
        if (!foldersToScan.length) {
          setStatus('Scan cancelled');
          return;
        }
        foldersToScan = [...new Set(foldersToScan)];
        setLibraryFolders(foldersToScan);
        await saveSettings({ libraryFolders: foldersToScan });
      }

      setStatus(`Scanning ${foldersToScan.length} librar${foldersToScan.length === 1 ? 'y' : 'ies'}...`);
      const results = await getSkyMovieApi().scanLibraries({
        paths: foldersToScan,
        mediaKind: scanMode,
        matcherStrategy,
        extractFileMetadata
      });
      const scannedFiles = results.reduce((total, result) => total + result.scannedFiles, 0);
      const movieIds = results.flatMap((result) => result.movieIds);
      setLastScan(results.at(-1) ?? null);
      const metadataSummary = await loadScannedMovieMetadata(movieIds);
      await refreshAll();
      setStatus(
        formatScanStatus(
          `Scanned ${scannedFiles} files from ${results.length} librar${results.length === 1 ? 'y' : 'ies'}`,
          metadataSummary
        )
      );
    } catch (error) {
      setStatus(`Scan failed: ${formatError(error)}`);
    } finally {
      setBusy(false);
    }
  }

  function changeView(nextView: ViewMode) {
    setView(nextView);
    setSelectedMovie(null);
    setSelectedShow(null);
    setSelectedEpisodes([]);
    setSelectedFiles([]);
    setMetadataResults([]);
    setSelectedTitle('No media selected');
    
    // Persist view to localStorage
    try {
      localStorage.setItem('sky-movie-view', nextView);
    } catch (error) {
      console.error('Failed to persist view:', error);
    }
  }

  function backToLibrary() {
    setSelectedMovie(null);
    setSelectedShow(null);
    setSelectedEpisodes([]);
    setSelectedFiles([]);
    setMetadataResults([]);
    setSelectedTitle('No media selected');
    // Clear player when going back to library
    setPlayer(null);
  }

  async function selectMovie(movie: Movie) {
    const details = await getSkyMovieApi().getMovieById(movie.id);
    const selected = details.item ?? movie;
    setSelectedMovie(selected);
    setSelectedShow(null);
    setSelectedEpisodes([]);
    setSelectedTitle(selected.title);
    setSelectedFiles(details.files);
    setMetadataQuery(`${selected.title}${selected.releaseYear ? ` ${selected.releaseYear}` : ''}`);
    setMetadataResults([]);
    
    // Clear player when selecting a different movie
    setPlayer(null);
    
    // Auto-play first file if available
    if (details.files.length > 0) {
      const firstFile = details.files[0];
      const result = await getSkyMovieApi().playMedia(firstFile.id);
      setPlayer(result);
      setStatus(`Playing ${result.title}`);
    }
  }

  async function viewMovieDetails(movie: Movie) {
    await selectMovie(movie);
    setView('movies');
  }

  async function selectShow(show: TvShow) {
    const details = await getSkyMovieApi().getShowById(show.id);
    const selected = details.item ?? show;
    setSelectedShow(selected);
    setSelectedMovie(null);
    setSelectedEpisodes(details.episodes ?? []);
    setSelectedTitle(selected.title);
    setSelectedFiles(details.files);
    setMetadataQuery(`${selected.title}${selected.firstAirYear ? ` ${selected.firstAirYear}` : ''}`);
    setMetadataResults([]);
    
    // Clear player when selecting a different show
    setPlayer(null);
    
    // Auto-play first episode file if available
    if (details.files.length > 0) {
      // Try to find first episode (S01E01) or just use first file
      const firstEpisodeFile = details.files.find((file) => {
        const fileName = file.fileName.toLowerCase();
        return /s0*1e0*1|1x0*1/i.test(fileName);
      }) ?? details.files[0];
      
      const result = await getSkyMovieApi().playMedia(firstEpisodeFile.id);
      setPlayer(result);
      setStatus(`Playing ${result.title}`);
    }
  }

  async function viewShowDetails(show: TvShow) {
    await selectShow(show);
    setView('shows');
  }

  async function play(file: MediaFile) {
    const result = await getSkyMovieApi().playMedia(file.id);
    setPlayer(result);
    setStatus(`Playing ${result.title}`);
  }

  async function openExternal(mediaFileId: number) {
    try {
      await getSkyMovieApi().openMediaExternally(mediaFileId);
      setStatus('Opened in system player');
    } catch (error) {
      setStatus(`External player failed: ${formatError(error)}`);
    }
  }

  async function saveSettings(update: Partial<AppSettings>) {
    const next = await getSkyMovieApi().updateSettings(update);
    setSettings(next);
    setScanMode(next.defaultScanMode);
    setMatcherStrategy(next.defaultMatcherStrategy);
    setExtractFileMetadata(next.extractFileMetadata);
    setLibraryFolders(next.libraryFolders ?? []);
    setStatus('Settings saved');
  }

  async function clearLocalData() {
    setBusy(true);
    try {
      const result = await getSkyMovieApi().clearLocalLibraryData();
      setMovies([]);
      setShows([]);
      setSelectedMovie(null);
      setSelectedShow(null);
      setSelectedEpisodes([]);
      setSelectedFiles([]);
      setPlayer(null);
      await refreshAll();
      setStatus(`Cleared ${result.removedRows} local records and cache files`);
    } catch (error) {
      setStatus(`Clear failed: ${formatError(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function createBackup() {
    try {
      const result = await getSkyMovieApi().createBackup();
      if (result) {
        setStatus(`Backup saved with ${result.rowCount} rows`);
      } else {
        setStatus('Backup cancelled');
      }
    } catch (error) {
      setStatus(`Backup failed: ${formatError(error)}`);
    }
  }

  async function restoreBackup() {
    setBusy(true);
    try {
      const result = await getSkyMovieApi().restoreBackup();
      if (result) {
        await refreshAll();
        setStatus(`Restored backup with ${result.rowCount} rows`);
      } else {
        setStatus('Restore cancelled');
      }
    } catch (error) {
      setStatus(`Restore failed: ${formatError(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function downloadLocalFiles() {
    setBusy(true);
    setStatus('Preparing local download...');
    try {
      const result = await getSkyMovieApi().exportLibrary({
        type: 'files',
        includeMediaFiles: true,
        preserveFolderStructure: true,
        mediaKind: scanMode
      });

      if (result) {
        setStatus(`Downloaded ${result.fileCount} files to ${result.destinationPath}`);
      } else {
        setStatus('Local download cancelled');
      }
    } catch (error) {
      setStatus(`Local download failed: ${formatError(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function searchSelectedMovieMetadata() {
    if (!selectedMovie) {
      setStatus('Select a movie before searching metadata');
      return;
    }

    setBusy(true);
    try {
      const results = await getSkyMovieApi().searchMovieMetadata({
        query: metadataQuery || selectedMovie.title,
        year: selectedMovie.releaseYear
      });
      setMetadataResults(results);
      setStatus(results.length ? `Found ${results.length} metadata matches` : 'No metadata matches found');
    } catch (error) {
      setStatus(`Metadata search failed: ${formatError(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function applySelectedMovieMetadata(result: MovieMetadataSearchResult) {
    if (!selectedMovie) {
      setStatus('Select a movie before applying metadata');
      return;
    }

    setBusy(true);
    try {
      const updatedMovie = await getSkyMovieApi().applyMovieMetadata({
        movieId: selectedMovie.id,
        provider: result.provider,
        providerId: result.providerId
      });
      setSelectedMovie(updatedMovie);
      setSelectedTitle(updatedMovie.title);
      setMetadataQuery(`${updatedMovie.title}${updatedMovie.releaseYear ? ` ${updatedMovie.releaseYear}` : ''}`);
      setMetadataResults([]);
      await refreshLists();
      setStatus(`Applied metadata for ${updatedMovie.title}`);
    } catch (error) {
      setStatus(`Apply metadata failed: ${formatError(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function searchSelectedMetadata() {
    if (!selectedMovie && !selectedShow) {
      setStatus('Select a movie or TV show before searching metadata');
      return;
    }

    setBusy(true);
    try {
      const api = getSkyMovieApi();
      if (selectedMovie) {
        const results = await api.searchMovieMetadata({
          query: metadataQuery || selectedMovie.title,
          year: selectedMovie.releaseYear
        });
        setMetadataResults(results);
        setStatus(results.length ? `Found ${results.length} movie metadata matches` : 'No movie metadata matches found');
      } else if (selectedShow) {
        const results = await api.searchTvMetadata({
          query: metadataQuery || selectedShow.title,
          year: selectedShow.firstAirYear
        });
        setMetadataResults(results);
        setStatus(results.length ? `Found ${results.length} TV metadata matches` : 'No TV metadata matches found');
      }
    } catch (error) {
      setStatus(`Metadata search failed: ${formatError(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function applySelectedMetadata(result: MovieMetadataSearchResult | TvMetadataSearchResult) {
    if (!selectedMovie && !selectedShow) {
      setStatus('Select a movie or TV show before applying metadata');
      return;
    }

    setBusy(true);
    try {
      const api = getSkyMovieApi();
      if (selectedMovie) {
        const updatedMovie = await api.applyMovieMetadata({
          movieId: selectedMovie.id,
          provider: result.provider,
          providerId: result.providerId
        });
        setSelectedMovie(updatedMovie);
        setSelectedTitle(updatedMovie.title);
        setMetadataQuery(`${updatedMovie.title}${updatedMovie.releaseYear ? ` ${updatedMovie.releaseYear}` : ''}`);
        setStatus(`Applied metadata for ${updatedMovie.title}`);
      } else if (selectedShow) {
        const updatedShow = await api.applyTvMetadata({
          showId: selectedShow.id,
          provider: result.provider,
          providerId: result.providerId
        });
        setSelectedShow(updatedShow);
        setSelectedTitle(updatedShow.title);
        setMetadataQuery(`${updatedShow.title}${updatedShow.firstAirYear ? ` ${updatedShow.firstAirYear}` : ''}`);
        setStatus(`Applied metadata for ${updatedShow.title}`);
      }
      setMetadataResults([]);
      await refreshLists();
    } catch (error) {
      setStatus(`Apply metadata failed: ${formatError(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function searchUnmatchedFileMetadata(file: MediaFile, query: string): Promise<Array<MovieMetadataSearchResult | TvMetadataSearchResult>> {
    try {
      const api = getSkyMovieApi();
      if (file.mediaKind === 'movie') {
        return await api.searchMovieMetadata({ query });
      } else {
        return await api.searchTvMetadata({ query });
      }
    } catch (error) {
      console.error('Search unmatched file metadata failed:', error);
      return [];
    }
  }

  async function applyUnmatchedFileMetadata(file: MediaFile, result: MovieMetadataSearchResult | TvMetadataSearchResult): Promise<void> {
    try {
      const api = getSkyMovieApi();
      
      if (file.mediaKind === 'movie' && 'releaseYear' in result) {
        // Apply movie metadata - this will create a new movie entry
        const movie = await api.applyMovieMetadata({
          movieId: 0, // 0 means create new
          provider: result.provider,
          providerId: result.providerId
        });
        
        // Update file to link to this movie
        await api.updateFileMatch(file.id, movie.id, null);
      } else if (file.mediaKind === 'show' && 'firstAirYear' in result) {
        // Apply show metadata - this will create a new show entry
        const show = await api.applyTvMetadata({
          showId: 0, // 0 means create new
          provider: result.provider,
          providerId: result.providerId
        });
        
        // Update file to link to this show
        await api.updateFileMatch(file.id, null, show.id);
      }
      
      // Refresh the unmatched files list
      await refreshUnmatchedFiles();
      await refreshLists();
      setStatus(`Successfully matched ${file.fileName}`);
    } catch (error) {
      setStatus(`Failed to apply metadata: ${formatError(error)}`);
      throw error;
    }
  }

  async function markFileAsIgnored(fileId: number): Promise<void> {
    try {
      const api = getSkyMovieApi();
      await api.markFileAsIgnored(fileId);
      await refreshUnmatchedFiles();
      setStatus('File marked as ignored');
    } catch (error) {
      setStatus(`Failed to mark file as ignored: ${formatError(error)}`);
      throw error;
    }
  }

  async function deleteFile(file: MediaFile): Promise<void> {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${file.fileName}"?\n\nThis will:\n• Permanently delete the file from disk\n• Remove it from the database\n• Clean up associated movie/series if no other files exist`
    );
    
    if (!confirmed) {
      return;
    }

    setBusy(true);
    try {
      const api = getSkyMovieApi();
      await api.deleteMediaFile(file.id);
      
      // Refresh the current view
      if (selectedMovie) {
        const details = await api.getMovieById(selectedMovie.id);
        setSelectedFiles(details.files);
        // If movie has no more files, go back to library
        if (details.files.length === 0) {
          backToLibrary();
        }
      } else if (selectedShow) {
        const details = await api.getShowById(selectedShow.id);
        setSelectedFiles(details.files);
        setSelectedEpisodes(details.episodes ?? []);
        // If show has no more files, go back to library
        if (details.files.length === 0) {
          backToLibrary();
        }
      }
      
      await refreshLists();
      setStatus(`Deleted ${file.fileName}`);
    } catch (error) {
      setStatus(`Failed to delete file: ${formatError(error)}`);
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function showItemInFolder(file: MediaFile): Promise<void> {
    try {
      const api = getSkyMovieApi();
      await api.showItemInFolder(file.id);
      setStatus(`Opened file manager for ${file.fileName}`);
    } catch (error) {
      setStatus(`Failed to open file manager: ${formatError(error)}`);
      throw error;
    }
  }

  async function createPlaylist(request: CreatePlaylistRequest): Promise<void> {
    setBusy(true);
    try {
      const api = getSkyMovieApi();
      const newPlaylist = await api.createPlaylist(request);
      setPlaylists((prev) => [...prev, newPlaylist]);
      setStatus(`Created playlist "${newPlaylist.name}"`);
    } catch (error) {
      setStatus(`Failed to create playlist: ${formatError(error)}`);
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function updatePlaylist(request: UpdatePlaylistRequest): Promise<void> {
    setBusy(true);
    try {
      const api = getSkyMovieApi();
      const updatedPlaylist = await api.updatePlaylist(request);
      setPlaylists((prev) => prev.map((p) => (p.id === updatedPlaylist.id ? updatedPlaylist : p)));
      if (selectedPlaylist?.id === updatedPlaylist.id) {
        setSelectedPlaylist(updatedPlaylist);
      }
      setStatus(`Updated playlist "${updatedPlaylist.name}"`);
    } catch (error) {
      setStatus(`Failed to update playlist: ${formatError(error)}`);
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function deletePlaylist(id: number): Promise<void> {
    const confirmed = window.confirm('Are you sure you want to delete this playlist?');
    if (!confirmed) {
      return;
    }

    setBusy(true);
    try {
      const api = getSkyMovieApi();
      await api.deletePlaylist(id);
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
      if (selectedPlaylist?.id === id) {
        setSelectedPlaylist(null);
        setPlaylistItems([]);
      }
      setStatus('Playlist deleted');
    } catch (error) {
      setStatus(`Failed to delete playlist: ${formatError(error)}`);
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function selectPlaylist(playlist: Playlist): Promise<void> {
    setSelectedPlaylist(playlist);
    try {
      const api = getSkyMovieApi();
      const items = await api.getPlaylistById(playlist.id);
      setPlaylistItems(items);
      setSelectedTitle(playlist.name);
    } catch (error) {
      setStatus(`Failed to load playlist: ${formatError(error)}`);
    }
  }

  async function addToPlaylist(request: AddToPlaylistRequest): Promise<void> {
    try {
      const api = getSkyMovieApi();
      await api.addToPlaylist(request);
      setStatus('Added to playlist');
      await refreshPlaylists();
      if (selectedPlaylist?.id === request.playlistId) {
        await selectPlaylist(selectedPlaylist);
      }
    } catch (error) {
      setStatus(`Failed to add to playlist: ${formatError(error)}`);
      throw error;
    }
  }

  async function removeFromPlaylist(request: RemoveFromPlaylistRequest): Promise<void> {
    try {
      const api = getSkyMovieApi();
      await api.removeFromPlaylist(request);
      setStatus('Removed from playlist');
      if (selectedPlaylist?.id === request.playlistId) {
        await selectPlaylist(selectedPlaylist);
      }
      await refreshPlaylists();
    } catch (error) {
      setStatus(`Failed to remove from playlist: ${formatError(error)}`);
      throw error;
    }
  }

  async function reorderPlaylistItem(playlistId: number, itemId: number, newSortOrder: number): Promise<void> {
    try {
      const api = getSkyMovieApi();
      await api.reorderPlaylistItem(playlistId, itemId, newSortOrder);
      if (selectedPlaylist?.id === playlistId) {
        await selectPlaylist(selectedPlaylist);
      }
    } catch (error) {
      setStatus(`Failed to reorder playlist: ${formatError(error)}`);
      throw error;
    }
  }

  async function refreshPlaylists(): Promise<void> {
    try {
      const api = getSkyMovieApi();
      const nextPlaylists = await api.getPlaylists();
      setPlaylists(nextPlaylists);
    } catch (error) {
      console.error('Failed to refresh playlists:', error);
    }
  }

  async function loadScannedMovieMetadata(movieIds: number[]): Promise<AutoMetadataSummary | null> {
    const uniqueMovieIds = [...new Set(movieIds)];
    if (!uniqueMovieIds.length) {
      return null;
    }

    const api = getSkyMovieApi();
    const currentSettings = await api.getSettings();
    if (!currentSettings.tmdbApiKey.trim()) {
      return null;
    }

    const summary: AutoMetadataSummary = {
      applied: 0,
      queued: 0,
      skipped: 0,
      failed: 0
    };
    const prompts: PendingMovieMetadataPrompt[] = [];

    for (const movieId of uniqueMovieIds) {
      const details = await api.getMovieById(movieId);
      const movie = details.item;
      if (!movie) {
        continue;
      }

      if (hasLocalMovieMetadata(movie)) {
        summary.skipped += 1;
        continue;
      }

      try {
        const results = await api.searchMovieMetadata({
          query: movie.title,
          year: movie.releaseYear
        });

        if (results.length === 1) {
          const [result] = results;
          await api.applyMovieMetadata({
            movieId: movie.id,
            provider: result.provider,
            providerId: result.providerId
          });
          summary.applied += 1;
        } else if (results.length > 1) {
          prompts.push({ movie, results });
          summary.queued += 1;
        }
      } catch {
        summary.failed += 1;
      }
    }

    if (prompts.length) {
      setMetadataPromptQueue((current) => [...current, ...prompts]);
    }

    return summary;
  }

  async function applyPromptMetadata(result: MovieMetadataSearchResult) {
    const prompt = metadataPromptQueue[0];
    if (!prompt) {
      return;
    }

    setBusy(true);
    try {
      const updatedMovie = await getSkyMovieApi().applyMovieMetadata({
        movieId: prompt.movie.id,
        provider: result.provider,
        providerId: result.providerId
      });

      if (selectedMovie?.id === updatedMovie.id) {
        setSelectedMovie(updatedMovie);
        setSelectedTitle(updatedMovie.title);
        setMetadataQuery(`${updatedMovie.title}${updatedMovie.releaseYear ? ` ${updatedMovie.releaseYear}` : ''}`);
      }

      setMetadataPromptQueue((current) => current.slice(1));
      await refreshLists();
      setStatus(`Applied metadata for ${updatedMovie.title}`);
    } catch (error) {
      setStatus(`Apply metadata failed: ${formatError(error)}`);
    } finally {
      setBusy(false);
    }
  }

  function skipPromptMetadata() {
    const prompt = metadataPromptQueue[0];
    setMetadataPromptQueue((current) => current.slice(1));
    if (prompt) {
      setStatus(`Skipped TMDB metadata for ${prompt.movie.title}`);
    }
  }

  return {
    view,
    setView: changeView,
    query,
    setQuery,
    movies,
    shows,
    summary,
    settings,
    scanMode,
    setScanMode,
    matcherStrategy,
    setMatcherStrategy,
    extractFileMetadata,
    setExtractFileMetadata,
    libraryFolders,
    selectedTitle,
    selectedMovie,
    selectedShow,
    selectedEpisodes,
    selectedFiles,
    metadataQuery,
    setMetadataQuery,
    metadataResults,
    metadataPrompt: metadataPromptQueue[0] ?? null,
    player,
    lastScan,
    status,
    busy,
    unmatchedFiles,
    playlists,
    selectedPlaylist,
    playlistItems,
    chooseLibraryFolders,
    removeLibraryFolder,
    scanLibrary,
    scanLibraries,
    selectMovie,
    selectShow,
    selectPlaylist,
    viewMovieDetails,
    viewShowDetails,
    backToLibrary,
    play,
    openExternal,
    saveSettings,
    clearLocalData,
    createBackup,
    restoreBackup,
    downloadLocalFiles,
    searchSelectedMovieMetadata,
    applySelectedMovieMetadata,
    searchSelectedMetadata,
    applySelectedMetadata,
    applyPromptMetadata,
    skipPromptMetadata,
    searchUnmatchedFileMetadata,
    applyUnmatchedFileMetadata,
    markFileAsIgnored,
    deleteFile,
    showItemInFolder,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    reorderPlaylistItem
  };
}

function getSkyMovieApi(): SkyMovieApi {
  if (!window.skyMovie) {
    throw new Error('Sky Movie desktop bridge is unavailable. Restart the Electron app so the preload script can load.');
  }

  return window.skyMovie;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function hasLocalMovieMetadata(movie: Movie): boolean {
  return Boolean(
    movie.originalTitle ||
      movie.overview ||
      movie.posterPath ||
      movie.backdropPath ||
      movie.runtimeMinutes != null ||
      movie.rating != null
  );
}

function formatScanStatus(base: string, metadataSummary: AutoMetadataSummary | null): string {
  if (!metadataSummary) {
    return base;
  }

  const parts = [];
  if (metadataSummary.applied) {
    parts.push(`${metadataSummary.applied} TMDB match${metadataSummary.applied === 1 ? '' : 'es'} applied`);
  }
  if (metadataSummary.queued) {
    parts.push(`${metadataSummary.queued} need${metadataSummary.queued === 1 ? 's' : ''} review`);
  }
  if (metadataSummary.failed) {
    parts.push(`${metadataSummary.failed} TMDB lookup${metadataSummary.failed === 1 ? '' : 's'} failed`);
  }

  return parts.length ? `${base}; ${parts.join(', ')}` : base;
}
