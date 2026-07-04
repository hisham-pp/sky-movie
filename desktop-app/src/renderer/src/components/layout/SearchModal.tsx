import { memo, useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { Search, Film, Tv, ListMusic, X, Download, Settings, ChevronRight } from 'lucide-react';
import type { Movie, TvShow, Playlist } from '@shared/ipc';
import { Modal } from '../common';
import { ALL_NAV_ITEMS } from '../../config/navItems';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  movies: Movie[];
  shows: TvShow[];
  playlists: Playlist[];
  onSelectMovie: (movie: Movie) => void;
  onSelectShow: (show: TvShow) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onNavigate: (path: string) => void;
}

type ResultItem =
  | { kind: 'movie'; data: Movie }
  | { kind: 'show'; data: TvShow }
  | { kind: 'playlist'; data: Playlist };

type NavResultItem = { kind: 'nav'; path: string; label: string; sublabel?: string; icon: React.ReactNode };

type AnyItem = NavResultItem | ResultItem;

const ALL_NAV_RESULT_ITEMS: NavResultItem[] = [
  ...ALL_NAV_ITEMS.map((n) => ({ kind: 'nav' as const, label: n.label, path: n.path, icon: n.iconLg })),
  // Downloads sub-tabs
  { kind: 'nav', label: 'Downloads', sublabel: 'Search', path: '/downloads?tab=search',     icon: <Download size={18} /> },
  { kind: 'nav', label: 'Downloads', sublabel: 'Active', path: '/downloads?tab=downloads',  icon: <Download size={18} /> },
  { kind: 'nav', label: 'Downloads', sublabel: 'Completed', path: '/downloads?tab=downloaded', icon: <Download size={18} /> },
  { kind: 'nav', label: 'Downloads', sublabel: 'Settings', path: '/downloads?tab=settings', icon: <Download size={18} /> },
  // Settings sub-tabs
  { kind: 'nav', label: 'Settings', sublabel: 'Appearance', path: '/settings?tab=appearance', icon: <Settings size={18} /> },
  { kind: 'nav', label: 'Settings', sublabel: 'Library',    path: '/settings?tab=library',    icon: <Settings size={18} /> },
  { kind: 'nav', label: 'Settings', sublabel: 'Metadata',   path: '/settings?tab=metadata',   icon: <Settings size={18} /> },
  { kind: 'nav', label: 'Settings', sublabel: 'Backups',    path: '/settings?tab=backups',     icon: <Settings size={18} /> },
  { kind: 'nav', label: 'Settings', sublabel: 'Downloads',  path: '/settings?tab=downloads',   icon: <Settings size={18} /> },
  { kind: 'nav', label: 'Settings', sublabel: 'Local Data', path: '/settings?tab=local-data',  icon: <Settings size={18} /> },
  { kind: 'nav', label: 'Settings', sublabel: 'Updates',    path: '/settings?tab=updates',     icon: <Settings size={18} /> },
];

