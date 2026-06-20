import { Search, Sparkles } from 'lucide-react';

export function Toolbar({
  onOpenSearch
}: {
  onOpenSearch: () => void;
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
    </header>
  );
}
