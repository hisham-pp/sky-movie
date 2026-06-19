import { useEffect, useState } from 'react';
import type {
  AppSettings,
  LibraryScanMode,
  LibrarySummary,
  MatcherStrategy,
  MediaFile,
  Movie,
  MovieMetadataSearchResult,
  PlayMediaResult,
  ScanResult,
  SkyMovieApi,
  TvMetadataSearchResult,
  TvShow
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
  const [view, setView] = useState<ViewMode>('movies');
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
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [metadataQuery, setMetadataQuery] = useState('');
  const [metadataResults, setMetadataResults] = useState<Array<MovieMetadataSearchResult | TvMetadataSearchResult>>([]);
  const [metadataPromptQueue, setMetadataPromptQueue] = useState<PendingMovieMetadataPrompt[]>([]);
  const [player, setPlayer] = useState<PlayMediaResult | null>(null);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [status, setStatus] = useState('Ready');
  const [busy, setBusy] = useState(false);

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
    const [nextSettings, nextSummary] = await Promise.all([
      api.getSettings(),
      api.getLibrarySummary()
    ]);

    setSettings(nextSettings);
    setScanMode(nextSettings.defaultScanMode);
    setMatcherStrategy(nextSettings.defaultMatcherStrategy);
    setExtractFileMetadata(nextSettings.extractFileMetadata);
    setLibraryFolders(nextSettings.libraryFolders ?? []);
    setSummary(nextSummary);
    await refreshLists();
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

  async function selectMovie(movie: Movie) {
    const details = await getSkyMovieApi().getMovieById(movie.id);
    setSelectedMovie(movie);
    setSelectedShow(null);
    setSelectedTitle(movie.title);
    setSelectedFiles(details.files);
    setMetadataQuery(`${movie.title}${movie.releaseYear ? ` ${movie.releaseYear}` : ''}`);
    setMetadataResults([]);
  }

  async function selectShow(show: TvShow) {
    const details = await getSkyMovieApi().getShowById(show.id);
    setSelectedMovie(null);
    setSelectedShow(show);
    setSelectedTitle(show.title);
    setSelectedFiles(details.files);
    setMetadataQuery(`${show.title}${show.firstAirYear ? ` ${show.firstAirYear}` : ''}`);
    setMetadataResults([]);
  }

  async function play(file: MediaFile) {
    const result = await getSkyMovieApi().playMedia(file.id);
    setPlayer(result);
    setStatus(`Playing ${result.title}`);
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
    setView,
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
    selectedFiles,
    metadataQuery,
    setMetadataQuery,
    metadataResults,
    metadataPrompt: metadataPromptQueue[0] ?? null,
    player,
    lastScan,
    status,
    busy,
    chooseLibraryFolders,
    removeLibraryFolder,
    scanLibrary,
    scanLibraries,
    selectMovie,
    selectShow,
    play,
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
    skipPromptMetadata
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
