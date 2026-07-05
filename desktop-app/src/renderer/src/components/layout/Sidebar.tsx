import { memo } from 'react';
import { Clapperboard, ChevronRight } from 'lucide-react';
import type { LibrarySummary } from '@shared/ipc';
import type { ViewMode } from '../../types';
import { NAV_MAIN, NAV_BOTTOM } from '../../config/navItems';
import { Tooltip } from '../common';

const NavGroup = memo(function NavGroup({ items, view, onViewChange, expanded }: {
  items: typeof NAV_MAIN;
  view: ViewMode;
  onViewChange(v: ViewMode): void;
  expanded: boolean;
}) {
  return (
    <>
      {items.map(({ view: v, label, icon }) => (
        // When expanded the label is already visible, so the tooltip is redundant.
        <Tooltip key={v} content={label} placement="right" disabled={expanded}>
          <button
            className={view === v ? 'active' : ''}
            onClick={() => onViewChange(v)}
          >
            {icon}
            <span className="nav-label">{label}</span>
          </button>
        </Tooltip>
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
        <Tooltip content={expanded ? 'Collapse sidebar' : 'Expand sidebar'} placement="right">
          <button className="brand-icon" onClick={onToggleExpand}>
            <Clapperboard size={18} />
          </button>
        </Tooltip>
        <div className="brand-text">
          <h1>Sky Movie</h1>
          <p>Premium Cinema</p>
        </div>
        <Tooltip content="Collapse">
          <button className="sidebar-collapse-btn" onClick={onToggleExpand}>
            <ChevronRight size={16} />
          </button>
        </Tooltip>
      </div>

      <nav className="nav">
        <NavGroup items={NAV_MAIN} view={view} onViewChange={onViewChange} expanded={expanded} />
      </nav>

      <nav className="nav nav-bottom">
        <NavGroup items={NAV_BOTTOM} view={view} onViewChange={onViewChange} expanded={expanded} />
      </nav>
    </aside>
  );
});
