'use client';

import { memo, useMemo, useCallback, useEffect, useRef, useState, MouseEvent } from 'react';
import { Search, Film, Tv, ListMusic, X, Download, Settings, ChevronRight } from 'lucide-react';
import type { Movie, TvShow, Playlist } from '@shared/ipc';
import { ALL_NAV_ITEMS } from '../../config/navItems';

export interface SearchPillProps {
  isOpen: boolean;
  onOpen?: () => void;
  onClose: () => void;
  onActiveChange?: (active: boolean) => void;
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
  // Downloads sub-pages
  { kind: 'nav', label: 'Downloads', sublabel: 'Search', path: '/downloads/search', icon: <Download size={18} /> },
  { kind: 'nav', label: 'Downloads', sublabel: 'Active', path: '/downloads/downloads', icon: <Download size={18} /> },
  { kind: 'nav', label: 'Downloads', sublabel: 'Completed', path: '/downloads/downloaded', icon: <Download size={18} /> },
  { kind: 'nav', label: 'Downloads', sublabel: 'Settings', path: '/downloads/settings', icon: <Download size={18} /> },
  // Settings sub-pages
  { kind: 'nav', label: 'Settings', sublabel: 'Appearance', path: '/settings/appearance', icon: <Settings size={18} /> },
  { kind: 'nav', label: 'Settings', sublabel: 'Library', path: '/settings/library', icon: <Settings size={18} /> },
  { kind: 'nav', label: 'Settings', sublabel: 'Metadata', path: '/settings/library#metadata', icon: <Settings size={18} /> },
  { kind: 'nav', label: 'Settings', sublabel: 'Backups', path: '/settings/library#backups', icon: <Settings size={18} /> },
  { kind: 'nav', label: 'Settings', sublabel: 'Downloads', path: '/settings/library#downloads', icon: <Settings size={18} /> },
  { kind: 'nav', label: 'Settings', sublabel: 'Local Data', path: '/settings/library#local-data', icon: <Settings size={18} /> },
  { kind: 'nav', label: 'Settings', sublabel: 'Updates', path: '/settings/updates', icon: <Settings size={18} /> },
  { kind: 'nav', label: 'Settings', sublabel: 'Help', path: '/settings/help', icon: <Settings size={18} /> },
];

export const SearchPill = memo(function SearchPill({
  isOpen,
  onOpen,
  onClose,
  onActiveChange,
  movies,
  shows,
  playlists,
  onSelectMovie,
  onSelectShow,
  onSelectPlaylist,
  onNavigate
}: SearchPillProps) {
  const [rendered, setRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const activeItemRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Synchronize opening/closing animation state
  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      setIsClosing(false);
      onActiveChange?.(true);

      // Single frame focus to avoid layout thrashing during animation
      const rafId = requestAnimationFrame(() => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus({ preventScroll: true });
        }
      });

      return () => {
        cancelAnimationFrame(rafId);
      };
    } else if (rendered) {
      inputRef.current?.blur();
      setIsClosing(true);
      const timer = setTimeout(() => {
        setRendered(false);
        setIsClosing(false);
        setQuery('');
        setActiveIndex(-1);
        onActiveChange?.(false);
      }, 230);
      return () => clearTimeout(timer);
    }
  }, [isOpen, rendered, onActiveChange]);

  // Close when clicking outside the search modal container
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (e: MouseEvent | PointerEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (containerRef.current && !containerRef.current.contains(target)) {
        onClose();
      }
    };

    window.addEventListener('pointerdown', handlePointerDownOutside, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDownOutside, true);
    };
  }, [isOpen, onClose]);

  const q = query.toLowerCase();

  const filteredNav = useMemo(() => {
    if (!query) {
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

  // Keyboard navigation & global shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          onOpen?.();
        }
        return;
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Auto-focus input if user starts typing while open
      if (
        document.activeElement !== inputRef.current &&
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        inputRef.current?.focus({ preventScroll: true });
      }

      if (e.key === 'ArrowDown') {
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
  }, [isOpen, onClose, onOpen, allItems, activeIndex, selectItem]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleClearQuery = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    setQuery('');
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const handlePillClick = useCallback((e: MouseEvent) => {
    if (!isOpen) {
      e.stopPropagation();
      onOpen?.();
    } else {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [isOpen, onOpen]);

  const handleBackdropClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    onClose();
  }, [onClose]);

  const hasContentResults = filteredMovies.length > 0 || filteredShows.length > 0 || filteredPlaylists.length > 0;
  const isExpanded = isOpen || (rendered && !isClosing);

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
        onClick={(e) => {
          e.stopPropagation();
          onNavigate(item.path);
          onClose();
        }}
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
          onClick={(e) => {
            e.stopPropagation();
            onSelectMovie(movie);
            onClose();
          }}
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
          onClick={(e) => {
            e.stopPropagation();
            onSelectShow(show);
            onClose();
          }}
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
        onClick={(e) => {
          e.stopPropagation();
          onSelectPlaylist(playlist);
          onClose();
        }}
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
    <>
      {/* Full-screen backdrop identical to modal overlay with smooth synchronized transition */}
      <div
        className={`search-pill-backdrop${isOpen && !isClosing ? ' is-active' : ''}${isClosing ? ' is-closing' : ''}`}
        onClick={handleBackdropClick}
        aria-hidden={!isOpen}
      />

      {/* Pill Anchor in Toolbar */}
      <div className={`search-pill-anchor${rendered ? ' search-pill-anchor--active' : ''}`}>
        <div
          ref={containerRef}
          className={`search-pill${isOpen ? ' is-expanded' : ''}${isClosing ? ' is-closing' : ''}`}
          onClick={handlePillClick}
          role="search"
          tabIndex={rendered ? -1 : 0}
          onKeyDown={(e) => {
            if (!isOpen && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onOpen?.();
            }
          }}
        >
          {/* Header row - always visible, acts as the pill bar */}
          <div className="search-pill-header">
            <Search className="search-pill-icon" size={18} />
            <input
              ref={inputRef}
              type="text"
              className="search-pill-input"
              placeholder={rendered ? 'Search movies, shows, playlists...' : 'Search library'}
              value={rendered ? query : ''}
              onChange={handleQueryChange}
              readOnly={!isOpen}
              tabIndex={isOpen ? 0 : -1}
              spellCheck={false}
              autoComplete="off"
            />
            {rendered ? (
              <div className={`search-pill-actions${isClosing ? ' is-closing' : ''}`}>
                {query && (
                  <button
                    type="button"
                    className="search-pill-btn search-pill-btn--clear"
                    onClick={handleClearQuery}
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
                <kbd
                  className="search-pill-kbd"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  title="Press Esc to close"
                >
                  Esc
                </kbd>
              </div>
            ) : (
              <kbd className="search-shortcut">Ctrl+K</kbd>
            )}
          </div>

          {/* Smooth Expand-Down Dropdown Container */}
          <div className="search-pill-dropdown" aria-hidden={!isOpen}>
            <div className="search-pill-dropdown-inner">
              <div className="search-pill-divider" />
              <div className="search-pill-results">
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

              <div className="search-pill-footer">
                <kbd>↑</kbd><kbd>↓</kbd> navigate &nbsp;·&nbsp; <kbd>Enter</kbd> select &nbsp;·&nbsp; <kbd>Esc</kbd> close
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
