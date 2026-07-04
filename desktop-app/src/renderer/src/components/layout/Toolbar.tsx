import { memo } from 'react';
import { Search, AlertTriangle } from 'lucide-react';

export const Toolbar = memo(function Toolbar({
  onOpenSearch,
  unmatchedCount,
  onOpenUnrecognized
}: {
  onOpenSearch: () => void;
  unmatchedCount?: number;
  onOpenUnrecognized?: () => void;
}) {
  return (
    <header className="toolbar">
      <div className="toolbar-spacer"></div>

      <div className="search" onClick={onOpenSearch}>
        <Search size={18} />
        <input
          placeholder="Search library"
          readOnly
          onClick={(e) => {
            // stop bubbling to the parent .search onClick — onOpenSearch is a
            // toggle, so firing twice opens and immediately closes the modal
            e.stopPropagation();
            e.currentTarget.blur();
            onOpenSearch();
          }}
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
  );
});
