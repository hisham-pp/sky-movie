'use client';

import { memo, useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { NavControls } from '../common';
import { SearchPill } from './SearchPill';
import { WindowControls } from './WindowControls';
import type { Movie, TvShow, Playlist } from '@shared/ipc';

export interface ToolbarProps {
  unmatchedCount?: number;
  onOpenUnrecognized?: () => void;
  onBack?: () => void;
  onForward?: () => void;
  onRefresh?: () => void;
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
  onRefresh,
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
        <div className="toolbar-spacer toolbar-spacer--left">
          <NavControls onBack={onBack} onForward={onForward} onRefresh={onRefresh} />
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

        <div className="toolbar-spacer toolbar-spacer--right">
          {unmatchedCount && unmatchedCount > 0 && onOpenUnrecognized ? (
            <button className="toolbar-badge" onClick={onOpenUnrecognized}>
              <AlertTriangle size={18} />
              <span>Unrecognized</span>
              <span className="badge-count">{unmatchedCount}</span>
            </button>
          ) : null}
          <WindowControls />
        </div>
      </header>
    </>
  );
});
