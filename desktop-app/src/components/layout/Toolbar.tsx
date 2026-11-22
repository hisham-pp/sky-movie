'use client';

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { NavControls } from '../common';
import { SearchPill } from './SearchPill';
import { WindowControls } from './WindowControls';
import { windowMaximize, windowMoveBy } from '@/queries';
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
  const [isHovered, setIsHovered] = useState(false);
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isSearchOpen) {
      setSearchActive(true);
    }
  }, [isSearchOpen]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return; // left-click only
    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        'button, input, select, textarea, a, [role="button"], .window-controls, .nav-controls, .search-pill, .toolbar-badge'
      )
    ) {
      return;
    }
    // Double click on titlebar empty area toggles maximize
    if (e.detail === 2) {
      windowMaximize().catch(() => {});
      return;
    }
    // Window dragging
    const header = e.currentTarget;
    header.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    lastPosRef.current = { x: e.screenX, y: e.screenY };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.screenX - lastPosRef.current.x;
    const deltaY = e.screenY - lastPosRef.current.y;
    lastPosRef.current = { x: e.screenX, y: e.screenY };
    if (deltaX !== 0 || deltaY !== 0) {
      windowMoveBy(deltaX, deltaY);
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  }, []);

  const isBarOpen = isSearchOpen || searchActive;

  return (
    <>
      <div className="topbar-feather-blur" aria-hidden="true" />
      <header
        className={`toolbar${isBarOpen ? ' toolbar--search-open' : ''}${isHovered ? ' toolbar--hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
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
