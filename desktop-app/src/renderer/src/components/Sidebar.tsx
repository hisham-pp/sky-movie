import { Download, Film, FolderSearch, HardDrive, Settings, Tv, Video } from 'lucide-react';
import type { LibrarySummary } from '@shared/ipc';
import type { ViewMode } from '../types';
import { Metric } from './Metric';

export function Sidebar({
  view,
  summary,
  onViewChange
}: {
  view: ViewMode;
  summary: LibrarySummary | null;
  onViewChange(view: ViewMode): void;
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div>
          <h1>Sky Movie</h1>
          <p>Premium Cinema</p>
        </div>
      </div>

      <nav className="nav">
        <button className="passive" onClick={() => onViewChange('movies')} title="Library">
          <Video size={18} />
          <span>Library</span>
        </button>
        <button className={view === 'movies' ? 'active' : ''} onClick={() => onViewChange('movies')} title="Movies">
          <Film size={18} />
          <span>Movies</span>
        </button>
        <button className={view === 'shows' ? 'active' : ''} onClick={() => onViewChange('shows')} title="TV Shows">
          <Tv size={18} />
          <span>TV Shows</span>
        </button>
        <button className={view === 'scan' ? 'active' : ''} onClick={() => onViewChange('scan')} title="Scan">
          <FolderSearch size={18} />
          <span>Scan</span>
        </button>
        <button className="passive" title="Downloads live in Settings">
          <Download size={18} />
          <span>Downloads</span>
        </button>
        <button className={view === 'settings' ? 'active' : ''} onClick={() => onViewChange('settings')} title="Settings">
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </nav>

      <div className="summary">
        <div className="summary-heading">
          <HardDrive size={16} />
          <span>Local Vault</span>
        </div>
        <Metric label="Movies" value={summary?.movieCount ?? 0} />
        <Metric label="Shows" value={summary?.showCount ?? 0} />
        <Metric label="Files" value={summary?.mediaFileCount ?? 0} />
      </div>
    </aside>
  );
}
