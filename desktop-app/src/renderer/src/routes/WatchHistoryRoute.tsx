import { useState, useEffect, useCallback } from 'react';
import type { WatchHistoryItem } from '@shared/ipc';
import { WatchHistoryPage } from '../components/history/WatchHistoryPage';
import { useLibraryControllerContext } from '../hooks/LibraryControllerContext';

export function WatchHistoryRoute() {
  const library = useLibraryControllerContext();
  const [items, setItems] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.skyMovie.getWatchHistory();
      setItems(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePlay = (item: WatchHistoryItem) => {
    library.playById(item.mediaFileId);
  };

  const handleClear = async () => {
    await window.skyMovie.clearWatchHistory();
    setItems([]);
  };

  return (
    <WatchHistoryPage
      items={items}
      loading={loading}
      activeMediaFileId={library.player?.mediaFileId ?? null}
      onPlay={handlePlay}
      onClear={handleClear}
    />
  );
}
