import { useState, useEffect } from 'react';
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

export function App() {
  const library = useLibraryController();
  const theme = library.settings?.theme ?? 'cinema';
  const libraryView = library.view === 'shows' ? 'shows' : 'movies';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUnrecognizedOpen, setIsUnrecognizedOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Search: Ctrl/Cmd + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      
      // Back navigation: Alt + Left Arrow (Windows/Linux) or Cmd + [ (Mac)
      if ((e.altKey && e.key === 'ArrowLeft') || (e.metaKey && e.key === '[')) {
        e.preventDefault();
        if (library.selectedMovie || library.selectedShow) {
          library.backToLibrary();
        }
      }
      
      // Forward navigation: Alt + Right Arrow (Windows/Linux) or Cmd + ] (Mac)
      if ((e.altKey && e.key === 'ArrowRight') || (e.metaKey && e.key === ']')) {
        e.preventDefault();
        // Navigate forward if there's history (currently not implemented, but placeholder for future)
      }
      
      // Refresh: F5 or Ctrl/Cmd + R
      if (e.key === 'F5' || ((e.metaKey || e.ctrlKey) && e.key === 'r')) {
        e.preventDefault();
        // Trigger refresh of current view
        window.location.reload();
      }
      
      // Home: Alt + Home (Windows/Linux) or Cmd + Shift + H (Mac)
      if ((e.altKey && e.key === 'Home') || (e.metaKey && e.shiftKey && e.key === 'h')) {
        e.preventDefault();
        library.setView('movies');
      }
      
      // Settings: Ctrl/Cmd + ,
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        library.setView('settings');
      }
      
      // Scan: Ctrl/Cmd + Shift + S
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 's') {
        e.preventDefault();
        library.setView('scan');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [library]);

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
