import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { MetadataMatchDialog } from './components/MetadataMatchDialog';
import { SearchModal } from './components/SearchModal';
import { UnrecognizedDrawer } from './components/UnrecognizedDrawer';
import { Sidebar } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';
import { Toolbar } from './components/Toolbar';
import { useLibraryController } from './hooks/useLibraryController';
import { useGlobalKeyboardShortcuts } from './hooks/useGlobalKeyboardShortcuts';
import type { ViewMode } from './types';

export function AppLayout() {
  const library = useLibraryController();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = library.settings?.theme ?? 'cinema';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUnrecognizedOpen, setIsUnrecognizedOpen] = useState(false);

  // Get current view from pathname for sidebar highlighting
  const getCurrentView = (): ViewMode => {
    if (location.pathname === '/settings') return 'settings';
    if (location.pathname === '/scan') return 'scan';
    if (location.pathname === '/playlists') return 'playlists';
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
    <main className="app-shell" data-theme={theme}>
      <Sidebar view={currentView} summary={library.summary} onViewChange={handleViewChange} />

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

        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          movies={library.movies}
          shows={library.shows}
          onSelectMovie={async (movie) => {
            await library.selectMovie(movie);
            navigate(`/movies/${movie.id}`);
          }}
          onSelectShow={async (show) => {
            await library.selectShow(show);
            navigate(`/shows/${show.id}`);
          }}
        />

        <UnrecognizedDrawer
          isOpen={isUnrecognizedOpen}
          onClose={() => setIsUnrecognizedOpen(false)}
          unmatchedFiles={library.unmatchedFiles}
          busy={library.busy}
          onSearchMetadata={library.searchUnmatchedFileMetadata}
          onApplyMetadata={library.applyUnmatchedFileMetadata}
          onMarkAsIgnored={library.markFileAsIgnored}
        />
      </section>
    </main>
  );
}
