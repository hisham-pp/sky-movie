import { Search } from 'lucide-react';

export function Toolbar({
  query,
  onQueryChange
}: {
  query: string;
  onQueryChange(value: string): void;
}) {
  return (
    <header className="toolbar">
      <div className="toolbar-title">
        <span>Local-first cinema library</span>
        <strong>Sky Movie</strong>
      </div>
      <div className="search">
        <Search size={18} />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search library" />
      </div>
    </header>
  );
}
