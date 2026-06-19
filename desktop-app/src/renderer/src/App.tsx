import { LibraryView } from './components/LibraryView';
import { MetadataMatchDialog } from './components/MetadataMatchDialog';
import { SettingsPanel } from './components/SettingsPanel';
import { Sidebar } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';
import { Toolbar } from './components/Toolbar';
import { useLibraryController } from './hooks/useLibraryController';

export function App() {
  const library = useLibraryController();
  const theme = library.settings?.theme ?? 'cinema';

  return (
    <main className="app-shell" data-theme={theme}>
      <Sidebar view={library.view} summary={library.summary} onViewChange={library.setView} />

      <section className="workspace">
        <Toolbar
          query={library.query}
          onQueryChange={library.setQuery}
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
            onScanLibraries={library.scanLibraries}
            onClear={library.clearLocalData}
            onBackup={library.createBackup}
            onRestore={library.restoreBackup}
            onDownloadLocal={library.downloadLocalFiles}
          />
        ) : (
          <LibraryView
            view={library.view}
            movies={library.movies}
            shows={library.shows}
            selectedTitle={library.selectedTitle}
            selectedMovie={library.selectedMovie}
            selectedShow={library.selectedShow}
            selectedFiles={library.selectedFiles}
            metadataQuery={library.metadataQuery}
            metadataResults={library.metadataResults}
            busy={library.busy}
            player={library.player}
            lastScan={library.lastScan}
            onSelectMovie={library.selectMovie}
            onSelectShow={library.selectShow}
            onMetadataQueryChange={library.setMetadataQuery}
            onSearchMetadata={library.searchSelectedMetadata}
            onApplyMetadata={library.applySelectedMetadata}
            onPlay={library.play}
          />
        )}

        <StatusBar status={library.status} lastScan={library.lastScan} />
        <MetadataMatchDialog
          prompt={library.metadataPrompt}
          busy={library.busy}
          onApply={library.applyPromptMetadata}
          onSkip={library.skipPromptMetadata}
        />
      </section>
    </main>
  );
}
