import { memo } from 'react';
import { Search, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import { Tooltip } from '../common';

export const Toolbar = memo(function Toolbar({
  onOpenSearch,
  unmatchedCount,
  onOpenUnrecognized,
  onBack,
  onForward
}: {
  onOpenSearch: () => void;
  unmatchedCount?: number;
  onOpenUnrecognized?: () => void;
  onBack?: () => void;
  onForward?: () => void;
}) {
  return (
    <>
      <div className="topbar-feather-blur" aria-hidden="true" />
      <header className="toolbar">
        <div className="toolbar-spacer">
          <div className="nav-controls">
            <Tooltip content="Go back (Alt+←)">
              <button className="nav-btn" onClick={onBack} aria-label="Go back">
                <ArrowLeft size={18} />
              </button>
            </Tooltip>
            <Tooltip content="Go forward (Alt+→)">
              <button className="nav-btn" onClick={onForward} aria-label="Go forward">
                <ArrowRight size={18} />
              </button>
            </Tooltip>
          </div>
        </div>

        <div
          className="search"
          role="button"
          tabIndex={0}
          onMouseDown={(e) => {
            // Prevent browser from focusing the readOnly toolbar input on mousedown,
            // avoiding focus theft from the search modal
            e.preventDefault();
          }}
          onClick={onOpenSearch}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenSearch();
            }
          }}
        >
          <Search size={18} />
          <input
            placeholder="Search library"
            readOnly
            tabIndex={-1}
            style={{ pointerEvents: 'none' }}
          />
          <kbd className="search-shortcut">Ctrl+K</kbd>
        </div>

        <div className="toolbar-spacer">
          {unmatchedCount && unmatchedCount > 0 && onOpenUnrecognized ? (
            <button className="toolbar-badge" onClick={onOpenUnrecognized}>
              <AlertTriangle size={18} />
              <span>Unrecognized</span>
              <span className="badge-count">{unmatchedCount}</span>
            </button>
          ) : null}
        </div>
      </header>
    </>
  );
});
