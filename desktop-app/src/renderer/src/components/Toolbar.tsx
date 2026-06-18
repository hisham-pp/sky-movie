import { FolderOpen, FolderSearch, RefreshCw, Search } from 'lucide-react';
import type { LibraryScanMode, MatcherStrategy } from '@shared/ipc';
import { Select } from './ui/Select';

export function Toolbar({
  query,
  scanMode,
  matcherStrategy,
  extractFileMetadata,
  selectedFolderPath,
  busy,
  onQueryChange,
  onScanModeChange,
  onMatcherStrategyChange,
  onExtractFileMetadataChange,
  onChooseFolder,
  onScan
}: {
  query: string;
  scanMode: LibraryScanMode;
  matcherStrategy: MatcherStrategy;
  extractFileMetadata: boolean;
  selectedFolderPath: string | null;
  busy: boolean;
  onQueryChange(value: string): void;
  onScanModeChange(value: LibraryScanMode): void;
  onMatcherStrategyChange(value: MatcherStrategy): void;
  onExtractFileMetadataChange(value: boolean): void;
  onChooseFolder(): void;
  onScan(): void;
}) {
  return (
    <header className="toolbar">
      <div className="search">
        <Search size={18} />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search library" />
      </div>

      <div className="scan-controls">
        <button disabled={busy} onClick={onChooseFolder} title="Choose library folder">
          <FolderOpen size={18} />
          Folder
        </button>
        <span className="scan-folder" title={selectedFolderPath ?? 'No folder selected'}>
          {selectedFolderPath ?? 'No folder selected'}
        </span>
        <Select value={scanMode} onChange={(value) => onScanModeChange(value as LibraryScanMode)}>
          <option value="mixed">Mixed</option>
          <option value="movie">Movies only</option>
          <option value="show">TV shows only</option>
        </Select>
        <Select value={matcherStrategy} onChange={(value) => onMatcherStrategyChange(value as MatcherStrategy)}>
          <option value="auto">Auto finder</option>
          <option value="movie-title-year">Movie title + year</option>
          <option value="show-season-episode">Show SxxEyy</option>
          <option value="folder-name">Folder name</option>
        </Select>
        <label className="toggle">
          <input
            type="checkbox"
            checked={extractFileMetadata}
            onChange={(event) => onExtractFileMetadataChange(event.target.checked)}
          />
          File metadata
        </label>
        <button className="primary" disabled={busy} onClick={onScan}>
          {busy ? <RefreshCw className="spin" size={18} /> : <FolderSearch size={18} />}
          Scan
        </button>
      </div>
    </header>
  );
}
