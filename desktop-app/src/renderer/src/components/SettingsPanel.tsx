import { useEffect, useState } from 'react';
import {
  ArchiveRestore,
  DatabaseBackup,
  Download,
  Eraser,
  FolderPlus,
  FolderSearch,
  Palette,
  Upload,
  X
} from 'lucide-react';
import type { AppSettings, AppTheme, LibraryScanMode, MatcherStrategy } from '@shared/ipc';
import { Select } from './ui/Select';

type SettingsTab = 'appearance' | 'library' | 'metadata' | 'backups' | 'downloads' | 'local-data';

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'library', label: 'Library' },
  { id: 'metadata', label: 'Metadata' },
  { id: 'backups', label: 'Backups' },
  { id: 'downloads', label: 'Downloads' },
  { id: 'local-data', label: 'Local Data' }
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
    description: 'Balanced dark theme with teal highlights.',
    swatches: ['#071013', '#0df2c9', '#ff6b4a']
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
    description: 'Clean bright layout for daytime browsing.',
    swatches: ['#f7f3ea', '#2364d2', '#d96f32']
  },
  {
    id: 'ember',
    name: 'Ember',
    description: 'Warm theater tones with amber focus states.',
    swatches: ['#170b08', '#ffb13c', '#f04f32']
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
  onScanLibraries,
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
  onScanLibraries(): void;
  onClear(): void;
  onBackup(): void;
  onRestore(): void;
  onDownloadLocal(): void;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [tmdbApiKey, setTmdbApiKey] = useState('');
  const [tmdbLanguage, setTmdbLanguage] = useState('en-US');
  const activeTheme = settings?.theme ?? 'cinema';

  useEffect(() => {
    setTmdbApiKey(settings?.tmdbApiKey ?? '');
    setTmdbLanguage(settings?.tmdbLanguage ?? 'en-US');
  }, [settings?.tmdbApiKey, settings?.tmdbLanguage]);

  return (
    <section className="settings-page">
      <header className="settings-header">
        <div>
          <h2>Settings</h2>
          <p>Manage library folders, metadata, backups, and local storage.</p>
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
          </div>
        ) : null}

        {activeTab === 'library' ? (
          <div className="settings-section">
            <div className="settings-section-heading">
              <div>
                <h3>Library Finder</h3>
                <p>Add one or more local folders, then scan them into the library.</p>
              </div>
              <div className="settings-actions">
                <button disabled={busy} onClick={onChooseFolders}>
                  <FolderPlus size={18} />
                  Add folders
                </button>
                <button className="primary" disabled={busy} onClick={onScanLibraries}>
                  <FolderSearch size={18} />
                  Scan libraries
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
      </div>
    </section>
  );
}
