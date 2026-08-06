import * as queries from '@renderer/queries';
import { ArrowLeft, Loader2, Radio, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { TorrentStreamInfo } from '@shared/ipc';
import { PlayerPanel } from '../components/player/PlayerPanel';

export function TorrentStreamRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stream, setStream] = useState<TorrentStreamInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const streamRef = useRef<TorrentStreamInfo | null>(null);
  const cleanedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      if (!id) {
        setError('Torrent id is missing.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await queries.torrentPrepareStream(id);
        if (cancelled) return;
        streamRef.current = result;
        cleanedRef.current = false;
        setStream(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void prepare();

    return () => {
      cancelled = true;
      const activeStream = streamRef.current;
      streamRef.current = null;
      if (activeStream?.cleanupOnClose && !cleanedRef.current) {
        cleanedRef.current = true;
        void queries.torrentCleanupStream(activeStream.torrentId).catch(() => {});
      }
    };
  }, [id]);

  const cleanupStream = () => {
    const activeStream = streamRef.current;
    if (!activeStream?.cleanupOnClose || cleanedRef.current) return;
    cleanedRef.current = true;
    void queries.torrentCleanupStream(activeStream.torrentId).catch(() => {});
  };

  return (
    <div className="torrent-stream-page">
      <div className="torrent-stream-header">
        <button className="torrent-stream-back" onClick={() => navigate('/downloads')}>
          <ArrowLeft size={16} />
          Downloads
        </button>
        <div className="torrent-stream-title">
          <Radio size={16} />
          <span>{stream?.title ?? 'Torrent stream'}</span>
        </div>
        {stream?.cleanupOnClose && (
          <span className="torrent-stream-cleanup">
            <Trash2 size={13} />
            Cleans partial files on exit
          </span>
        )}
      </div>

      <div className="torrent-stream-player">
        {loading && (
          <div className="torrent-stream-state">
            <Loader2 size={24} className="animate-spin" />
            <span>Preparing stream...</span>
          </div>
        )}

        {!loading && error && (
          <div className="torrent-stream-state torrent-stream-error">
            <p>{error}</p>
            <button onClick={() => navigate('/downloads')}>Back to downloads</button>
          </div>
        )}

        {!loading && stream && <PlayerPanel player={stream} onEnded={cleanupStream} />}
      </div>
    </div>
  );
}
