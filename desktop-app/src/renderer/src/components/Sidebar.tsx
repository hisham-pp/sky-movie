import { memo } from 'react';
import { Clapperboard, ChevronRight } from 'lucide-react';
import type { LibrarySummary } from '@shared/ipc';
import type { ViewMode } from '../types';
import { NAV_MAIN, NAV_BOTTOM } from '../config/navItems';

const NavGroup = memo(function NavGroup({ items, view, onViewChange }: {
  items: typeof NAV_MAIN;
  view: ViewMode;
  onViewChange(v: ViewMode): void;
}) {
  return (
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
});

export const Sidebar = memo(function Sidebar({
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
});
