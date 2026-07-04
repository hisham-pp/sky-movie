import { CheckCircle2, FolderCog, FolderSearch, HardDrive, Loader2, Settings, Film, Tv, Zap } from 'lucide-react';
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
      <div className="scan-hero-modern">
        <div className="scan-hero-bg">
          <div className="scan-hero-glow" />
          <div className="scan-hero-pattern" />
        </div>
        
        <div className="scan-hero-content">
          <div className="scan-hero-text">
            <span className="detail-kicker-modern">
              <Zap size={16} />
              Library scan
            </span>
            <h2>Refresh your local cinema vault.</h2>
            <p>
              Scan uses the folders configured in Settings, applies your finder strategy, and enriches new titles when metadata is configured.
            </p>
            <div className="hero-chips-modern">
              <span className="chip-primary">
                {scanMode === 'movie' ? <Film size={14} /> : scanMode === 'show' ? <Tv size={14} /> : <FolderSearch size={14} />}
                {formatScanMode(scanMode)}
              </span>
              <span className="chip-secondary">{formatMatcherStrategy(matcherStrategy)}</span>
              <span className="chip-secondary">{extractFileMetadata ? 'File metadata on' : 'File metadata off'}</span>
            </div>
          </div>

          <div className={`scan-action-card-modern ${busy ? 'scanning' : ''}`}>
            <div className="scan-card-icon">
              <FolderSearch size={38} />
              {busy && <div className="scan-pulse" />}
            </div>
            <div className="scan-card-content">
              <strong>{hasFolders ? `${libraryFolders.length} configured folder${libraryFolders.length === 1 ? '' : 's'}` : 'No folders configured'}</strong>
              <p>{hasFolders ? 'Ready to scan the folders managed in Settings.' : 'Add folders in Settings before starting a scan.'}</p>
            </div>
            {hasFolders ? (
              <button className="primary scan-button" disabled={busy} onClick={onScanLibraries}>
                {busy ? (
                  <>
                    <Loader2 className="spin" size={18} />
                    Scanning...
                  </>
                ) : (
                  <>
                    <FolderSearch size={18} />
                    Start scan
                  </>
                )}
              </button>
            ) : (
              <button className="primary scan-button" onClick={onOpenSettings}>
                <Settings size={18} />
                Open settings
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="scan-grid-modern">
        <section className="detail-card scan-folders-card">
          <div className="section-title">
            <h2>Configured Folders</h2>
            <span className="count-badge">{libraryFolders.length}</span>
          </div>
          <div className="scan-folder-list-modern">
            {hasFolders ? (
              libraryFolders.map((folder, index) => (
                <div key={folder} className="scan-folder-row-modern" style={{ animationDelay: `${index * 0.05}s` }}>
                  <div className="folder-icon">
                    <HardDrive size={18} />
                  </div>
                  <span title={folder}>{folder}</span>
                </div>
              ))
            ) : (
              <div className="detail-empty-modern">
                <div className="empty-icon-wrapper">
                  <FolderCog size={32} />
                </div>
                <span>No folders configured yet</span>
                <p>Add folders in Settings to start scanning your media library.</p>
              </div>
            )}
          </div>
        </section>

        <section className="detail-card scan-result-card-modern">
          <div className="section-title">
            <h2>Last Scan</h2>
            <span className={`scan-status ${lastScan ? 'completed' : 'pending'}`}>
              {lastScan ? 'Movies' : 'No scan yet'}
            </span>
          </div>
          {lastScan ? (
            <div className="scan-result-grid-modern">
              <ScanMetricModern label="Scanned files" value={lastScan.scannedFiles} icon={<FolderSearch size={20} />} />
              <ScanMetricModern label="Imported files" value={lastScan.importedFiles} icon={<CheckCircle2 size={20} />} />
              <ScanMetricModern label="Movie matches" value={lastScan.movieMatches} icon={<Film size={20} />} />
              <ScanMetricModern label="Show matches" value={lastScan.showMatches} icon={<Tv size={20} />} />
              <ScanMetricModern label="Unmatched" value={lastScan.unmatchedFiles} icon={<HardDrive size={20} />} warning={lastScan.unmatchedFiles > 0} />
            </div>
          ) : (
            <div className="detail-empty-modern">
              <div className="empty-icon-wrapper">
                <CheckCircle2 size={32} />
              </div>
              <span>No scan results yet</span>
              <p>Run a scan to see import and match results here.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function ScanMetricModern({ label, value, icon, warning }: { label: string; value: number; icon: React.ReactNode; warning?: boolean }) {
  return (
    <div className={`scan-metric-modern ${warning ? 'warning' : ''}`}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
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
