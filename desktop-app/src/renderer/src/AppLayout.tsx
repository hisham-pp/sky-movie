import { useState, useCallback, useMemo, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { MetadataMatchDialog } from './components/MetadataMatchDialog';
import { KeyboardShortcutsOverlay } from './components/KeyboardShortcutsOverlay';
import { SearchModal } from './components/SearchModal';
import { UnrecognizedDrawer } from './components/UnrecognizedDrawer';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { LibraryControllerProvider, useLibraryControllerContext } from './hooks/LibraryControllerContext';
import { useGlobalKeyboardShortcuts } from './hooks/useGlobalKeyboardShortcuts';
import { LoadingScreen } from './components/LoadingScreen';
import { WindowControls } from './components/WindowControls';
import { LastWatchedButton } from './components/LastWatchedButton';
import { useResumePlayback } from './hooks/useResumePlayback';
import type { LastWatchedInfo, Movie, TvShow, Playlist } from '@shared/ipc';
import type { ViewMode } from './types';
import { ALL_NAV_ITEMS } from './config/navItems';

export function AppLayout() {
  return (
    <LibraryControllerProvider>
      <AppLayoutInner />
    </LibraryControllerProvider>
  );
}

function AppLayoutInner() {
  const library = useLibraryControllerContext();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = library.settings?.theme ?? 'cinema';
  const hideSidebar = library.settings?.hideSidebar ?? false;
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUnrecognizedOpen, setIsUnrecognizedOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Global toggle for the shortcuts overlay: Ctrl+/ anywhere, or ? outside inputs
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key === '/') {
        e.preventDefault();
        setIsShortcutsOpen((v) => !v);
      } else if (!typing && !e.ctrlKey && !e.metaKey && !e.altKey && e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const currentView = useMemo((): ViewMode => {
    if (location.pathname === '/settings') return 'settings';
    if (location.pathname === '/scan') return 'scan';
    if (location.pathname === '/history') return 'history';
    if (location.pathname.startsWith('/playlists')) return 'playlists';
    if (location.pathname.startsWith('/shows')) return 'shows';
    if (location.pathname.startsWith('/movies')) return 'movies';
    if (location.pathname.startsWith('/downloads')) return 'downloads';
    return 'movies';
  }, [location.pathname]);

  const handleSearchToggle = useCallback(() => setIsSearchOpen((prev) => !prev), []);
  const handleSearchClose = useCallback(() => setIsSearchOpen(false), []);
  const handleUnrecognizedOpen = useCallback(() => setIsUnrecognizedOpen(true), []);
  const handleUnrecognizedClose = useCallback(() => setIsUnrecognizedOpen(false), []);
  const handleToggleSidebar = useCallback(() => setSidebarExpanded((p) => !p), []);

  const handleBack = useCallback(() => {
    if (library.selectedMovie || library.selectedShow || library.selectedPlaylist) {
      library.backToLibrary();
      navigate(-1);
    } else {
      navigate(-1);
    }
  }, [library, navigate]);

  const handleForward = useCallback(() => navigate(1), [navigate]);
  const handleRefresh = useCallback(() => window.location.reload(), []);
  const handleHome = useCallback(() => navigate('/movies'), [navigate]);
  const handleSettings = useCallback(() => navigate('/settings'), [navigate]);
  const handleScan = useCallback(() => navigate('/scan'), [navigate]);
  const handlePlaylists = useCallback(() => navigate('/playlists'), [navigate]);
  const handleShows = useCallback(() => navigate('/shows'), [navigate]);
  const handlePlayLastWatched = useCallback(async () => {
    const result = await window.skyMovie?.getLastWatched();
    if (!result) return;
    window.dispatchEvent(new CustomEvent('sky-movie:play-last-watched', { detail: result }));
  }, []);

  useGlobalKeyboardShortcuts(
    {
      onSearchToggle: handleSearchToggle,
      onBack: handleBack,
      onForward: handleForward,
      onRefresh: handleRefresh,
      onHome: handleHome,
      onSettings: handleSettings,
      onScan: handleScan,
      onPlaylists: handlePlaylists,
      onShows: handleShows,
      onPlayLastWatched: handlePlayLastWatched,
    },
    {
      view: currentView,
      selectedMovie: library.selectedMovie,
      selectedShow: library.selectedShow,
      selectedPlaylist: library.selectedPlaylist,
    }
  );

  const handleViewChange = useCallback((view: ViewMode) => {
    const item = ALL_NAV_ITEMS.find((n) => n.view === view);
    navigate(item?.path ?? '/movies');
  }, [navigate]);

  const resumePlayback = useResumePlayback();
  const handleLastWatchedPlay = useCallback(
    (info: LastWatchedInfo) => { void resumePlayback(info); },
    [resumePlayback],
  );

  const handleSelectMovie = useCallback(async (movie: Movie) => {
    await library.selectMovie(movie);
    navigate(`/movies/${movie.id}`);
  }, [library, navigate]);

  const handleSelectShow = useCallback(async (show: TvShow) => {
    await library.selectShow(show);
    navigate(`/shows/${show.id}`);
  }, [library, navigate]);

  const handleSelectPlaylist = useCallback(async (playlist: Playlist) => {
    await library.selectPlaylist(playlist);
    navigate(`/playlists/${playlist.id}`);
  }, [library, navigate]);

  const handleNavigate = useCallback((path: string) => navigate(path), [navigate]);

  return (
    <>
      <LoadingScreen visible={library.settings === null} />
      <WindowControls />
      <main className={`app-shell${sidebarExpanded ? ' sidebar-expanded' : ''}${hideSidebar ? ' sidebar-hidden' : ''}`} data-theme={theme}>
        {!hideSidebar && (
          <Sidebar
            view={currentView}
            summary={library.summary}
            onViewChange={handleViewChange}
            expanded={sidebarExpanded}
            onToggleExpand={handleToggleSidebar}
          />
        )}

        <section className="workspace">
          <Toolbar
            onOpenSearch={handleSearchToggle}
            unmatchedCount={library.unmatchedFiles.length}
            onOpenUnrecognized={handleUnrecognizedOpen}
          />

          <Outlet />

          <MetadataMatchDialog
            prompt={library.metadataPrompt}
            busy={library.busy}
            onApply={library.applyPromptMetadata}
            onSkip={library.skipPromptMetadata}
          />

          <UnrecognizedDrawer
            isOpen={isUnrecognizedOpen}
            onClose={handleUnrecognizedClose}
            unmatchedFiles={library.unmatchedFiles}
            busy={library.busy}
            onSearchMetadata={library.searchUnmatchedFileMetadata}
            onApplyMetadata={library.applyUnmatchedFileMetadata}
            onMarkAsIgnored={library.markFileAsIgnored}
            onUnmarkAsIgnored={library.unmarkFileAsIgnored}
          />

          <LastWatchedButton
            activeMediaFileId={library.player?.mediaFileId ?? null}
            onPlay={handleLastWatchedPlay}
          />

          <KeyboardShortcutsOverlay
            isOpen={isShortcutsOpen}
            onClose={() => setIsShortcutsOpen(false)}
          />

          <SearchModal
            isOpen={isSearchOpen}
            onClose={handleSearchClose}
            movies={library.movies}
            shows={library.shows}
            playlists={library.playlists}
            onSelectMovie={handleSelectMovie}
            onSelectShow={handleSelectShow}
            onSelectPlaylist={handleSelectPlaylist}
            onNavigate={handleNavigate}
          />
        </section>
      </main>
    </>
  );
}
