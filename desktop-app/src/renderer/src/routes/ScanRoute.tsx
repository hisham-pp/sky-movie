import { useNavigate } from 'react-router-dom';
import { ScanPanel } from '../components/scan/ScanPanel';
import { useLibraryControllerContext as useLibraryController } from '../hooks/LibraryControllerContext';

export function ScanRoute() {
  const library = useLibraryController();
  const navigate = useNavigate();
  
  return (
    <ScanPanel
      libraryFolders={library.libraryFolders}
      scanMode={library.scanMode}
      matcherStrategy={library.matcherStrategy}
      extractFileMetadata={library.extractFileMetadata}
      busy={library.busy}
      lastScan={library.lastScan}
      onScanLibraries={library.scanLibraries}
      onOpenSettings={() => navigate('/settings')}
    />
  );
}
