import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Search, Download, Copy, Filter, X, ChevronDown, Film, Tv, Clock } from 'lucide-react';
import type { TorrentCategory, TorrentSearchResult } from '@shared/ipc';
import { useTorrentSearch, useTorrentDownloads } from '../../hooks/useTorrent';
import { useTmdbSuggestions, type TmdbSuggestion } from '../../hooks/useTmdbSuggestions';
import { formatBytes } from './utils';
import { GlassSelect, Tooltip } from '../common';

const QUALITY_OPTIONS = ['all', '2160p', '1080p', '720p', '480p', 'HDR', 'x265', 'x264', 'HEVC', 'BluRay', 'WEBRip'];
const CATEGORY_OPTIONS: { value: TorrentCategory | 'all'; label: string }[] = [
  { value: 'all',   label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv',    label: 'TV Shows' },
  { value: 'anime', label: 'Anime' },
];
const SORT_OPTIONS = [
  { value: 'seeds', label: 'Seeds' },
  { value: 'peers', label: 'Peers' },
  { value: 'size',  label: 'Size' },
  { value: 'date',  label: 'Date' },
];

const RECENT_SEARCHES_KEY = 'torrent-recent-searches';
function getRecentSearches(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? '[]'); } catch { return []; }
}
function addRecentSearch(q: string) {
  const prev = getRecentSearches().filter((s) => s !== q);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([q, ...prev].slice(0, 8)));
}

type Category = TorrentCategory | 'all';
type SortBy = 'seeds' | 'peers' | 'size' | 'date';

// Glass dropdown surface — matches the app's shared design tokens.
const dropdownStyle: React.CSSProperties = {
  background: 'var(--overlay-panel-bg)',
  borderColor: 'var(--control-border)',
  backdropFilter: 'var(--glass-blur-panel)',
  WebkitBackdropFilter: 'var(--glass-blur-panel)',
};

type DropdownItem =
  | { type: 'suggestion'; suggestion: TmdbSuggestion }
  | { type: 'recent'; text: string };

