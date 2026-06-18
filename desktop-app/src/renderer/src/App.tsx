import { LibraryView } from './components/LibraryView';
import { SettingsPanel } from './components/SettingsPanel';
import { Sidebar } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';
import { Toolbar } from './components/Toolbar';
import { useLibraryController } from './hooks/useLibraryController';

export function App() {
  const library = useLibraryController();

  return (
    <main className="app-shell">
      <Sidebar view={library.view} summary={library.summary} onViewChange={library.setView} />

      <section className="workspace">
        <Toolbar
          query={library.query}
          scanMode={library.scanMode}
          matcherStrategy={library.matcherStrategy}
          extractFileMetadata={library.extractFileMetadata}
          selectedFolderPath={library.selectedScanFolder}
          busy={library.busy}
          onQueryChange={library.setQuery}
          onScanModeChange={library.setScanMode}
          onMatcherStrategyChange={library.setMatcherStrategy}
          onExtractFileMetadataChange={library.setExtractFileMetadata}
          onChooseFolder={library.chooseLibraryFolder}
          onScan={library.scanLibrary}
        />

        {library.view === 'settings' ? (
          <SettingsPanel
            settings={library.settings}
            scanMode={library.scanMode}
            matcherStrategy={library.matcherStrategy}
            extractFileMetadata={library.extractFileMetadata}
            busy={library.busy}
            onSave={library.saveSettings}
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
            selectedFiles={library.selectedFiles}
            player={library.player}
            lastScan={library.lastScan}
            onSelectMovie={library.selectMovie}
            onSelectShow={library.selectShow}
            onPlay={library.play}
          />
        )}

        <StatusBar status={library.status} lastScan={library.lastScan} />
      </section>
    </main>
  );
}
