'use client';

import { memo } from 'react';
import {
  FolderSearch,
  HardDrive,
  Loader2,
  Settings,
  Film,
  Tv,
  CheckCircle2,
  FolderCog,
  FileCheck2,
  Compass,
  AlertTriangle
} from 'lucide-react';
import type { LibraryScanMode, MatcherStrategy, ScanResult } from '@shared/ipc';
import { Button, Tooltip } from '../common';

export const ScanPanel = memo(function ScanPanel({
  libraryFolders,
  scanMode,
  matcherStrategy,
  extractFileMetadata,
  busy,
  lastScan,
  onScanLibraries,
  onOpenSettings
}: {
  libraryFolders: string[];
  scanMode: LibraryScanMode;
  matcherStrategy: MatcherStrategy;
  extractFileMetadata: boolean;
  busy: boolean;
  lastScan: ScanResult | null;
  onScanLibraries(): void;
  onOpenSettings(): void;
}) {
  const hasFolders = libraryFolders.length > 0;

  return (
    <div className="browse-grid">
      <section className="library-list scan-page-scroller">
        {/* Clean Header */}
        <div className="scan-header-clean">
          <div className="scan-header-title">
            <div className="scan-header-icon">
              <FolderSearch size={26} />
            </div>
            <div>
              <span className="playlist-browse-kicker">Maintenance</span>
              <h1>Library Scanner</h1>
              <p>Discover, match, and organize local movies and TV series across your storage folders.</p>
            </div>
          </div>

          <div className="scan-header-actions">
            <Button
              variant="secondary"
              size="medium"
              icon={<Settings size={16} />}
              onClick={onOpenSettings}
            >
              Settings
            </Button>
            {hasFolders ? (
              <Button
                variant="primary"
                size="medium"
                icon={busy ? <Loader2 className="spin" size={16} /> : <FolderSearch size={16} />}
                onClick={onScanLibraries}
                disabled={busy}
              >
                {busy ? 'Scanning...' : 'Start Scan'}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Configuration Status Strip */}
        <div className="scan-config-strip">
          <div className="scan-config-item">
            <span className="scan-config-label">Scan Mode</span>
            <span className="scan-config-val">
              {scanMode === 'movie' ? <Film size={14} /> : scanMode === 'show' ? <Tv size={14} /> : <FolderSearch size={14} />}
              {formatScanMode(scanMode)}
            </span>
          </div>

          <div className="scan-config-sep" />

          <div className="scan-config-item">
            <span className="scan-config-label">Finder Strategy</span>
            <span className="scan-config-val">
              <Compass size={14} />
              {formatMatcherStrategy(matcherStrategy)}
            </span>
          </div>

          <div className="scan-config-sep" />

          <div className="scan-config-item">
            <span className="scan-config-label">Metadata</span>
            <span className="scan-config-val">
              <FileCheck2 size={14} />
              {extractFileMetadata ? 'Enriched (On)' : 'Metadata (Off)'}
            </span>
          </div>

          <div className="scan-config-sep" />

          <div className="scan-config-item">
            <span className="scan-config-label">Status</span>
            <span className={`scan-status-pill ${busy ? 'scanning' : lastScan ? 'ready' : 'idle'}`}>
              {busy ? (
                <>
                  <Loader2 className="spin" size={13} />
                  Scanning Library...
                </>
              ) : lastScan ? (
                <>
                  <CheckCircle2 size={13} />
                  Ready
                </>
              ) : (
                'Idle'
              )}
            </span>
          </div>
        </div>

        {/* Content Section: Configured Folders + Last Scan Results */}
        <div className="scan-main-grid">
          {/* Configured Folders Panel */}
          <div className="scan-panel-card">
            <div className="scan-card-header">
              <div className="scan-card-title">
                <FolderCog size={18} />
                <h2>Configured Folders</h2>
              </div>
              <span className="scan-count-pill">{libraryFolders.length}</span>
            </div>

            <div className="scan-folders-container">
              {hasFolders ? (
                libraryFolders.map((folder) => (
                  <div key={folder} className="scan-folder-row-clean">
                    <div className="folder-row-icon">
                      <HardDrive size={16} />
                    </div>
                    <Tooltip content={folder} placement="top">
                      <span className="folder-row-path">{folder}</span>
                    </Tooltip>
                    <span className="folder-active-pill">ACTIVE</span>
                  </div>
                ))
              ) : (
                <div className="scan-empty-state">
                  <div className="scan-empty-icon">
                    <FolderCog size={28} />
                  </div>
                  <h3>No Folders Configured</h3>
                  <p>Add library folders in Settings to start discovering media files.</p>
                  <Button variant="secondary" size="small" icon={<Settings size={14} />} onClick={onOpenSettings}>
                    Configure Folders
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Last Scan Results Panel */}
          <div className="scan-panel-card">
            <div className="scan-card-header">
              <div className="scan-card-title">
                <CheckCircle2 size={18} />
                <h2>Last Scan Results</h2>
              </div>
              <span className={`scan-result-status-pill ${lastScan ? 'done' : 'none'}`}>
                {lastScan ? 'Completed' : 'No scan yet'}
              </span>
            </div>

            <div className="scan-results-container">
              {lastScan ? (
                <div className="scan-metrics-grid">
                  <div className="scan-metric-card">
                    <div className="metric-header">
                      <FolderSearch size={18} />
                      <span className="metric-label">Scanned Files</span>
                    </div>
                    <strong className="metric-value">{lastScan.scannedFiles}</strong>
                  </div>

                  <div className="scan-metric-card">
                    <div className="metric-header metric-emerald">
                      <CheckCircle2 size={18} />
                      <span className="metric-label">Imported</span>
                    </div>
                    <strong className="metric-value">{lastScan.importedFiles}</strong>
                  </div>

                  <div className="scan-metric-card">
                    <div className="metric-header metric-sky">
                      <Film size={18} />
                      <span className="metric-label">Movies</span>
                    </div>
                    <strong className="metric-value">{lastScan.movieMatches}</strong>
                  </div>

                  <div className="scan-metric-card">
                    <div className="metric-header metric-indigo">
                      <Tv size={18} />
                      <span className="metric-label">TV Series</span>
                    </div>
                    <strong className="metric-value">{lastScan.showMatches}</strong>
                  </div>

                  <div className={`scan-metric-card ${lastScan.unmatchedFiles > 0 ? 'metric-warning' : ''}`}>
                    <div className="metric-header">
                      {lastScan.unmatchedFiles > 0 ? <AlertTriangle size={18} /> : <HardDrive size={18} />}
                      <span className="metric-label">Unmatched</span>
                    </div>
                    <strong className="metric-value">{lastScan.unmatchedFiles}</strong>
                  </div>
                </div>
              ) : (
                <div className="scan-empty-state">
                  <div className="scan-empty-icon">
                    <FolderSearch size={28} />
                  </div>
                  <h3>No Scan Results Yet</h3>
                  <p>Click "Start Scan" above to scan your configured directories.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
});

function formatScanMode(scanMode: LibraryScanMode): string {
  if (scanMode === 'movie') {
    return 'Movies only';
  }
  if (scanMode === 'show') {
    return 'TV shows only';
  }
  return 'Mixed library';
}

function formatMatcherStrategy(strategy: MatcherStrategy): string {
  switch (strategy) {
    case 'movie-title-year':
      return 'Title + year';
    case 'show-season-episode':
      return 'SxxEyy pattern';
    case 'folder-name':
      return 'Folder name';
    case 'auto':
    default:
      return 'Auto finder';
  }
}
