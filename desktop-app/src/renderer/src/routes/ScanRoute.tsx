import { ScanPanel } from '../components/ScanPanel';

interface ScanRouteProps {
  libraryFolders: any[];
  scanMode: any;
  matcherStrategy: any;
  extractFileMetadata: any;
  busy: boolean;
  lastScan: any;
  onScanLibraries: () => Promise<void>;
  onOpenSettings: () => void;
}

export function ScanRoute(props: ScanRouteProps) {
  return (
    <ScanPanel
      libraryFolders={props.libraryFolders}
      scanMode={props.scanMode}
      matcherStrategy={props.matcherStrategy}
      extractFileMetadata={props.extractFileMetadata}
      busy={props.busy}
      lastScan={props.lastScan}
      onScanLibraries={props.onScanLibraries}
      onOpenSettings={props.onOpenSettings}
    />
  );
}
