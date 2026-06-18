import { Film, Settings, Tv } from 'lucide-react';
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
        <div className="brand-mark">S</div>
        <div>
          <h1>Sky Movie</h1>
          <p>Local library</p>
        </div>
      </div>

      <nav className="nav">
        <button className={view === 'movies' ? 'active' : ''} onClick={() => onViewChange('movies')} title="Movies">
          <Film size={18} />
          <span>Movies</span>
        </button>
        <button className={view === 'shows' ? 'active' : ''} onClick={() => onViewChange('shows')} title="TV Shows">
          <Tv size={18} />
          <span>TV Shows</span>
        </button>
        <button className={view === 'settings' ? 'active' : ''} onClick={() => onViewChange('settings')} title="Settings">
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </nav>

      <div className="summary">
        <Metric label="Movies" value={summary?.movieCount ?? 0} />
        <Metric label="Shows" value={summary?.showCount ?? 0} />
        <Metric label="Files" value={summary?.mediaFileCount ?? 0} />
      </div>
    </aside>
  );
}
