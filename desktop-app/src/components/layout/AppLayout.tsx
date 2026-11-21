'use client';

import * as queries from '@/queries';
import { useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { MetadataMatchDialog } from '../scan/MetadataMatchDialog';
import { KeyboardShortcutsOverlay } from './KeyboardShortcutsOverlay';
import { SearchModal } from './SearchModal';
import { UnrecognizedDrawer } from '../scan/UnrecognizedDrawer';
import { Sidebar } from './Sidebar';
import { Toolbar } from './Toolbar';
import { LibraryControllerProvider, useLibraryControllerContext } from '@/hooks/LibraryControllerContext';
import { useGlobalKeyboardShortcuts } from '@/hooks/useGlobalKeyboardShortcuts';
import { LoadingScreen } from './LoadingScreen';
import { WindowControls } from './WindowControls';
import { LastWatchedButton } from '../library/LastWatchedButton';
import { FloatingPlayer } from '../player/FloatingPlayer';
import { OnboardingFlow } from '../onboarding/OnboardingFlow';
import { LAUNCH_ONBOARDING_EVENT } from '@/config/events';
import { useResumePlayback } from '@/hooks/useResumePlayback';
import type { LastWatchedInfo, Movie, TvShow, Playlist, AppTheme } from '@/types';
import type { ViewMode } from '@/types';
import { ALL_NAV_ITEMS } from '@/config/navItems';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <LibraryControllerProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </LibraryControllerProvider>
  );
}

function AppLayoutInner({ children }: { children: ReactNode }) {
  const library = useLibraryControllerContext();
  const router = useRouter();
  const pathname = usePathname();
  const theme = library.settings?.theme ?? (typeof window !== 'undefined' ? (localStorage.getItem('sky-movie:theme') as AppTheme | null) : null) ?? 'pitch-black';
  const hideSidebar = library.settings?.hideSidebar ?? false;
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUnrecognizedOpen, setIsUnrecognizedOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [showFloatingPlayer, setShowFloatingPlayer] = useState(false);
  const settings = library.settings;

  // Auto-open the welcome tour once, the first time settings load for a user
  // who has not completed onboarding.
  const onboardingAutoChecked = useRef(false);
  useEffect(() => {
    if (!settings || onboardingAutoChecked.current) return;
    onboardingAutoChecked.current = true;
    if (!settings.onboardingCompleted) setIsOnboardingOpen(true);
  }, [settings]);

  // Relaunch from Settings → Help → Welcome Tour
  useEffect(() => {
    const onLaunch = () => {
      router.push('/movies');
      setIsOnboardingOpen(true);
    };
    window.addEventListener(LAUNCH_ONBOARDING_EVENT, onLaunch);
    return () => window.removeEventListener(LAUNCH_ONBOARDING_EVENT, onLaunch);
  }, [router]);

  const handleOnboardingClose = useCallback(() => setIsOnboardingOpen(false), []);

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
    if (pathname === '/settings') return 'settings';
    if (pathname === '/scan') return 'scan';
    if (pathname === '/history') return 'history';
    if (pathname.startsWith('/playlists')) return 'playlists';
    if (pathname.startsWith('/shows')) return 'shows';
    if (pathname.startsWith('/movies')) return 'movies';
    if (pathname.startsWith('/downloads')) return 'downloads';
    return 'movies';
  }, [pathname]);

  const handleSearchToggle = useCallback(() => setIsSearchOpen((prev) => !prev), []);
  const handleSearchClose = useCallback(() => setIsSearchOpen(false), []);
  const handleUnrecognizedOpen = useCallback(() => setIsUnrecognizedOpen(true), []);
  const handleUnrecognizedClose = useCallback(() => setIsUnrecognizedOpen(false), []);
  const handleToggleSidebar = useCallback(() => setSidebarExpanded((p) => !p), []);

  const handleBack = useCallback(() => {
    if (library.selectedMovie || library.selectedShow || library.selectedPlaylist) {
      library.backToLibrary();
    }
    router.back();
  }, [library, router]);

  const handleForward = useCallback(() => router.forward(), [router]);
  const handleRefresh = useCallback(() => window.location.reload(), []);
  const handleHome = useCallback(() => router.push('/movies'), [router]);
  const handleSettings = useCallback(() => router.push('/settings'), [router]);
  const handleScan = useCallback(() => router.push('/scan'), [router]);
  const handlePlaylists = useCallback(() => router.push('/playlists'), [router]);
  const handleShows = useCallback(() => router.push('/shows'), [router]);
  const handlePlayLastWatched = useCallback(async () => {
    const result = await queries.getLastWatched();
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
    router.push(item?.path ?? '/movies');
  }, [router]);

  const resumePlayback = useResumePlayback();
  const handleLastWatchedPlay = useCallback(
    (info: LastWatchedInfo) => { 
      void resumePlayback(info);
      setShowFloatingPlayer(true);
    },
    [resumePlayback],
  );

  const handleCloseFloatingPlayer = useCallback(() => {
    setShowFloatingPlayer(false);
    library.stopPlayer();
  }, [library]);

  const handleExpandFloatingPlayer = useCallback(() => {
    setShowFloatingPlayer(false);
  }, []);

  // Show floating player when there's an active player
  useEffect(() => {
    if (library.player) {
      setShowFloatingPlayer(true);
    } else {
      setShowFloatingPlayer(false);
    }
  }, [library.player]);

  const handleSelectMovie = useCallback(async (movie: Movie) => {
    await library.selectMovie(movie);
    router.push(`/movies/${movie.id}`);
  }, [library, router]);

  const handleSelectShow = useCallback(async (show: TvShow) => {
    await library.selectShow(show);
    router.push(`/shows/${show.id}`);
  }, [library, router]);

  const handleSelectPlaylist = useCallback(async (playlist: Playlist) => {
    await library.selectPlaylist(playlist);
    router.push(`/playlists/${playlist.id}`);
  }, [library, router]);

  const handleNavigate = useCallback((path: string) => router.push(path), [router]);

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
            onBack={handleBack}
            onForward={handleForward}
          />

          {children}

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

          {showFloatingPlayer && (
            <FloatingPlayer
              player={library.player}
              onClose={handleCloseFloatingPlayer}
              onExpand={handleExpandFloatingPlayer}
            />
          )}

          <KeyboardShortcutsOverlay
            isOpen={isShortcutsOpen}
            onClose={() => setIsShortcutsOpen(false)}
          />

          {isOnboardingOpen && settings && (
            <OnboardingFlow
              settings={settings}
              libraryFolders={library.libraryFolders}
              busy={library.busy}
              onSave={library.saveSettings}
              onChooseFolders={library.chooseLibraryFolders}
              onRemoveFolder={library.removeLibraryFolder}
              onScan={library.scanLibraries}
              onClose={handleOnboardingClose}
            />
          )}

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
