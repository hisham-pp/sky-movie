import { SettingsPanel } from '../components/SettingsPanel';

interface SettingsRouteProps {
  settings: any;
  scanMode: any;
  matcherStrategy: any;
  extractFileMetadata: any;
  libraryFolders: any[];
  busy: boolean;
  onSave: (update: any) => Promise<void>;
  onChooseFolders: () => Promise<void>;
  onRemoveFolder: (path: string) => Promise<void>;
  onClear: () => Promise<void>;
  onBackup: () => Promise<void>;
  onRestore: () => Promise<void>;
  onDownloadLocal: () => Promise<void>;
}

export function SettingsRoute(props: SettingsRouteProps) {
  return (
    <SettingsPanel
      settings={props.settings}
      scanMode={props.scanMode}
      matcherStrategy={props.matcherStrategy}
      extractFileMetadata={props.extractFileMetadata}
      libraryFolders={props.libraryFolders}
      busy={props.busy}
      onSave={props.onSave}
      onChooseFolders={props.onChooseFolders}
      onRemoveFolder={props.onRemoveFolder}
      onClear={props.onClear}
      onBackup={props.onBackup}
      onRestore={props.onRestore}
      onDownloadLocal={props.onDownloadLocal}
    />
  );
}
