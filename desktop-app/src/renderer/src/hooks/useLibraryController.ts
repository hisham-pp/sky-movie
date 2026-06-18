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
  TvShow
} from '@shared/ipc';
import type { ViewMode } from '../types';

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
  const [selectedScanFolder, setSelectedScanFolder] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState('No media selected');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [metadataQuery, setMetadataQuery] = useState('');
  const [metadataResults, setMetadataResults] = useState<MovieMetadataSearchResult[]>([]);
  const [player, setPlayer] = useState<PlayMediaResult | null>(null);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [status, setStatus] = useState('Ready');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void refreshAll();
  }, []);

  useEffect(() => {
    void refreshLists();
  }, [query]);

  async function refreshAll() {
    const [nextSettings, nextSummary] = await Promise.all([
      window.skyMovie.getSettings(),
      window.skyMovie.getLibrarySummary()
    ]);

    setSettings(nextSettings);
    setScanMode(nextSettings.defaultScanMode);
    setMatcherStrategy(nextSettings.defaultMatcherStrategy);
    setExtractFileMetadata(nextSettings.extractFileMetadata);
    setSummary(nextSummary);
    await refreshLists();
  }

  async function refreshLists() {
    const [nextMovies, nextShows] = await Promise.all([
      window.skyMovie.getMovies(query),
      window.skyMovie.getShows(query)
    ]);
    setMovies(nextMovies);
    setShows(nextShows);
  }

  async function scanLibrary() {
    setBusy(true);
    try {
      const folderPath = selectedScanFolder ?? (await window.skyMovie.chooseFolder('Choose library folder'));
      if (!folderPath) {
        setStatus('Scan cancelled');
        return;
      }

      setSelectedScanFolder(folderPath);
      setStatus('Scanning selected folder...');
      const result = await window.skyMovie.scanLibrary({
        path: folderPath,
        mediaKind: scanMode,
        matcherStrategy,
        extractFileMetadata
      });

      if (result) {
        setLastScan(result);
        setStatus(`Scanned ${result.scannedFiles} files from ${result.folder.name}`);
      } else {
        setStatus('Scan cancelled');
      }

      await refreshAll();
    } catch (error) {
      setStatus(`Scan failed: ${formatError(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function chooseLibraryFolder() {
    const folderPath = await window.skyMovie.chooseFolder('Choose library folder');
    if (folderPath) {
      setSelectedScanFolder(folderPath);
      setStatus(`Selected ${folderPath}`);
    } else {
      setStatus('Folder selection cancelled');
    }
  }

  async function selectMovie(movie: Movie) {
    const details = await window.skyMovie.getMovieById(movie.id);
    setSelectedMovie(movie);
    setSelectedTitle(movie.title);
    setSelectedFiles(details.files);
    setMetadataQuery(`${movie.title}${movie.releaseYear ? ` ${movie.releaseYear}` : ''}`);
    setMetadataResults([]);
  }

  async function selectShow(show: TvShow) {
    const details = await window.skyMovie.getShowById(show.id);
    setSelectedMovie(null);
    setSelectedTitle(show.title);
    setSelectedFiles(details.files);
    setMetadataResults([]);
  }

  async function play(file: MediaFile) {
    const result = await window.skyMovie.playMedia(file.id);
    setPlayer(result);
    setStatus(`Playing ${result.title}`);
  }

  async function saveSettings(update: Partial<AppSettings>) {
    const next = await window.skyMovie.updateSettings(update);
    setSettings(next);
    setScanMode(next.defaultScanMode);
    setMatcherStrategy(next.defaultMatcherStrategy);
    setExtractFileMetadata(next.extractFileMetadata);
    setStatus('Settings saved');
  }

  async function clearLocalData() {
    setBusy(true);
    try {
      const result = await window.skyMovie.clearLocalLibraryData();
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
      const result = await window.skyMovie.createBackup();
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
      const result = await window.skyMovie.restoreBackup();
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
      const result = await window.skyMovie.exportLibrary({
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
      const results = await window.skyMovie.searchMovieMetadata({
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
      const updatedMovie = await window.skyMovie.applyMovieMetadata({
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
    selectedScanFolder,
    selectedTitle,
    selectedMovie,
    selectedFiles,
    metadataQuery,
    setMetadataQuery,
    metadataResults,
    player,
    lastScan,
    status,
    busy,
    chooseLibraryFolder,
    scanLibrary,
    selectMovie,
    selectShow,
    play,
    saveSettings,
    clearLocalData,
    createBackup,
    restoreBackup,
    downloadLocalFiles,
    searchSelectedMovieMetadata,
    applySelectedMovieMetadata
  };
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
