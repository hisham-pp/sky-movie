import { CheckCircle2, FolderCog, FolderSearch, HardDrive, Loader2, Settings } from 'lucide-react';
import type { LibraryScanMode, MatcherStrategy, ScanResult } from '@shared/ipc';

export function ScanPanel({
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
    <section className="scan-page">
      <div className="scan-hero">
        <div>
          <span className="detail-kicker">Library scan</span>
          <h2>Refresh your local cinema vault.</h2>
          <p>
            Scan uses the folders configured in Settings, applies your finder strategy, and enriches new titles when metadata is configured.
          </p>
          <div className="hero-chips">
            <span>{formatScanMode(scanMode)}</span>
            <span>{formatMatcherStrategy(matcherStrategy)}</span>
            <span>{extractFileMetadata ? 'File metadata on' : 'File metadata off'}</span>
          </div>
        </div>
        <div className="scan-action-card">
          <FolderSearch size={34} />
          <strong>{hasFolders ? `${libraryFolders.length} configured folder${libraryFolders.length === 1 ? '' : 's'}` : 'No folders configured'}</strong>
          <p>{hasFolders ? 'Ready to scan the folders managed in Settings.' : 'Add folders in Settings before starting a scan.'}</p>
          {hasFolders ? (
            <button className="primary" disabled={busy} onClick={onScanLibraries}>
              {busy ? <Loader2 className="spin" size={18} /> : <FolderSearch size={18} />}
              Start scan
            </button>
          ) : (
            <button className="primary" onClick={onOpenSettings}>
              <Settings size={18} />
              Open settings
            </button>
          )}
        </div>
      </div>

      <div className="scan-grid">
        <section className="detail-card">
          <div className="section-title">
            <h2>Configured Folders</h2>
            <span>{libraryFolders.length} folders</span>
          </div>
          <div className="scan-folder-list">
            {hasFolders ? (
              libraryFolders.map((folder) => (
                <div key={folder} className="scan-folder-row">
                  <HardDrive size={17} />
                  <span title={folder}>{folder}</span>
                </div>
              ))
            ) : (
              <div className="detail-empty">
                <FolderCog size={22} />
                <span>Folder configuration lives in Settings.</span>
              </div>
            )}
          </div>
        </section>

        <section className="detail-card scan-result-card">
          <div className="section-title">
            <h2>Last Scan</h2>
            <span>{lastScan ? lastScan.folder.name : 'No scan yet'}</span>
          </div>
          {lastScan ? (
            <div className="scan-result-grid">
              <ScanMetric label="Scanned files" value={lastScan.scannedFiles} />
              <ScanMetric label="Imported files" value={lastScan.importedFiles} />
              <ScanMetric label="Movie matches" value={lastScan.movieMatches} />
              <ScanMetric label="Show matches" value={lastScan.showMatches} />
              <ScanMetric label="Unmatched" value={lastScan.unmatchedFiles} />
            </div>
          ) : (
            <div className="detail-empty">
              <CheckCircle2 size={22} />
              <span>Run a scan to see import and match results here.</span>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function ScanMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="scan-metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

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
      return 'Movie title + year';
    case 'show-season-episode':
      return 'Show SxxEyy';
    case 'folder-name':
      return 'Folder name';
    case 'auto':
    default:
      return 'Auto finder';
  }
}
