import { memo, useState, useEffect, useCallback } from 'react';
import { Download, Youtube } from 'lucide-react';
import { Modal, Button } from '../common';
import type { YouTubeProgressEvent } from '@shared/ipc';

export const AddYouTubeModal = memo(function AddYouTubeModal({
  isOpen,
  onClose,
  onAdded
}: {
  isOpen: boolean;
  onClose(): void;
  onAdded(): void;
}) {
  const [url, setUrl] = useState('');
  const [folders, setFolders] = useState<{ id: number; path: string; name: string }[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  
  const [progress, setProgress] = useState<YouTubeProgressEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      window.skyMovie.getSettings().then((settings: any) => {
        setFolders(settings.libraryFolders || []);
        if (settings.libraryFolders && settings.libraryFolders.length > 0) {
          setSelectedFolderId(settings.libraryFolders[0].id);
        }
      });
      
      setUrl('');
      setProgress(null);
      setError(null);
      setIsDownloading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const unsub = window.skyMovie.onYouTubeDownloadProgress((event) => {
        if (event.url === url) {
          setProgress(event);
          if (event.status === 'completed') {
            setIsDownloading(false);
            onAdded();
            onClose();
          } else if (event.status === 'error') {
            setIsDownloading(false);
            setError(event.error || 'Failed to download video');
          }
        }
      });
      return () => unsub();
    }
  }, [isOpen, url, onAdded, onClose]);

  const handleDownload = useCallback(() => {
    if (!url || !selectedFolderId) return;
    setError(null);
    setIsDownloading(true);
    
    window.skyMovie.downloadYouTubeVideo({ url, folderId: selectedFolderId })
      .catch((err: any) => {
        setError(err.message);
        setIsDownloading(false);
      });
  }, [url, selectedFolderId]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={isDownloading ? () => {} : onClose} title="Download YouTube Video" maxWidth="medium">
      <div className="p-4 space-y-4">
        
        {folders.length === 0 ? (
          <div className="p-4 text-center text-red-400 bg-red-400/10 rounded-xl">
            You must add a library folder in Settings before downloading videos.
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">YouTube URL</label>
              <input
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={isDownloading}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Save To Folder</label>
              <select
                className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(parseInt(e.target.value))}
                disabled={isDownloading}
              >
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.path})</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-400/10 rounded-lg">
                {error}
              </div>
            )}

            {isDownloading && progress && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs text-white/50">
                  <span>{progress.status === 'downloading' ? 'Downloading...' : 'Processing...'}</span>
                  <span>{progress.progress.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, progress.progress))}%` }}
                  />
                </div>
                {progress.status === 'downloading' && (
                  <div className="flex justify-between text-xs text-white/40">
                    <span>{progress.speed || '-- MiB/s'}</span>
                    <span>ETA: {progress.eta || '--:--'}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-white/10">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isDownloading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={<Download size={16} />}
                onClick={handleDownload}
                disabled={!url || !selectedFolderId || isDownloading}
                className="bg-red-500 hover:bg-red-600 text-white border-none"
              >
                {isDownloading ? 'Downloading...' : 'Download'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
});
