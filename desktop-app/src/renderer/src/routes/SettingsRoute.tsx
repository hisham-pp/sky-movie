import { SettingsPanel } from '../components/settings/SettingsPanel';
import { useLibraryControllerContext as useLibraryController } from '../hooks/LibraryControllerContext';

export function SettingsRoute() {
  const library = useLibraryController();
  
  return (
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
  );
}
