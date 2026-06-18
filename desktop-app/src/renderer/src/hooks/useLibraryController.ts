import { useEffect, useState } from 'react';
import type {
  AppSettings,
  LibraryScanMode,
  LibrarySummary,
  MatcherStrategy,
  MediaFile,
  Movie,
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
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
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
    setSelectedTitle(movie.title);
    setSelectedFiles(details.files);
  }

  async function selectShow(show: TvShow) {
    const details = await window.skyMovie.getShowById(show.id);
    setSelectedTitle(show.title);
    setSelectedFiles(details.files);
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
    selectedFiles,
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
    downloadLocalFiles
  };
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
