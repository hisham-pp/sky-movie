import { useState, useEffect, useRef } from 'react';
import { LibraryView } from './components/LibraryView';
import { MetadataMatchDialog } from './components/MetadataMatchDialog';
import { PlaylistView } from './components/PlaylistView';
import { ScanPanel } from './components/ScanPanel';
import { SearchModal } from './components/SearchModal';
import { UnrecognizedDrawer } from './components/UnrecognizedDrawer';
import { SettingsPanel } from './components/SettingsPanel';
import { Sidebar } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';
import { Toolbar } from './components/Toolbar';
import { useLibraryController } from './hooks/useLibraryController';
import { useGlobalKeyboardShortcuts } from './hooks/useGlobalKeyboardShortcuts';
import type { ViewMode } from './types';

export function App() {
  const library = useLibraryController();
  const theme = library.settings?.theme ?? 'cinema';
  const libraryView = library.view === 'shows' ? 'shows' : 'movies';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUnrecognizedOpen, setIsUnrecognizedOpen] = useState(false);
  const navigationHistoryRef = useRef<ViewMode[]>([]);

  // Track navigation history for back navigation
  useEffect(() => {
    const currentView = library.view;
    const history = navigationHistoryRef.current;
    
    // Don't add duplicate consecutive views
    if (history.length === 0 || history[history.length - 1] !== currentView) {
      // Keep only last 10 views to prevent memory issues
      if (history.length >= 10) {
        history.shift();
      }
      history.push(currentView);
    }
  }, [library.view]);

  // Global keyboard shortcuts
  useGlobalKeyboardShortcuts(
    {
      onSearchToggle: () => setIsSearchOpen((prev) => !prev),
      onBack: () => {
        const history = navigationHistoryRef.current;
        
        if (library.selectedMovie || library.selectedShow || library.selectedPlaylist) {
          // If in details view, go back to library
          library.backToLibrary();
          // Remove the current detail view from history
          const currentIndex = history.lastIndexOf(library.view);
          if (currentIndex > 0) {
            history.splice(currentIndex, 1);
          }
        } else if (history.length > 1) {
          // Navigate back to previous view in history
          history.pop(); // Remove current view
          const previousView = history[history.length - 1];
          if (previousView) {
            library.setView(previousView);
          }
        } else {
          // If no history, default to movies
          library.setView('movies');
        }
      },
      onForward: () => {
        // Placeholder for future forward navigation history
        console.log('Forward navigation not implemented yet');
      },
      onRefresh: () => {
        window.location.reload();
      },
      onHome: () => {
        library.setView('movies');
      },
      onSettings: () => {
        library.setView('settings');
      },
      onScan: () => {
        library.setView('scan');
      },
      onPlaylists: () => {
        library.setView('playlists');
      }
    },
    {
      view: library.view,
      selectedMovie: library.selectedMovie,
      selectedShow: library.selectedShow,
      selectedPlaylist: library.selectedPlaylist
    }
  );

  return (
    <main className="app-shell" data-theme={theme}>
      <Sidebar view={library.view} summary={library.summary} onViewChange={library.setView} />

      <section className="workspace">
        <Toolbar 
          onOpenSearch={() => setIsSearchOpen(true)}
          unmatchedCount={library.unmatchedFiles.length}
          onOpenUnrecognized={() => setIsUnrecognizedOpen(true)}
        />

        {library.view === 'settings' ? (
          <SettingsPanel
            settings={library.settings}
            scanMode={library.scanMode}
            matcherStrategy={library.matcherStrategy}
            extractFileMetadata={library.extractFileMetadata}
            libraryFolders={library.libraryFolders}
            busy={library.busy}
            onSave={library.saveSettings}
            onChooseFolders={library.chooseLibraryFolders}
            onRemoveFolder={library.removeLibraryFolder}
            onClear={library.clearLocalData}
            onBackup={library.createBackup}
            onRestore={library.restoreBackup}
            onDownloadLocal={library.downloadLocalFiles}
          />
        ) : library.view === 'scan' ? (
          <ScanPanel
            libraryFolders={library.libraryFolders}
            scanMode={library.scanMode}
            matcherStrategy={library.matcherStrategy}
            extractFileMetadata={library.extractFileMetadata}
            busy={library.busy}
            lastScan={library.lastScan}
            onScanLibraries={library.scanLibraries}
            onOpenSettings={() => library.setView('settings')}
          />
        ) : library.view === 'playlists' ? (
          <PlaylistView
            playlists={library.playlists}
            selectedPlaylist={library.selectedPlaylist}
            playlistItems={library.playlistItems}
            selectedTitle={library.selectedTitle}
            busy={library.busy}
            onSelectPlaylist={library.selectPlaylist}
            onCreatePlaylist={(name, description) => library.createPlaylist({ name, description })}
            onUpdatePlaylist={(id, name, description) => library.updatePlaylist({ id, name, description })}
            onDeletePlaylist={library.deletePlaylist}
            onRemoveFromPlaylist={(playlistId, itemId) => library.removeFromPlaylist({ playlistId, itemId })}
            onReorderPlaylistItem={(playlistId, itemId, newSortOrder) => library.reorderPlaylistItem(playlistId, itemId, newSortOrder)}
            onBackToLibrary={library.backToLibrary}
            onSelectMovie={library.selectMovie}
            onSelectShow={library.selectShow}
          />
        ) : (
          <LibraryView
            view={libraryView}
            movies={library.movies}
            shows={library.shows}
            selectedTitle={library.selectedTitle}
            selectedMovie={library.selectedMovie}
            selectedShow={library.selectedShow}
            selectedEpisodes={library.selectedEpisodes}
            selectedFiles={library.selectedFiles}
            metadataQuery={library.metadataQuery}
            metadataResults={library.metadataResults}
            busy={library.busy}
            player={library.player}
            lastScan={library.lastScan}
            playlists={library.playlists}
            onSelectMovie={library.selectMovie}
            onSelectShow={library.selectShow}
            onViewMovieDetails={library.viewMovieDetails}
            onViewShowDetails={library.viewShowDetails}
            onBackToLibrary={library.backToLibrary}
            onMetadataQueryChange={library.setMetadataQuery}
            onSearchMetadata={library.searchSelectedMetadata}
            onApplyMetadata={library.applySelectedMetadata}
            onPlay={library.play}
            onOpenExternal={library.openExternal}
            onDeleteFile={library.deleteFile}
            onShowInFolder={library.showItemInFolder}
            onAddToPlaylist={(playlistId, mediaKind, itemId) => library.addToPlaylist({ playlistId, mediaKind, movieId: mediaKind === 'movie' ? itemId : undefined, showId: mediaKind === 'show' ? itemId : undefined })}
          />
        )}

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
          onSelectMovie={(movie) => {
            library.viewMovieDetails(movie);
          }}
          onSelectShow={(show) => {
            library.viewShowDetails(show);
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
