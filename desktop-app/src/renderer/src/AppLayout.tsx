import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { MetadataMatchDialog } from './components/MetadataMatchDialog';
import { SearchModal } from './components/SearchModal';
import { UnrecognizedDrawer } from './components/UnrecognizedDrawer';
import { Sidebar } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';
import { Toolbar } from './components/Toolbar';
import { LibraryControllerProvider, useLibraryControllerContext } from './hooks/LibraryControllerContext';
import { useGlobalKeyboardShortcuts } from './hooks/useGlobalKeyboardShortcuts';
import { LoadingScreen } from './components/LoadingScreen';
import { WindowControls } from './components/WindowControls';
import type { ViewMode } from './types';

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

  // Get current view from pathname for sidebar highlighting
  const getCurrentView = (): ViewMode => {
    if (location.pathname === '/settings') return 'settings';
    if (location.pathname === '/scan') return 'scan';
    if (location.pathname.startsWith('/playlists')) return 'playlists';
    if (location.pathname.startsWith('/shows')) return 'shows';
    if (location.pathname.startsWith('/movies')) return 'movies';
    return 'movies';
  };

  const currentView = getCurrentView();

  // Global keyboard shortcuts
  useGlobalKeyboardShortcuts(
    {
      onSearchToggle: () => setIsSearchOpen((prev) => !prev),
      onBack: () => {
        if (library.selectedMovie || library.selectedShow || library.selectedPlaylist) {
          // If in details view, go back to library
          library.backToLibrary();
          navigate(-1);
        } else {
          // Use browser back navigation
          navigate(-1);
        }
      },
      onForward: () => {
        navigate(1);
      },
      onRefresh: () => {
        window.location.reload();
      },
      onHome: () => {
        navigate('/movies');
      },
      onSettings: () => {
        navigate('/settings');
      },
      onScan: () => {
        navigate('/scan');
      },
      onPlaylists: () => {
        navigate('/playlists');
      },
      onShows: () => {
        navigate('/shows');
      }
    },
    {
      view: currentView,
      selectedMovie: library.selectedMovie,
      selectedShow: library.selectedShow,
      selectedPlaylist: library.selectedPlaylist
    }
  );

  const handleViewChange = (view: ViewMode) => {
    switch (view) {
      case 'settings':
        navigate('/settings');
        break;
      case 'scan':
        navigate('/scan');
        break;
      case 'playlists':
        navigate('/playlists');
        break;
      case 'shows':
        navigate('/shows');
        break;
      case 'movies':
        navigate('/movies');
        break;
      default:
        navigate('/movies');
    }
  };

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
          onToggleExpand={() => setSidebarExpanded((p) => !p)}
        />
      )}

      <section className="workspace">
        <Toolbar
          onOpenSearch={() => setIsSearchOpen(true)}
          unmatchedCount={library.unmatchedFiles.length}
          onOpenUnrecognized={() => setIsUnrecognizedOpen(true)}
        />

        <Outlet />

        <StatusBar status={library.status} lastScan={library.lastScan} />
        <MetadataMatchDialog
          prompt={library.metadataPrompt}
          busy={library.busy}
          onApply={library.applyPromptMetadata}
          onSkip={library.skipPromptMetadata}
        />

        <UnrecognizedDrawer
          isOpen={isUnrecognizedOpen}
          onClose={() => setIsUnrecognizedOpen(false)}
          unmatchedFiles={library.unmatchedFiles}
          busy={library.busy}
          onSearchMetadata={library.searchUnmatchedFileMetadata}
          onApplyMetadata={library.applyUnmatchedFileMetadata}
          onMarkAsIgnored={library.markFileAsIgnored}
          onUnmarkAsIgnored={library.unmarkFileAsIgnored}
        />

        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          movies={library.movies}
          shows={library.shows}
          playlists={library.playlists}
          onSelectMovie={async (movie) => {
            await library.selectMovie(movie);
            navigate(`/movies/${movie.id}`);
          }}
          onSelectShow={async (show) => {
            await library.selectShow(show);
            navigate(`/shows/${show.id}`);
          }}
          onSelectPlaylist={async (playlist) => {
            await library.selectPlaylist(playlist);
            navigate(`/playlists/${playlist.id}`);
          }}
          onNavigate={(path) => navigate(path)}
        />

      </section>
    </main>
    </>
  );
}
