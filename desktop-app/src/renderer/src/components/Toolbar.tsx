import { Search } from 'lucide-react';

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
          style={{ cursor: 'pointer' }}
        />
        <kbd style={{ fontSize: '12px', opacity: 0.6 }}>Ctrl+K</kbd>
      </div>
    </header>
  );
}
