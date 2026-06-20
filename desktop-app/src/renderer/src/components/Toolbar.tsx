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
      <div className="search">
        <Search size={18} />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search library" />
      </div>
    </header>
  );
}
