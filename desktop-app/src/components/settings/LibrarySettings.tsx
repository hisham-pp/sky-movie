'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import {
  ArchiveRestore,
  DatabaseBackup,
  Download,
  Eraser,
  FolderPlus,
  Upload,
  X,
} from 'lucide-react';
import type { LibraryScanMode, MatcherStrategy } from '@/types';
import { GlassSelect, Switch, Tooltip } from '../common';
import { useLibraryControllerContext } from '@/hooks/LibraryControllerContext';

export const LibrarySettings = memo(function LibrarySettings() {
  const {
    settings,
    scanMode,
    matcherStrategy,
    extractFileMetadata,
    libraryFolders,
    busy,
    saveSettings,
    chooseLibraryFolders,
    removeLibraryFolder,
    clearLocalData,
    createBackup,
    restoreBackup,
    downloadLocalFiles,
  } = useLibraryControllerContext();

  const [tmdbApiKey, setTmdbApiKey] = useState(settings?.tmdbApiKey ?? '');
  const [tmdbLanguage, setTmdbLanguage] = useState(settings?.tmdbLanguage ?? 'en-US');

  useEffect(() => {
    setTmdbApiKey(settings?.tmdbApiKey ?? '');
    setTmdbLanguage(settings?.tmdbLanguage ?? 'en-US');
  }, [settings?.tmdbApiKey, settings?.tmdbLanguage]);

  const handleTmdbApiKeyBlur = useCallback(() => saveSettings({ tmdbApiKey }), [tmdbApiKey, saveSettings]);
  const handleTmdbLanguageBlur = useCallback(() => saveSettings({ tmdbLanguage }), [tmdbLanguage, saveSettings]);

  return (
    <div className="settings-sections">
      <div className="settings-section" id="library-finder">
        <div className="settings-section-heading">
          <div>
            <h3>Library Finder</h3>
            <p>Choose the local folders and matching rules used by the Scan page.</p>
          </div>
          <div className="settings-actions">
            <button disabled={busy} onClick={chooseLibraryFolders}>
              <FolderPlus size={18} />
              Add folders
            </button>
          </div>
        </div>

        <div className="settings-form-grid">
          <label>
            Scan mode
            <GlassSelect<LibraryScanMode>
              ariaLabel="Scan mode"
              options={[
                { value: 'mixed', label: 'Mixed' },
                { value: 'movie', label: 'Movies only' },
                { value: 'show', label: 'TV shows only' }
              ]}
              value={settings?.defaultScanMode ?? scanMode}
              onChange={(value) => saveSettings({ defaultScanMode: value })}
            />
          </label>
          <label>
            Finder strategy
            <GlassSelect<MatcherStrategy>
              ariaLabel="Finder strategy"
              options={[
                { value: 'auto', label: 'Auto finder' },
                { value: 'movie-title-year', label: 'Movie title + year' },
                { value: 'show-season-episode', label: 'Show SxxEyy' },
                { value: 'folder-name', label: 'Folder name' }
              ]}
              value={settings?.defaultMatcherStrategy ?? matcherStrategy}
              onChange={(value) => saveSettings({ defaultMatcherStrategy: value })}
            />
          </label>
          <Switch
            id="setting-extract-metadata"
            label="Store movie file metadata"
            checked={settings?.extractFileMetadata ?? extractFileMetadata}
            onChange={(checked) => saveSettings({ extractFileMetadata: checked })}
          />
        </div>

        <div className="folder-list">
          {libraryFolders.length ? (
            libraryFolders.map((folder) => (
              <div key={folder} className="folder-row">
                <Tooltip content={folder}>
                  <span>{folder}</span>
                </Tooltip>
                <Tooltip content="Remove folder">
                  <button disabled={busy} onClick={() => removeLibraryFolder(folder)}>
                    <X size={16} />
                  </button>
                </Tooltip>
              </div>
            ))
          ) : (
            <div className="empty-state">No library folders selected yet.</div>
          )}
        </div>
      </div>

      <div className="settings-section" id="metadata">
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

      <div className="settings-section" id="backups">
        <div className="settings-section-heading">
          <div>
            <h3>Backups</h3>
            <p>Save or restore your local Sky Movie database.</p>
          </div>
        </div>
        <div className="settings-actions left">
          <button disabled={busy} onClick={createBackup}>
            <DatabaseBackup size={18} />
            Download backup file
          </button>
          <button disabled={busy} onClick={restoreBackup}>
            <ArchiveRestore size={18} />
            Insert backup file
          </button>
        </div>
      </div>

      <div className="settings-section" id="downloads">
        <div className="settings-section-heading">
          <div>
            <h3>Local Download</h3>
            <p>Export the selected local library for another device.</p>
          </div>
        </div>
        <button disabled={busy} onClick={downloadLocalFiles}>
          <Download size={18} />
          Download files
        </button>
      </div>

      <div className="settings-section danger-zone" id="local-data">
        <div className="settings-section-heading">
          <div>
            <h3>Local Data</h3>
            <p>Clear local records or choose what sync exports include.</p>
          </div>
        </div>
        <button disabled={busy} onClick={clearLocalData}>
          <Eraser size={18} />
          Clear local library data
        </button>
        <div className="inline-actions">
          <button onClick={() => saveSettings({ defaultSyncIncludesFiles: true })}>
            <Upload size={18} />
            Include files
          </button>
          <button onClick={() => saveSettings({ defaultSyncIncludesFiles: false })}>
            <Download size={18} />
            Metadata only
          </button>
        </div>
      </div>
    </div>
  );
});
