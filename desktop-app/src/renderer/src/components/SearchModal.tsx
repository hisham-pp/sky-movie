import { Search, Film, Tv, ListMusic, X, ScanSearch, Settings, ListVideo } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Movie, TvShow, Playlist } from '@shared/ipc';
import { Modal } from './common';

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

type NavItem = { kind: 'nav'; path: string; label: string; icon: React.ReactNode };

type AnyItem = ResultItem | NavItem;

const NAV_ITEMS: NavItem[] = [
  { kind: 'nav', label: 'Movies', path: '/movies', icon: <Film size={15} /> },
  { kind: 'nav', label: 'TV Shows', path: '/shows', icon: <Tv size={15} /> },
  { kind: 'nav', label: 'Playlists', path: '/playlists', icon: <ListVideo size={15} /> },
  { kind: 'nav', label: 'Scan', path: '/scan', icon: <ScanSearch size={15} /> },
  { kind: 'nav', label: 'Settings', path: '/settings', icon: <Settings size={15} /> },
];

export function SearchModal({
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

  const filteredMovies = query
    ? movies.filter((m) => m.title.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  const filteredShows = query
    ? shows.filter((s) => s.title.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  const filteredPlaylists = query
    ? playlists.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 4)
    : [];

  const resultItems: ResultItem[] = [
    ...filteredMovies.map((data): ResultItem => ({ kind: 'movie', data })),
    ...filteredShows.map((data): ResultItem => ({ kind: 'show', data })),
    ...filteredPlaylists.map((data): ResultItem => ({ kind: 'playlist', data })),
  ];

  // Nav items always included; results come first so arrow-down hits results before nav
  const allItems: AnyItem[] = [...resultItems, ...NAV_ITEMS];

  const selectItem = (item: AnyItem) => {
    if (item.kind === 'nav') { onNavigate(item.path); onClose(); return; }
    if (item.kind === 'movie') onSelectMovie(item.data);
    else if (item.kind === 'show') onSelectShow(item.data);
    else onSelectPlaylist(item.data);
    onClose();
  };

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
  }, [isOpen, onClose, allItems, activeIndex]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // Nav items start after all result items
  const navStartIndex = resultItems.length;

  let globalIndex = -1;

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

  const hasResults = resultItems.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} customContent={true}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search movies, shows, playlists..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="search-modal-input"
          />
          <button className="search-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="search-modal-results">
          {query && hasResults ? (
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
          ) : query ? (
            <div className="search-modal-empty">No results found for "{query}"</div>
          ) : null}

          {/* Nav section — always visible */}
          <div className="search-modal-nav">
            <p className="search-modal-nav-label">Navigate to</p>
            <div className="search-modal-nav-items">
              {NAV_ITEMS.map((item, i) => {
                const idx = navStartIndex + i;
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={item.path}
                    ref={isActive ? activeItemRef : null}
                    className={`search-modal-nav-item${isActive ? ' search-modal-nav-item--active' : ''}`}
                    onClick={() => { onNavigate(item.path); onClose(); }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="search-modal-footer">
          <kbd>↑</kbd><kbd>↓</kbd> navigate &nbsp;·&nbsp; <kbd>Enter</kbd> select &nbsp;·&nbsp; <kbd>Esc</kbd> close
        </div>
      </div>
    </Modal>
  );
}
