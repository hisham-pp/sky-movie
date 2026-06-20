import { Search, Sparkles } from 'lucide-react';

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
        <span>Local-first cinema</span>
        <strong>Your private theater</strong>
      </div>
      <div className="search">
        <Search size={18} />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search library" />
      </div>
      <div className="toolbar-badge">
        <Sparkles size={16} />
        <span>Poster-first library</span>
      </div>
    </header>
  );
}
