'use client';

import { memo, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { Tooltip } from '../common';
import { SearchPill } from './SearchPill';
import type { Movie, TvShow, Playlist } from '@shared/ipc';

export interface ToolbarProps {
  unmatchedCount?: number;
  onOpenUnrecognized?: () => void;
  onBack?: () => void;
  onForward?: () => void;
  // Search capabilities
  isSearchOpen: boolean;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  movies: Movie[];
  shows: TvShow[];
  playlists: Playlist[];
  onSelectMovie: (movie: Movie) => void;
  onSelectShow: (show: TvShow) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onNavigate: (path: string) => void;
}

export const Toolbar = memo(function Toolbar({
  unmatchedCount,
  onOpenUnrecognized,
  onBack,
  onForward,
  isSearchOpen,
  onOpenSearch,
  onCloseSearch,
  movies,
  shows,
  playlists,
  onSelectMovie,
  onSelectShow,
  onSelectPlaylist,
  onNavigate,
}: ToolbarProps) {
  const [searchActive, setSearchActive] = useState(isSearchOpen);

  useEffect(() => {
    if (isSearchOpen) {
      setSearchActive(true);
    }
  }, [isSearchOpen]);

  const isBarOpen = isSearchOpen || searchActive;

  return (
    <>
      <div className="topbar-feather-blur" aria-hidden="true" />
      <header className={`toolbar${isBarOpen ? ' toolbar--search-open' : ''}`}>
        <div className="toolbar-spacer">
          <div className="nav-controls">
            <Tooltip content="Go back (Alt+←)">
              <button className="nav-btn" onClick={onBack} aria-label="Go back">
                <ArrowLeft size={18} />
              </button>
            </Tooltip>
            <Tooltip content="Go forward (Alt+→)">
              <button className="nav-btn" onClick={onForward} aria-label="Go forward">
                <ArrowRight size={18} />
              </button>
            </Tooltip>
          </div>
        </div>

        <SearchPill
          isOpen={isSearchOpen}
          onOpen={onOpenSearch}
          onClose={onCloseSearch}
          onActiveChange={setSearchActive}
          movies={movies}
          shows={shows}
          playlists={playlists}
          onSelectMovie={onSelectMovie}
          onSelectShow={onSelectShow}
          onSelectPlaylist={onSelectPlaylist}
          onNavigate={onNavigate}
        />

        <div className="toolbar-spacer">
          {unmatchedCount && unmatchedCount > 0 && onOpenUnrecognized ? (
            <button className="toolbar-badge" onClick={onOpenUnrecognized}>
              <AlertTriangle size={18} />
              <span>Unrecognized</span>
              <span className="badge-count">{unmatchedCount}</span>
            </button>
          ) : null}
        </div>
      </header>
    </>
  );
});
