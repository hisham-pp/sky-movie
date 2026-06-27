import { memo, useEffect, useState, useCallback } from 'react';
import {
  ArchiveRestore,
  DatabaseBackup,
  Download,
  Eraser,
  FolderPlus,
  Palette,
  RefreshCw,
  Upload,
  X,
  Library,
  Tag,
  HardDrive,
  FolderDown,
  Database,
  Zap
} from 'lucide-react';
import type { AppSettings, AppTheme, LibraryScanMode, MatcherStrategy, PlayerStyle, UpdateCheckResult, UpdateDownloadProgress, UpdateStatus, UpdateProgressEvent } from '@shared/ipc';
import { Select } from './ui/Select';
import { Switch } from './ui/Switch';
import { formatBytes } from '../utils/format';

type SettingsTab = 'appearance' | 'library' | 'metadata' | 'backups' | 'downloads' | 'local-data' | 'updates';

const tabs: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
  { id: 'library',    label: 'Library',    icon: <Library size={16} /> },
  { id: 'metadata',   label: 'Metadata',   icon: <Tag size={16} /> },
  { id: 'backups',    label: 'Backups',    icon: <DatabaseBackup size={16} /> },
  { id: 'downloads',  label: 'Downloads',  icon: <FolderDown size={16} /> },
  { id: 'local-data', label: 'Local Data', icon: <Database size={16} /> },
  { id: 'updates',    label: 'Updates',    icon: <Zap size={16} /> },
];

const themePresets: Array<{
  id: AppTheme;
  name: string;
  description: string;
  swatches: [string, string, string];
}> = [
  { id: 'cinema',   name: 'Cinema',   description: 'Cinematic charcoal surfaces with sky blue focus.',      swatches: ['#111317', '#1a1c20', '#89ceff'] },
  { id: 'midnight', name: 'Midnight', description: 'Deep blue surfaces with soft violet accents.',           swatches: ['#070b18', '#8bb7ff', '#b695ff'] },
  { id: 'daylight', name: 'Daylight', description: 'Clean bright layout for daytime curation.',              swatches: ['#f7f3ea', '#2364d2', '#111317'] },
  { id: 'ember',    name: 'Ember',    description: 'Warm theater tones with amber focus states.',             swatches: ['#170b08', '#ffb13c', '#f04f32'] },
  { id: 'ocean',    name: 'Ocean',    description: 'Deep teal waves with aqua highlights.',                  swatches: ['#0a1a1f', '#14b8a6', '#06b6d4'] },
  { id: 'forest',   name: 'Forest',   description: 'Rich emerald tones with natural greens.',                swatches: ['#0f1810', '#10b981', '#34d399'] },
  { id: 'sunset',   name: 'Sunset',   description: 'Warm dusk palette with golden accents.',                 swatches: ['#1a1214', '#f59e0b', '#fb923c'] },
  { id: 'noir',     name: 'Noir',     description: 'Pure black surfaces with minimal accents.',              swatches: ['#000000', '#404040', '#a3a3a3'] },
  { id: 'lavender', name: 'Lavender', description: 'Soft purple hues with dreamy atmospherics.',             swatches: ['#1a0f1f', '#a78bfa', '#c4b5fd'] },
  { id: 'crimson',  name: 'Crimson',  description: 'Bold red theater with dramatic contrast.',               swatches: ['#1a0808', '#ef4444', '#dc2626'] },
];

const playerStylePresets: Array<{ id: PlayerStyle; name: string; description: string }> = [
  { id: 'default', name: 'Default', description: 'Standard controls with seek bar, volume, track selection and fullscreen toggle.' },
  { id: 'youtube', name: 'YouTube', description: 'Familiar YouTube-style red progress bar with nested settings panel.' },
];

