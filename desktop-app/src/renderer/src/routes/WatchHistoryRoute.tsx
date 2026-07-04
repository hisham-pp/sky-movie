import * as queries from '@renderer/queries';
import { useState, useEffect, useCallback } from 'react';
import type { WatchHistoryItem } from '@shared/ipc';
import { WatchHistoryPage } from '../components/history/WatchHistoryPage';
import { useLibraryControllerContext } from '../hooks/LibraryControllerContext';
import { useResumePlayback } from '../hooks/useResumePlayback';

export function WatchHistoryRoute() {
  const library = useLibraryControllerContext();
  const resumePlayback = useResumePlayback();
  const [items, setItems] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await queries.getWatchHistory();
      setItems(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePlay = useCallback((item: WatchHistoryItem) => {
    void resumePlayback(item);
  }, [resumePlayback]);

  const handleClear = useCallback(async () => {
    await queries.clearWatchHistory();
    setItems([]);
  }, []);

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
