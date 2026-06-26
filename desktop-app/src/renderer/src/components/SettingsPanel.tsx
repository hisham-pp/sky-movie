import { useEffect, useState } from 'react';
import {
  ArchiveRestore,
  DatabaseBackup,
  Download,
  Eraser,
  FolderPlus,
  Palette,
  RefreshCw,
  Upload,
  X
} from 'lucide-react';
import type { AppSettings, AppTheme, LibraryScanMode, MatcherStrategy, PlayerStyle, UpdateCheckResult, UpdateDownloadProgress } from '@shared/ipc';
import { Select } from './ui/Select';
import { formatBytes } from '../utils/format';

type SettingsTab = 'appearance' | 'library' | 'metadata' | 'backups' | 'downloads' | 'local-data' | 'updates';

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'library', label: 'Library' },
  { id: 'metadata', label: 'Metadata' },
  { id: 'backups', label: 'Backups' },
  { id: 'downloads', label: 'Downloads' },
  { id: 'local-data', label: 'Local Data' },
  { id: 'updates', label: 'Updates' }
];

const themePresets: Array<{
  id: AppTheme;
  name: string;
  description: string;
  swatches: [string, string, string];
}> = [
  {
    id: 'cinema',
    name: 'Cinema',
    description: 'Cinematic charcoal surfaces with sky blue focus.',
    swatches: ['#111317', '#1a1c20', '#89ceff']
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep blue surfaces with soft violet accents.',
    swatches: ['#070b18', '#8bb7ff', '#b695ff']
  },
  {
    id: 'daylight',
    name: 'Daylight',
    description: 'Clean bright layout for daytime curation.',
    swatches: ['#f7f3ea', '#2364d2', '#111317']
  },
  {
    id: 'ember',
    name: 'Ember',
    description: 'Warm theater tones with amber focus states.',
    swatches: ['#170b08', '#ffb13c', '#f04f32']
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep teal waves with aqua highlights.',
    swatches: ['#0a1a1f', '#14b8a6', '#06b6d4']
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Rich emerald tones with natural greens.',
    swatches: ['#0f1810', '#10b981', '#34d399']
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm dusk palette with golden accents.',
    swatches: ['#1a1214', '#f59e0b', '#fb923c']
  },
  {
    id: 'noir',
    name: 'Noir',
    description: 'Pure black surfaces with minimal accents.',
    swatches: ['#000000', '#404040', '#a3a3a3']
  },
  {
    id: 'lavender',
    name: 'Lavender',
    description: 'Soft purple hues with dreamy atmospherics.',
    swatches: ['#1a0f1f', '#a78bfa', '#c4b5fd']
  },
  {
    id: 'crimson',
    name: 'Crimson',
    description: 'Bold red theater with dramatic contrast.',
    swatches: ['#1a0808', '#ef4444', '#dc2626']
  }
];

const playerStylePresets: Array<{
  id: PlayerStyle;
  name: string;
  description: string;
}> = [
  {
    id: 'default',
    name: 'Default',
    description: 'Standard controls with seek bar, volume, track selection and fullscreen toggle.'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Familiar YouTube-style red progress bar with nested settings panel.'
  }
];