export const SettingsPanel = memo(function SettingsPanel({
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
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [downloadProgress, setDownloadProgress] = useState<UpdateDownloadProgress | null>(null);
  const activeTheme = settings?.theme ?? 'cinema';
  const activePlayerStyle = settings?.playerStyle ?? 'auto';

  useEffect(() => {
    setTmdbApiKey(settings?.tmdbApiKey ?? '');
    setTmdbLanguage(settings?.tmdbLanguage ?? 'en-US');
  }, [settings?.tmdbApiKey, settings?.tmdbLanguage]);

  // Sync initial status and listen for progress events
  useEffect(() => {
    const skyMovie = (window as any).skyMovie;
    skyMovie?.getUpdateStatus?.().then((s: UpdateStatus) => setUpdateStatus(s)).catch(() => {});

    if (!skyMovie?.onUpdateProgress) return;
    return skyMovie.onUpdateProgress((event: UpdateProgressEvent) => {
      if (event.type === 'status') {
        setUpdateStatus(event.status);
        if (event.status !== 'downloading') setDownloadProgress(null);
      } else if (event.type === 'download-progress') {
        setUpdateStatus('downloading');
        setDownloadProgress({ bytesDownloaded: event.bytesDownloaded, totalBytes: event.totalBytes, percentage: event.percentage });
      }
    });
  }, []);

  const handleCheckForUpdates = useCallback(async () => {
    setUpdateStatus('checking');
    try {
      const result = await window.skyMovie.checkForUpdates();
      setUpdateCheckResult(result);
    } catch {
      setUpdateStatus('error');
    }
  }, []);

  const handleDownloadUpdate = useCallback(async () => {
    try {
      await window.skyMovie.downloadUpdate();
    } catch {
      // status is set via IPC event
    }
  }, []);

  const handleInstallUpdate = useCallback(async () => {
    try {
      await window.skyMovie.installUpdate();
    } catch {
      // status is set via IPC event
    }
  }, []);

  const handleTmdbApiKeyBlur = useCallback(() => onSave({ tmdbApiKey }), [tmdbApiKey, onSave]);
  const handleTmdbLanguageBlur = useCallback(() => onSave({ tmdbLanguage }), [tmdbLanguage, onSave]);

  return (
    <div className="settings-page">
      {/* Left sidebar — header + vertical nav */}
      <aside className="settings-nav">
        <div className="settings-nav-header">
          <h2>Settings</h2>
          <p>Manage the local vault, metadata matching, backups, and exports.</p>
        </div>

        <nav className="settings-nav-list" role="tablist" aria-label="Settings sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`settings-nav-item${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Right content area */}
      <main className="settings-content" role="tabpanel">
        {activeTab === 'appearance' && (
          <div className="settings-sections">
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
                    className={`theme-card${activeTheme === theme.id ? ' active' : ''}`}
                    onClick={() => onSave({ theme: theme.id })}
                    aria-pressed={activeTheme === theme.id}
                  >
                    <span className="theme-preview" aria-hidden="true">
                      {theme.swatches.map((swatch) => (
                        <span key={swatch} style={{ background: swatch }} />
                      ))}
                    </span>
                    <span>
                      <strong><Palette size={16} />{theme.name}</strong>
                      <small>{theme.description}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-heading">
                <div>
                  <h3>Layout</h3>
                  <p>Control which UI elements are visible.</p>
                </div>
              </div>
              <div className="settings-form-grid">
                <Switch
                  id="setting-hide-sidebar"
                  label="Hide sidebar"
                  checked={settings?.hideSidebar ?? false}
                  onChange={(checked) => onSave({ hideSidebar: checked })}
                />
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-heading">
                <div>
                  <h3>Player</h3>
                  <p>Choose which player engine to use for local media.</p>
                </div>
              </div>
              <div className="player-style-grid">
                {playerStylePresets.map((style) => (
                  <button
                    key={style.id}
                    className={`player-style-card${activePlayerStyle === style.id ? ' active' : ''}`}
                    onClick={() => onSave({ playerStyle: style.id })}
                    aria-pressed={activePlayerStyle === style.id}
                  >
                    <strong>{style.name}</strong>
                    <small>{style.description}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="settings-sections">
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
                <Switch
                  id="setting-extract-metadata"
                  label="Store movie file metadata"
                  checked={settings?.extractFileMetadata ?? extractFileMetadata}
                  onChange={(checked) => onSave({ extractFileMetadata: checked })}
                />
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
          </div>
        )}

        {activeTab === 'metadata' && (
          <div className="settings-sections">
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
                    onChange={(e) => setTmdbApiKey(e.target.value)}
                    onBlur={handleTmdbApiKeyBlur}
                    placeholder="Paste TMDB API key"
                  />
                </label>
                <label>
                  Language
                  <input
                    value={tmdbLanguage}
                    onChange={(e) => setTmdbLanguage(e.target.value)}
                    onBlur={handleTmdbLanguageBlur}
                    placeholder="en-US"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backups' && (
          <div className="settings-sections">
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
          </div>
        )}

        {activeTab === 'downloads' && (
          <div className="settings-sections">
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
          </div>
        )}

        {activeTab === 'local-data' && (
          <div className="settings-sections">
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
          </div>
        )}

        {activeTab === 'updates' && (
          <div className="settings-sections">
            {/* Auto-download preference */}
            <div className="settings-section">
              <div className="settings-section-heading">
                <div>
                  <h3>Auto-Download</h3>
                  <p>Automatically download new versions in the background. Installation always requires your confirmation.</p>
                </div>
              </div>
              <div className="settings-form-grid">
                <Switch
                  id="setting-auto-download-updates"
                  label="Auto-download new versions"
                  checked={settings?.autoDownloadUpdates ?? false}
                  onChange={(checked) => onSave({ autoDownloadUpdates: checked })}
                />
              </div>
            </div>

            {/* Check / download / install */}
            <div className="settings-section">
              <div className="settings-section-heading">
                <div>
                  <h3>Updates</h3>
                  <p>Check for new versions of Sky Movie.</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="settings-actions left">
                <button
                  disabled={updateStatus === 'checking' || updateStatus === 'downloading' || updateStatus === 'installing' || busy}
                  onClick={handleCheckForUpdates}
                >
                  <RefreshCw size={18} className={updateStatus === 'checking' ? 'spin' : ''} />
                  {updateStatus === 'checking' ? 'Checking…' : 'Check for updates'}
                </button>

                {updateCheckResult?.hasUpdate && updateStatus !== 'downloading' && updateStatus !== 'downloaded' && updateStatus !== 'installing' && (
                  <button disabled={busy} onClick={handleDownloadUpdate} className="update-download-btn">
                    <Download size={18} />
                    Download {updateCheckResult.latestVersion}
                  </button>
                )}

                {updateStatus === 'downloaded' && (
                  <button disabled={busy} onClick={handleInstallUpdate} className="update-install-btn">
                    <Zap size={18} />
                    Install &amp; Restart
                  </button>
                )}

                {updateStatus === 'installing' && (
                  <span className="update-installing-label">
                    <RefreshCw size={16} className="spin" />
                    Installing…
                  </span>
                )}
              </div>

              {/* Download progress bar */}
              {updateStatus === 'downloading' && (
                <div className="update-download-progress">
                  <div className="update-progress-label">
                    <span>Downloading update…</span>
                    {downloadProgress && <span>{Math.round(downloadProgress.percentage)}%</span>}
                  </div>
                  <div className="update-progress-bar">
                    <div
                      className="update-progress-fill"
                      style={{ width: downloadProgress ? `${downloadProgress.percentage}%` : '0%' }}
                    />
                  </div>
                  {downloadProgress && downloadProgress.totalBytes > 0 && (
                    <span className="update-progress-size">
                      {formatBytes(downloadProgress.bytesDownloaded)} / {formatBytes(downloadProgress.totalBytes)}
                    </span>
                  )}
                </div>
              )}

              {/* Ready-to-install banner */}
              {updateStatus === 'downloaded' && (
                <div className="update-ready-banner">
                  <Zap size={15} />
                  Update downloaded — click "Install &amp; Restart" to apply it.
                </div>
              )}

              {/* Check result info */}
              {updateCheckResult && (
                <div className="update-check-result">
                  {updateCheckResult.hasUpdate ? (
                    <div className="update-available">
                      <strong>New version available: {updateCheckResult.latestVersion}</strong>
                      <p>Current version: {updateCheckResult.currentVersion}</p>
                      {updateCheckResult.releaseInfo && (
                        <div className="release-notes">
                          <p>{updateCheckResult.releaseInfo.notes}</p>
                          {updateCheckResult.releaseInfo.changes.length > 0 && (
                            <ul>
                              {updateCheckResult.releaseInfo.changes.map((change, index) => (
                                <li key={index}>{change}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="update-current">You're on the latest version ({updateCheckResult.currentVersion})</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
});
