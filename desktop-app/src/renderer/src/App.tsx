import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArchiveRestore,
  DatabaseBackup,
  Download,
  Eraser,
  Film,
  FolderSearch,
  HardDrive,
  Play,
  RefreshCw,
  Search,
  Settings,
  Star,
  Tv,
  Upload
} from 'lucide-react';
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

type ViewMode = 'movies' | 'shows' | 'settings';

export function App() {
  const [view, setView] = useState<ViewMode>('movies');
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<TvShow[]>([]);
  const [summary, setSummary] = useState<LibrarySummary | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [scanMode, setScanMode] = useState<LibraryScanMode>('mixed');
  const [matcherStrategy, setMatcherStrategy] = useState<MatcherStrategy>('auto');
  const [extractFileMetadata, setExtractFileMetadata] = useState(true);
  const [selectedTitle, setSelectedTitle] = useState<string>('No media selected');
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
    setStatus('Scanning selected folder...');
    try {
      const result = await window.skyMovie.scanLibrary({
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
    } finally {
      setBusy(false);
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
    } finally {
      setBusy(false);
    }
  }

  async function createBackup() {
    const result = await window.skyMovie.createBackup();
    if (result) {
      setStatus(`Backup saved with ${result.rowCount} rows`);
    }
  }

  async function restoreBackup() {
    setBusy(true);
    try {
      const result = await window.skyMovie.restoreBackup();
      if (result) {
        await refreshAll();
        setStatus(`Restored backup with ${result.rowCount} rows`);
      }
    } finally {
      setBusy(false);
    }
  }

  const visibleItems = useMemo(() => (view === 'movies' ? movies : shows), [movies, shows, view]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            S
          </div>
          <div>
            <h1>Sky Movie</h1>
            <p>Local library</p>
          </div>
        </div>

        <nav className="nav">
          <button className={view === 'movies' ? 'active' : ''} onClick={() => setView('movies')}>
            <Film size={18} />
            Movies
          </button>
          <button className={view === 'shows' ? 'active' : ''} onClick={() => setView('shows')}>
            <Tv size={18} />
            TV Shows
          </button>
          <button className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}>
            <Settings size={18} />
            Settings
          </button>
        </nav>

        <div className="summary">
          <Metric label="Movies" value={summary?.movieCount ?? 0} />
          <Metric label="Shows" value={summary?.showCount ?? 0} />
          <Metric label="Files" value={summary?.mediaFileCount ?? 0} />
        </div>
      </aside>

      <section className="workspace">
        <header className="toolbar">
          <div className="search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search library" />
          </div>

          <div className="scan-controls">
            <Select value={scanMode} onChange={(value) => setScanMode(value as LibraryScanMode)}>
              <option value="mixed">Mixed</option>
              <option value="movie">Movies only</option>
              <option value="show">TV shows only</option>
            </Select>
            <Select value={matcherStrategy} onChange={(value) => setMatcherStrategy(value as MatcherStrategy)}>
              <option value="auto">Auto finder</option>
              <option value="movie-title-year">Movie title + year</option>
              <option value="show-season-episode">Show SxxEyy</option>
              <option value="folder-name">Folder name</option>
            </Select>
            <label className="toggle">
              <input
                type="checkbox"
                checked={extractFileMetadata}
                onChange={(event) => setExtractFileMetadata(event.target.checked)}
              />
              File metadata
            </label>
            <button className="primary" disabled={busy} onClick={scanLibrary}>
              {busy ? <RefreshCw className="spin" size={18} /> : <FolderSearch size={18} />}
              Scan
            </button>
          </div>
        </header>

        {view === 'settings' ? (
          <SettingsPanel
            settings={settings}
            scanMode={scanMode}
            matcherStrategy={matcherStrategy}
            extractFileMetadata={extractFileMetadata}
            busy={busy}
            onSave={saveSettings}
            onClear={clearLocalData}
            onBackup={createBackup}
            onRestore={restoreBackup}
          />
        ) : (
          <div className="content-grid">
            <section className="library-list">
              <div className="hero-strip">
                <div>
                  <span>Continue watching</span>
                  <h2>{player?.title ?? selectedTitle}</h2>
                  <p>{selectedFiles.length ? `${selectedFiles.length} local files available` : 'Select a title from your local library'}</p>
                </div>
                <div className="hero-player">
                  <PlayerPanel player={player} />
                </div>
              </div>

              <div className="section-title">
                <h2>{view === 'movies' ? 'Current Movies' : 'Current TV Shows'}</h2>
                <span>{visibleItems.length} items</span>
              </div>
              <div className="poster-grid">
                {view === 'movies'
                  ? movies.map((movie) => <MovieTile key={movie.id} movie={movie} onClick={() => selectMovie(movie)} />)
                  : shows.map((show) => <ShowTile key={show.id} show={show} onClick={() => selectShow(show)} />)}
              </div>
            </section>

            <aside className="detail-panel">
              <div className="section-title">
                <h2>{selectedTitle}</h2>
                <span>{selectedFiles.length} files</span>
              </div>
              <div className="file-list">
                {selectedFiles.map((file) => (
                  <button key={file.id} onClick={() => play(file)}>
                    <Play size={16} />
                    <span>{file.fileName}</span>
                    <small>{formatBytes(file.fileSize)}</small>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        )}

        <footer className="statusbar">
          <span>{status}</span>
          {lastScan ? (
            <span>
              {lastScan.movieMatches} movie matches, {lastScan.showMatches} show matches
            </span>
          ) : null}
        </footer>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Select({
  value,
  onChange,
  children
}: {
  value: string;
  onChange(value: string): void;
  children: ReactNode;
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {children}
    </select>
  );
}

function MovieTile({ movie, onClick }: { movie: Movie; onClick(): void }) {
  return (
    <button className="tile" onClick={onClick}>
      <div className="poster">
        <Film size={34} />
      </div>
      <strong>{movie.title}</strong>
      <span>{movie.releaseYear ?? 'Unknown year'}</span>
      {movie.favorite ? <Star className="favorite" size={16} /> : null}
    </button>
  );
}

function ShowTile({ show, onClick }: { show: TvShow; onClick(): void }) {
  return (
    <button className="tile" onClick={onClick}>
      <div className="poster show-poster">
        <Tv size={34} />
      </div>
      <strong>{show.title}</strong>
      <span>{show.firstAirYear ?? 'Unknown year'}</span>
      {show.favorite ? <Star className="favorite" size={16} /> : null}
    </button>
  );
}

function PlayerPanel({ player }: { player: PlayMediaResult | null }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  async function updateProgress() {
    const video = videoRef.current;
    if (!video || !player || !Number.isFinite(video.duration)) {
      return;
    }

    await window.skyMovie.updateWatchProgress({
      mediaFileId: player.mediaFileId,
      positionSeconds: Math.floor(video.currentTime),
      durationSeconds: Math.floor(video.duration),
      completed: video.duration > 0 && video.currentTime / video.duration > 0.92
    });
  }

  return (
    <div className="player">
      {player ? (
        <video
          ref={videoRef}
          key={player.mediaUrl}
          src={player.mediaUrl}
          controls
          onPause={updateProgress}
          onEnded={updateProgress}
        />
      ) : (
        <div className="player-empty">
          <HardDrive size={26} />
        </div>
      )}
    </div>
  );
}

function SettingsPanel({
  settings,
  scanMode,
  matcherStrategy,
  extractFileMetadata,
  busy,
  onSave,
  onClear,
  onBackup,
  onRestore
}: {
  settings: AppSettings | null;
  scanMode: LibraryScanMode;
  matcherStrategy: MatcherStrategy;
  extractFileMetadata: boolean;
  busy: boolean;
  onSave(update: Partial<AppSettings>): void;
  onClear(): void;
  onBackup(): void;
  onRestore(): void;
}) {
  return (
    <section className="settings-layout">
      <div className="settings-group">
        <h2>Library Finder</h2>
        <label>
          Scan mode
          <Select value={settings?.defaultScanMode ?? scanMode} onChange={(value) => onSave({ defaultScanMode: value as LibraryScanMode })}>
            <option value="mixed">Mixed</option>
            <option value="movie">Movies only</option>
            <option value="show">TV shows only</option>
          </Select>
        </label>
        <label>
          Finder strategy
          <Select
            value={settings?.defaultMatcherStrategy ?? matcherStrategy}
            onChange={(value) => onSave({ defaultMatcherStrategy: value as MatcherStrategy })}
          >
            <option value="auto">Auto finder</option>
            <option value="movie-title-year">Movie title + year</option>
            <option value="show-season-episode">Show SxxEyy</option>
            <option value="folder-name">Folder name</option>
          </Select>
        </label>
        <label className="toggle wide">
          <input
            type="checkbox"
            checked={settings?.extractFileMetadata ?? extractFileMetadata}
            onChange={(event) => onSave({ extractFileMetadata: event.target.checked })}
          />
          Store movie file metadata
        </label>
      </div>

      <div className="settings-group">
        <h2>Backups</h2>
        <button onClick={onBackup}>
          <DatabaseBackup size={18} />
          Download backup file
        </button>
        <button onClick={onRestore}>
          <ArchiveRestore size={18} />
          Insert backup file
        </button>
      </div>

      <div className="settings-group danger-zone">
        <h2>Local Data</h2>
        <button disabled={busy} onClick={onClear}>
          <Eraser size={18} />
          Clear local library data
        </button>
        <div className="inline-actions">
          <button onClick={() => onSave({ defaultSyncIncludesFiles: true })}>
            <Upload size={18} />
            Include files
          </button>
          <button onClick={() => onSave({ defaultSyncIncludesFiles: false })}>
            <Download size={18} />
            Metadata only
          </button>
        </div>
      </div>
    </section>
  );
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  if (value < 1024 * 1024 * 1024) {
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