export function SearchTab() {
  const [query,    setQuery]    = useState('');
  // The query the torrent providers were actually searched with. A single
  // effect re-runs the provider search whenever this or a filter changes, so
  // typing only drives suggestions — providers are hit on explicit intent.
  const [submitted, setSubmitted] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [quality,  setQuality]  = useState('all');
  const [sortBy,   setSortBy]   = useState<SortBy>('seeds');
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { results, loading, error, search } = useTorrentSearch();
  const { addMagnet } = useTorrentDownloads();
  const { suggestions, loading: suggestLoading, tmdbEnabled } = useTmdbSuggestions(query);

  const listRef = useRef<HTMLDivElement>(null);

  // Show TMDB suggestions once there's a real query; otherwise the dropdown
  // falls back to recent search history (also the path when no TMDB key).
  const inSuggestMode = tmdbEnabled && query.trim().length >= 2;

  const items = useMemo<DropdownItem[]>(() => (
    inSuggestMode
      ? suggestions.map((suggestion) => ({ type: 'suggestion' as const, suggestion }))
      : recentSearches.map((text) => ({ type: 'recent' as const, text }))
  ), [inSuggestMode, suggestions, recentSearches]);

  const showDropdown = open && (items.length > 0 || (inSuggestMode && suggestLoading));

  // Run/refresh the provider search whenever the submitted query or a filter changes.
  useEffect(() => {
    if (!submitted.trim()) return;
    search({
      query: submitted,
      category: category === 'all' ? undefined : category,
      quality: quality === 'all' ? undefined : quality,
      sortBy,
      sortOrder: 'desc',
    });
  }, [submitted, category, quality, sortBy, search]);

  // Reset the keyboard highlight whenever the visible options change.
  useEffect(() => { setHighlighted(-1); }, [query, inSuggestMode, items.length]);

  // Keep the highlighted option scrolled into view.
  useEffect(() => {
    if (highlighted < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${highlighted}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  const submitSearch = useCallback((q: string, cat?: Category) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    addRecentSearch(trimmed);
    setRecentSearches(getRecentSearches());
    setQuery(trimmed);
    if (cat) setCategory(cat);
    setSubmitted(trimmed);
    setOpen(false);
    setHighlighted(-1);
  }, []);

  const selectItem = useCallback((item: DropdownItem) => {
    if (item.type === 'recent') {
      submitSearch(item.text);
    } else {
      const { suggestion } = item;
      submitSearch(suggestion.title, suggestion.kind === 'movie' ? 'movie' : 'tv');
    }
  }, [submitSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showDropdown) { setOpen(true); return; }
      if (items.length) setHighlighted((h) => (h + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length) setHighlighted((h) => (h - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && highlighted >= 0 && highlighted < items.length) {
        selectItem(items[highlighted]);
      } else {
        submitSearch(query);
      }
    } else if (e.key === 'Escape') {
      if (showDropdown) { setOpen(false); setHighlighted(-1); }
      else if (query) setQuery('');
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  const handleDownload = async (result: TorrentSearchResult) => {
    setAddingId(result.id);
    try {
      await addMagnet({ magnetUri: result.magnetUri, category: result.category });
    } finally {
      setAddingId(null);
    }
  };

  const handleCopyMagnet = (result: TorrentSearchResult) => {
    navigator.clipboard.writeText(result.magnetUri);
    setCopiedId(result.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const optionId = (i: number) => `torrent-suggest-${i}`;

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onKeyDown={handleKeyDown}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search movies, TV shows, anime…"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-10 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/25 focus:bg-white/8 transition-colors"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls="torrent-suggest-list"
            aria-autocomplete="list"
            aria-activedescendant={highlighted >= 0 ? optionId(highlighted) : undefined}
          />
          {query && (
            <button
              onMouseDown={(e) => { e.preventDefault(); setQuery(''); setOpen(true); }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
            >
              <X size={14} />
            </button>
          )}

          {/* Suggestion / recent-search dropdown */}
          {showDropdown && (
            <div
              ref={listRef}
              id="torrent-suggest-list"
              role="listbox"
              className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-xl z-20 overflow-hidden max-h-80 overflow-y-auto"
              style={dropdownStyle}
            >
              <div className="px-3 py-2 text-xs text-white/40 font-medium">
                {inSuggestMode ? 'Suggestions' : 'Recent'}
              </div>

              {inSuggestMode && suggestLoading && items.length === 0 && (
                <div className="px-3 py-3 text-sm text-white/40 flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                  Searching TMDB…
                </div>
              )}

              {items.map((item, i) => (
                <button
                  key={item.type === 'suggestion' ? item.suggestion.key : `recent-${item.text}`}
                  id={optionId(i)}
                  data-idx={i}
                  role="option"
                  aria-selected={highlighted === i}
                  onMouseEnter={() => setHighlighted(i)}
                  onMouseDown={(e) => { e.preventDefault(); selectItem(item); }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                    highlighted === i ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {item.type === 'suggestion'
                    ? <SuggestionRow suggestion={item.suggestion} />
                    : <><Clock size={13} className="text-white/30 flex-shrink-0" /><span className="truncate">{item.text}</span></>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((p) => !p)}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            <Filter size={13} /> Filters <ChevronDown size={13} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Category chips */}
          <div className="flex gap-1.5 flex-wrap ml-2">
            {CATEGORY_OPTIONS.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  category === c.value
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">Quality</span>
              <GlassSelect
                size="sm"
                ariaLabel="Filter by quality"
                options={QUALITY_OPTIONS.map((q) => ({ value: q, label: q === 'all' ? 'Any' : q }))}
                value={quality}
                onChange={setQuality}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">Sort by</span>
              <GlassSelect
                size="sm"
                ariaLabel="Sort results"
                options={SORT_OPTIONS.map((s) => ({ value: s.value as SortBy, label: s.label }))}
                value={sortBy}
                onChange={setSortBy}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-16 text-white/30">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mr-3" />
            Searching…
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16 text-red-400/70 text-sm">{error}</div>
        )}

        {!loading && !error && results.length === 0 && submitted && (
          <div className="text-center py-16 text-white/30 text-sm">No results found for "{submitted}"</div>
        )}

        {!loading && !error && results.length === 0 && !submitted && (
          <div className="text-center py-20 text-white/20 text-sm">
            <Search size={40} className="mx-auto mb-3 opacity-30" />
            Search for movies, TV shows, or anime
          </div>
        )}

        {results.map((result) => (
          <SearchResultCard
            key={result.id}
            result={result}
            isAdding={addingId === result.id}
            isCopied={copiedId === result.id}
            onDownload={handleDownload}
            onCopy={handleCopyMagnet}
          />
        ))}
      </div>
    </div>
  );
}

function SuggestionRow({ suggestion }: { suggestion: TmdbSuggestion }) {
  return (
    <>
      <span className="flex-shrink-0 w-8 h-11 rounded overflow-hidden bg-white/5 flex items-center justify-center">
        {suggestion.posterUrl
          ? <img src={suggestion.posterUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
          : (suggestion.kind === 'movie' ? <Film size={13} className="text-white/25" /> : <Tv size={13} className="text-white/25" />)}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block truncate">{suggestion.title}</span>
        <span className="block text-xs text-white/35">
          {suggestion.kind === 'movie' ? 'Movie' : 'TV'}{suggestion.year ? ` · ${suggestion.year}` : ''}
        </span>
      </span>
    </>
  );
}

interface SearchResultCardProps {
  result: TorrentSearchResult;
  isAdding: boolean;
  isCopied: boolean;
  onDownload(r: TorrentSearchResult): void;
  onCopy(r: TorrentSearchResult): void;
}

function SearchResultCard({ result, isAdding, isCopied, onDownload, onCopy }: SearchResultCardProps) {
  return (
    <div className="flex items-start gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-xl p-3 transition-all">
      <Poster url={result.posterUrl} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-white/85 font-medium leading-tight truncate pr-2">{result.title}</p>
          <div className="flex gap-1.5 flex-shrink-0">
            <Tooltip content="Copy magnet">
              <button
                onClick={() => onCopy(result)}
                aria-label="Copy magnet"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
              >
                <Copy size={13} />
              </button>
            </Tooltip>
            <button
              onClick={() => onDownload(result)}
              disabled={isAdding}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--primary)]/80 hover:bg-[var(--primary)] text-white text-xs font-medium transition-colors disabled:opacity-50"
            >
              {isAdding ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> : <Download size={12} />}
              {isCopied ? 'Copied!' : isAdding ? 'Adding…' : 'Download'}
            </button>
          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40">
          {result.year && <span>{result.year}</span>}
          {result.quality && <Badge color="blue">{result.quality}</Badge>}
          {result.source && <Badge color="purple">{result.source}</Badge>}
          <span className="text-emerald-400/80">↑ {result.seeds}</span>
          <span className="text-red-400/80">↓ {result.leeches}</span>
          <span>{formatBytes(result.size)}</span>
          {result.runtimeMinutes && <span>{result.runtimeMinutes}min</span>}
          <span className="text-white/25">{result.provider}</span>
        </div>
      </div>
    </div>
  );
}

function Poster({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return (
    <div className="flex-shrink-0 w-10 h-14 rounded-md overflow-hidden bg-white/5 flex items-center justify-center">
      {url && !failed ? (
        <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white/20 text-xs">?</span>
      )}
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: 'blue' | 'purple' }) {
  const cls = color === 'blue'
    ? 'bg-blue-500/15 text-blue-400/80'
    : 'bg-purple-500/15 text-purple-400/80';
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cls}`}>{children}</span>;
}
