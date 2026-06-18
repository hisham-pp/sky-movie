import { ArchiveRestore, DatabaseBackup, Download, Eraser, Upload } from 'lucide-react';
import type { AppSettings, LibraryScanMode, MatcherStrategy } from '@shared/ipc';
import { Select } from './ui/Select';

export function SettingsPanel({
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