export function SettingsPanel({
  settings,
  scanMode,
  matcherStrategy,
  extractFileMetadata,
  libraryFolders,
  busy,
  onSave,
  onChooseFolders,
  onRemoveFolder,
  onClear,
  onBackup,
  onRestore,
  onDownloadLocal
}: {
  settings: AppSettings | null;
  scanMode: LibraryScanMode;
  matcherStrategy: MatcherStrategy;
  extractFileMetadata: boolean;
  libraryFolders: string[];
  busy: boolean;
  onSave(update: Partial<AppSettings>): void;
  onChooseFolders(): void;
  onRemoveFolder(path: string): void;
  onClear(): void;
  onBackup(): void;
  onRestore(): void;
  onDownloadLocal(): void;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [tmdbApiKey, setTmdbApiKey] = useState('');
  const [tmdbLanguage, setTmdbLanguage] = useState('en-US');
  const [updateCheckResult, setUpdateCheckResult] = useState<UpdateCheckResult | null>(null);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<UpdateDownloadProgress | null>(null);
  const activeTheme = settings?.theme ?? 'cinema';
  const activePlayerStyle = settings?.playerStyle ?? 'auto';

  useEffect(() => {
    setTmdbApiKey(settings?.tmdbApiKey ?? '');
    setTmdbLanguage(settings?.tmdbLanguage ?? 'en-US');
  }, [settings?.tmdbApiKey, settings?.tmdbLanguage]);

  useEffect(() => {
    const skyMovie = (window as any).skyMovie;
    if (!skyMovie?.onUpdateProgress) return;
    return skyMovie.onUpdateProgress((event: any) => {
      if (event.type === 'download-progress') {
        setDownloadProgress({ bytesDownloaded: event.bytesDownloaded, totalBytes: event.totalBytes, percentage: event.percentage });
      } else if (event.type === 'status' && (event.status === 'idle' || event.status === 'installing' || event.status === 'error')) {
        setDownloadProgress(null);
      }
    });
  }, []);

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      const result = await (window as any).skyMovie.checkForUpdates();
      setUpdateCheckResult(result);
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleDownloadAndInstallUpdate = async () => {
    setIsDownloadingUpdate(true);
    setDownloadProgress(null);
    try {
      await (window as any).skyMovie.downloadAndInstallUpdate();
    } catch (error) {
      console.error('Failed to download and install update:', error);
      setDownloadProgress(null);
    } finally {
      setIsDownloadingUpdate(false);
    }
  };

  return (
    <section className="settings-page">
      <header className="settings-header">
        <div>
          <h2>Settings</h2>
          <p>Manage the local vault, metadata matching, backups, and exports.</p>
        </div>
      </header>

      <div className="settings-tabs" role="tablist" aria-label="Settings sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-panel" role="tabpanel">
        {activeTab === 'appearance' ? (
          <div className="settings-section">
            <div className="settings-section-heading">
              <div>
                <h3>Theme</h3>
                <p>Pick a built-in look for the whole desktop app.</p>
              </div>
            </div>
            <div className="theme-grid">
              {themePresets.map((theme) => (
                <button
                  key={theme.id}
                  className={activeTheme === theme.id ? 'theme-card active' : 'theme-card'}
                  onClick={() => onSave({ theme: theme.id })}
                  aria-pressed={activeTheme === theme.id}
                >
                  <span className="theme-preview" aria-hidden="true">
                    {theme.swatches.map((swatch) => (
                      <span key={swatch} style={{ background: swatch }} />
                    ))}
                  </span>
                  <span>
                    <strong>
                      <Palette size={16} />
                      {theme.name}
                    </strong>
                    <small>{theme.description}</small>
                  </span>
                </button>
              ))}
            </div>

            <div className="settings-section-heading" style={{ marginTop: '2rem' }}>
              <div>
                <h3>Layout</h3>
                <p>Control which UI elements are visible.</p>
              </div>
            </div>
            <div className="settings-form-grid">
              <label className="toggle wide">
                <input
                  type="checkbox"
                  checked={settings?.hideSidebar ?? false}
                  onChange={(event) => onSave({ hideSidebar: event.target.checked })}
                />
                Hide sidebar
              </label>
            </div>

            <div className="settings-section-heading" style={{ marginTop: '2rem' }}>
              <div>
                <h3>Player</h3>
                <p>Choose which player engine to use for local media.</p>
              </div>
            </div>
            <div className="player-style-grid">
              {playerStylePresets.map((style) => (
                <button
                  key={style.id}
                  className={activePlayerStyle === style.id ? 'player-style-card active' : 'player-style-card'}
                  onClick={() => onSave({ playerStyle: style.id })}
                  aria-pressed={activePlayerStyle === style.id}
                >
                  <strong>{style.name}</strong>
                  <small>{style.description}</small>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === 'library' ? (
          <div className="settings-section">
            <div className="settings-section-heading">
              <div>
                <h3>Library Finder</h3>
                <p>Choose the local folders and matching rules used by the Scan page.</p>
              </div>
              <div className="settings-actions">
                <button disabled={busy} onClick={onChooseFolders}>
                  <FolderPlus size={18} />
                  Add folders
                </button>
              </div>
            </div>

            <div className="settings-form-grid">
              <label>
                Scan mode
                <Select
                  value={settings?.defaultScanMode ?? scanMode}
                  onChange={(value) => onSave({ defaultScanMode: value as LibraryScanMode })}
                >
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

            <div className="folder-list">
              {libraryFolders.length ? (
                libraryFolders.map((folder) => (
                  <div key={folder} className="folder-row">
                    <span title={folder}>{folder}</span>
                    <button disabled={busy} onClick={() => onRemoveFolder(folder)} title="Remove folder">
                      <X size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">No library folders selected yet.</div>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === 'metadata' ? (
          <div className="settings-section">
            <div className="settings-section-heading">
              <div>
                <h3>Metadata</h3>
                <p>Use TMDB to enrich scanned local movies and TV shows.</p>
              </div>
            </div>
            <div className="settings-form-grid">
              <label>
                TMDB API key
                <input
                  type="password"
                  value={tmdbApiKey}
                  onChange={(event) => setTmdbApiKey(event.target.value)}
                  onBlur={() => onSave({ tmdbApiKey })}
                  placeholder="Paste TMDB API key"
                />
              </label>
              <label>
                Language
                <input
                  value={tmdbLanguage}
                  onChange={(event) => setTmdbLanguage(event.target.value)}
                  onBlur={() => onSave({ tmdbLanguage })}
                  placeholder="en-US"
                />
              </label>
            </div>
          </div>
        ) : null}

        {activeTab === 'backups' ? (
          <div className="settings-section">
            <div className="settings-section-heading">
              <div>
                <h3>Backups</h3>
                <p>Save or restore your local Sky Movie database.</p>
              </div>
            </div>
            <div className="settings-actions left">
              <button disabled={busy} onClick={onBackup}>
                <DatabaseBackup size={18} />
                Download backup file
              </button>
              <button disabled={busy} onClick={onRestore}>
                <ArchiveRestore size={18} />
                Insert backup file
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === 'downloads' ? (
          <div className="settings-section">
            <div className="settings-section-heading">
              <div>
                <h3>Local Download</h3>
                <p>Export the selected local library for another device.</p>
              </div>
            </div>
            <button disabled={busy} onClick={onDownloadLocal}>
              <Download size={18} />
              Download files
            </button>
          </div>
        ) : null}

        {activeTab === 'local-data' ? (
          <div className="settings-section danger-zone">
            <div className="settings-section-heading">
              <div>
                <h3>Local Data</h3>
                <p>Clear local records or choose what sync exports include.</p>
              </div>
            </div>
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
        ) : null}

        {activeTab === 'updates' ? (
          <div className="settings-section">
            <div className="settings-section-heading">
              <div>
                <h3>Updates</h3>
                <p>Check for new versions and manage auto-download settings.</p>
              </div>
            </div>
            <div className="settings-form-grid">
              <label className="toggle wide">
                <input
                  type="checkbox"
                  checked={settings?.autoDownloadUpdates ?? false}
                  onChange={(event) => onSave({ autoDownloadUpdates: event.target.checked })}
                />
                Auto-download new versions
              </label>
            </div>
            <div className="settings-actions left">
              <button disabled={isCheckingUpdates || busy} onClick={handleCheckForUpdates}>
                <RefreshCw size={18} />
                {isCheckingUpdates ? 'Checking...' : 'Check for updates'}
              </button>
              {updateCheckResult?.hasUpdate && updateCheckResult.releaseInfo && (
                <button
                  disabled={isDownloadingUpdate || busy}
                  onClick={handleDownloadAndInstallUpdate}
                >
                  <Download size={18} />
                  {isDownloadingUpdate ? 'Downloading...' : `Download ${updateCheckResult.latestVersion}`}
                </button>
              )}
            </div>
            {downloadProgress && (
              <div className="update-download-progress">
                <div className="update-progress-label">
                  <span>Downloading update…</span>
                  <span>{Math.round(downloadProgress.percentage)}%</span>
                </div>
                <div className="update-progress-bar">
                  <div className="update-progress-fill" style={{ width: `${downloadProgress.percentage}%` }} />
                </div>
                {downloadProgress.totalBytes > 0 && (
                  <span className="update-progress-size">
                    {formatBytes(downloadProgress.bytesDownloaded)} / {formatBytes(downloadProgress.totalBytes)}
                  </span>
                )}
              </div>
            )}
            {updateCheckResult && (
              <div className="update-status">
                {updateCheckResult.hasUpdate ? (
                  <div className="update-available">
                    <strong>New version available: {updateCheckResult.latestVersion}</strong>
                    <p>Current version: {updateCheckResult.currentVersion}</p>
                    {updateCheckResult.releaseInfo && (
                      <div className="release-notes">
                        <p>{updateCheckResult.releaseInfo.notes}</p>
                        <ul>
                          {updateCheckResult.releaseInfo.changes.map((change, index) => (
                            <li key={index}>{change}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="update-current">You're on the latest version ({updateCheckResult.currentVersion})</p>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