export const SearchModal = memo(function SearchModal({
  isOpen,
  onClose,
  movies,
  shows,
  playlists,
  onSelectMovie,
  onSelectShow,
  onSelectPlaylist,
  onNavigate
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setActiveIndex(-1);
    }
  }, [isOpen]);

  const q = query.toLowerCase();

  const filteredNav = useMemo(() => {
    if (!query) {
      // Show only top-level nav items when there's no query
      return ALL_NAV_RESULT_ITEMS.filter((n) => !n.sublabel);
    }
    return ALL_NAV_RESULT_ITEMS.filter((n) =>
      n.label.toLowerCase().includes(q) || n.sublabel?.toLowerCase().includes(q)
    );
  }, [q, query]);

  const filteredMovies = useMemo(
    () => query ? movies.filter((m) => m.title.toLowerCase().includes(q)).slice(0, 6) : [],
    [movies, q, query],
  );

  const filteredShows = useMemo(
    () => query ? shows.filter((s) => s.title.toLowerCase().includes(q)).slice(0, 6) : [],
    [shows, q, query],
  );

  const filteredPlaylists = useMemo(
    () => query ? playlists.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 4) : [],
    [playlists, q, query],
  );

  const allItems: AnyItem[] = useMemo(() => [
    ...filteredNav,
    ...filteredMovies.map((data): ResultItem => ({ kind: 'movie', data })),
    ...filteredShows.map((data): ResultItem => ({ kind: 'show', data })),
    ...filteredPlaylists.map((data): ResultItem => ({ kind: 'playlist', data })),
  ], [filteredNav, filteredMovies, filteredShows, filteredPlaylists]);

  const selectItem = useCallback((item: AnyItem) => {
    if (item.kind === 'nav') { onNavigate(item.path); onClose(); return; }
    if (item.kind === 'movie') onSelectMovie(item.data);
    else if (item.kind === 'show') onSelectShow(item.data);
    else onSelectPlaylist(item.data);
    onClose();
  }, [onNavigate, onClose, onSelectMovie, onSelectShow, onSelectPlaylist]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        return;
      }
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && activeIndex >= 0 && allItems[activeIndex]) {
        e.preventDefault();
        selectItem(allItems[activeIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, allItems, activeIndex, selectItem]);

  useEffect(() => { setActiveIndex(-1); }, [query]);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value), []);

  const hasContentResults = filteredMovies.length > 0 || filteredShows.length > 0 || filteredPlaylists.length > 0;

  let globalIndex = -1;

  const renderNavItem = (item: NavResultItem) => {
    globalIndex++;
    const idx = globalIndex;
    const isActive = idx === activeIndex;
    return (
      <button
        key={item.path}
        ref={isActive ? activeItemRef : null}
        className={`search-modal-item search-modal-item--nav${isActive ? ' search-modal-item--active' : ''}`}
        onClick={() => { onNavigate(item.path); onClose(); }}
      >
        <div className="search-modal-item-nav-icon">{item.icon}</div>
        <div className="search-modal-item-info">
          {item.sublabel ? (
            <div className="search-modal-item-title" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ opacity: 0.5 }}>{item.label}</span>
              <ChevronRight size={12} style={{ opacity: 0.4 }} />
              <span>{item.sublabel}</span>
            </div>
          ) : (
            <div className="search-modal-item-title">{item.label}</div>
          )}
        </div>
      </button>
    );
  };

  const renderResultItem = (item: ResultItem) => {
    globalIndex++;
    const idx = globalIndex;
    const isActive = idx === activeIndex;

    if (item.kind === 'movie') {
      const movie = item.data;
      return (
        <button
          key={`movie-${movie.id}`}
          ref={isActive ? activeItemRef : null}
          className={`search-modal-item${isActive ? ' search-modal-item--active' : ''}`}
          onClick={() => { onSelectMovie(movie); onClose(); }}
        >
          {movie.posterPath ? (
            <img src={movie.posterPath} alt={movie.title} className="search-modal-item-poster" />
          ) : (
            <div className="search-modal-item-poster-placeholder"><Film size={24} /></div>
          )}
          <div className="search-modal-item-info">
            <div className="search-modal-item-title">{movie.title}</div>
            {movie.releaseYear && <div className="search-modal-item-meta">{movie.releaseYear}</div>}
          </div>
        </button>
      );
    }

    if (item.kind === 'show') {
      const show = item.data;
      return (
        <button
          key={`show-${show.id}`}
          ref={isActive ? activeItemRef : null}
          className={`search-modal-item${isActive ? ' search-modal-item--active' : ''}`}
          onClick={() => { onSelectShow(show); onClose(); }}
        >
          {show.posterPath ? (
            <img src={show.posterPath} alt={show.title} className="search-modal-item-poster" />
          ) : (
            <div className="search-modal-item-poster-placeholder"><Tv size={24} /></div>
          )}
          <div className="search-modal-item-info">
            <div className="search-modal-item-title">{show.title}</div>
            {show.firstAirYear && <div className="search-modal-item-meta">{show.firstAirYear}</div>}
          </div>
        </button>
      );
    }

    const playlist = item.data;
    return (
      <button
        key={`playlist-${playlist.id}`}
        ref={isActive ? activeItemRef : null}
        className={`search-modal-item${isActive ? ' search-modal-item--active' : ''}`}
        onClick={() => { onSelectPlaylist(playlist); onClose(); }}
      >
        <div className="search-modal-item-poster-placeholder search-modal-item-playlist-icon">
          <ListMusic size={24} />
        </div>
        <div className="search-modal-item-info">
          <div className="search-modal-item-title">{playlist.name}</div>
          <div className="search-modal-item-meta">
            {playlist.itemCount} item{playlist.itemCount !== 1 ? 's' : ''}
            {playlist.description ? ` · ${playlist.description}` : ''}
          </div>
        </div>
      </button>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} customContent={true}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search movies, shows, playlists..."
            value={query}
            onChange={handleQueryChange}
            autoFocus
            className="search-modal-input"
          />
          <button className="search-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="search-modal-results">
          {filteredNav.length > 0 && (
            <div className="search-modal-section">
              <h3 className="search-modal-section-title">Navigate to</h3>
              <div className="search-modal-items">
                {filteredNav.map((item) => renderNavItem(item))}
              </div>
            </div>
          )}

          {query && hasContentResults && (
            <>
              {filteredMovies.length > 0 && (
                <div className="search-modal-section">
                  <h3 className="search-modal-section-title"><Film size={16} /> Movies</h3>
                  <div className="search-modal-items">
                    {filteredMovies.map((movie) => renderResultItem({ kind: 'movie', data: movie }))}
                  </div>
                </div>
              )}
              {filteredShows.length > 0 && (
                <div className="search-modal-section">
                  <h3 className="search-modal-section-title"><Tv size={16} /> TV Shows</h3>
                  <div className="search-modal-items">
                    {filteredShows.map((show) => renderResultItem({ kind: 'show', data: show }))}
                  </div>
                </div>
              )}
              {filteredPlaylists.length > 0 && (
                <div className="search-modal-section">
                  <h3 className="search-modal-section-title"><ListMusic size={16} /> Playlists</h3>
                  <div className="search-modal-items">
                    {filteredPlaylists.map((playlist) => renderResultItem({ kind: 'playlist', data: playlist }))}
                  </div>
                </div>
              )}
            </>
          )}

          {query && !hasContentResults && filteredNav.length === 0 && (
            <div className="search-modal-empty">No results found for "{query}"</div>
          )}
        </div>

        <div className="search-modal-footer">
          <kbd>↑</kbd><kbd>↓</kbd> navigate &nbsp;·&nbsp; <kbd>Enter</kbd> select &nbsp;·&nbsp; <kbd>Esc</kbd> close
        </div>
      </div>
    </Modal>
  );
});
