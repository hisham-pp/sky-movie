import { Search, Sparkles, AlertTriangle } from 'lucide-react';

export function Toolbar({
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
      <div className="search" onClick={onOpenSearch}>
        <Search size={18} />
        <input
          placeholder="Search library"
          readOnly
          onClick={(e) => {
            e.currentTarget.blur();
            onOpenSearch();
          }}
        />
        <kbd className="search-shortcut">Ctrl+K</kbd>
      </div>
      
      {unmatchedCount && unmatchedCount > 0 && onOpenUnrecognized ? (
        <button className="unrecognized-badge" onClick={onOpenUnrecognized}>
          <AlertTriangle size={18} />
          <span>Unrecognized</span>
          <span className="unrecognized-badge-count">{unmatchedCount}</span>
        </button>
      ) : null}
      
      <div className="toolbar-badge">
        <Sparkles size={16} />
        <span>Poster-first library</span>
      </div>
    </header>
  );
}
