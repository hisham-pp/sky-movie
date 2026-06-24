import { Film, FolderSearch, ListMusic, Settings, Tv, Clapperboard, ChevronRight } from 'lucide-react';
import type { LibrarySummary } from '@shared/ipc';
import type { ViewMode } from '../types';

const NAV_MAIN: { view: ViewMode; label: string; icon: React.ReactNode }[] = [
  { view: 'movies',    label: 'Movies',    icon: <Film size={18} /> },
  { view: 'shows',     label: 'TV Shows',  icon: <Tv size={18} /> },
  { view: 'playlists', label: 'Playlists', icon: <ListMusic size={18} /> },
];

const NAV_BOTTOM: { view: ViewMode; label: string; icon: React.ReactNode }[] = [
  { view: 'scan',     label: 'Scan',     icon: <FolderSearch size={18} /> },
  { view: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

const NavGroup = ({ items, view, onViewChange }: {
  items: typeof NAV_MAIN;
  view: ViewMode;
  onViewChange(v: ViewMode): void;
}) => (
  <>
    {items.map(({ view: v, label, icon }) => (
      <button
        key={v}
        className={view === v ? 'active' : ''}
        onClick={() => onViewChange(v)}
        title={label}
      >
        {icon}
        <span className="nav-label">{label}</span>
      </button>
    ))}
  </>
);

export function Sidebar({
  view,
  summary: _summary,
  onViewChange,
  expanded,
  onToggleExpand
}: {
  view: ViewMode;
  summary: LibrarySummary | null;
  onViewChange(view: ViewMode): void;
  expanded: boolean;
  onToggleExpand(): void;
}) {
  return (
    <aside className={`sidebar${expanded ? ' sidebar--expanded' : ''}`}>
      <div className="brand">
        <button className="brand-icon" onClick={onToggleExpand} title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}>
          <Clapperboard size={18} />
        </button>
        <div className="brand-text">
          <h1>Sky Movie</h1>
          <p>Premium Cinema</p>
        </div>
        <button className="sidebar-collapse-btn" onClick={onToggleExpand} title="Collapse">
          <ChevronRight size={16} />
        </button>
      </div>

      <nav className="nav">
        <NavGroup items={NAV_MAIN} view={view} onViewChange={onViewChange} />
      </nav>

      <nav className="nav nav-bottom">
        <NavGroup items={NAV_BOTTOM} view={view} onViewChange={onViewChange} />
      </nav>
    </aside>
  );
}
