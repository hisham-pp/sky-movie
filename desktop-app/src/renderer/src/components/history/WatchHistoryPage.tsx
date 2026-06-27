import { memo, useMemo, useState, useCallback } from 'react';
import { Film, Tv, Clock, CheckCircle2, RotateCcw, Trash2, Play, History } from 'lucide-react';
import type { WatchHistoryItem } from '@shared/ipc';
import { formatDuration, formatPosition, formatRelativeDate } from '../../utils/dateUtils';

interface Props {
  items: WatchHistoryItem[];
  loading: boolean;
  activeMediaFileId: number | null;
  onPlay(item: WatchHistoryItem): void;
  onClear(): void;
}

const PosterPlaceholder = memo(function PosterPlaceholder({ kind }: { kind: string }) {
  return (
    <div className="wh-poster wh-poster--empty">
      {kind === 'show' ? <Tv size={24} /> : <Film size={24} />}
    </div>
  );
});

interface HistoryItemProps {
  item: WatchHistoryItem;
  isPlaying: boolean;
  onPlay(item: WatchHistoryItem): void;
}

const HistoryItem = memo(function HistoryItem({ item, isPlaying, onPlay }: HistoryItemProps) {
  const progress = useMemo(
    () => (item.durationSeconds > 0 ? Math.min(100, (item.positionSeconds / item.durationSeconds) * 100) : 0),
    [item.positionSeconds, item.durationSeconds],
  );

  const handleClick = useCallback(() => onPlay(item), [item, onPlay]);
  const handlePlayClick = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); onPlay(item); },
    [item, onPlay],
  );

  return (
    <div
      className={`wh-item${isPlaying ? ' wh-item--playing' : ''}`}
      onClick={handleClick}
    >
      {item.posterPath ? (
        <img className="wh-poster" src={item.posterPath} alt={item.title} loading="lazy" />
      ) : (
        <PosterPlaceholder kind={item.mediaKind} />
      )}

      <div className="wh-item-info">
        <div className="wh-item-title">{item.title}</div>

        <div className="wh-item-meta">
          <span className="wh-badge">
            {item.mediaKind === 'show' ? <Tv size={11} /> : <Film size={11} />}
            {item.mediaKind === 'show' ? 'TV Show' : 'Movie'}
          </span>

          {item.completed ? (
            <span className="wh-badge wh-badge--done">
              <CheckCircle2 size={11} /> Completed
            </span>
          ) : (
            <span className="wh-badge wh-badge--progress">
              <Clock size={11} /> {formatPosition(item.positionSeconds)}
              {item.durationSeconds > 0 && ` / ${formatDuration(item.durationSeconds)}`}
            </span>
          )}

          {item.watchCount > 1 && (
            <span className="wh-badge">
              <RotateCcw size={11} /> {item.watchCount}×
            </span>
          )}

          <span className="wh-date">{formatRelativeDate(item.lastWatchedAt)}</span>
        </div>

        {!item.completed && item.durationSeconds > 0 && (
          <div className="wh-progress-bar">
            <div className="wh-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <button
        className="wh-play-btn"
        onClick={handlePlayClick}
        title={item.completed ? 'Play again' : 'Resume'}
      >
        <Play size={16} fill="currentColor" />
      </button>
    </div>
  );
});

export const WatchHistoryPage = memo(function WatchHistoryPage({
  items,
  loading,
  activeMediaFileId,
  onPlay,
  onClear,
}: Props) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress'>('all');

  const filtered = useMemo(() => {
    if (filter === 'completed') return items.filter((i) => i.completed);
    if (filter === 'in-progress') return items.filter((i) => !i.completed);
    return items;
  }, [items, filter]);

  const handleClear = useCallback(() => {
    if (confirmClear) {
      onClear();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  }, [confirmClear, onClear]);

  const handleBlur = useCallback(() => setConfirmClear(false), []);

  return (
    <div className="wh-page">
      <div className="wh-header">
        <div className="wh-header-title">
          <History size={20} />
          <h2>Watch History</h2>
          {!loading && <span className="wh-count">{items.length}</span>}
        </div>

        <div className="wh-header-actions">
          <div className="wh-filter-tabs">
            {(['all', 'in-progress', 'completed'] as const).map((f) => (
              <button
                key={f}
                className={`wh-filter-tab${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : 'Completed'}
              </button>
            ))}
          </div>

          {items.length > 0 && (
            <button
              className={`wh-clear-btn${confirmClear ? ' wh-clear-btn--confirm' : ''}`}
              onClick={handleClear}
              onBlur={handleBlur}
              title="Clear watch history"
            >
              <Trash2 size={14} />
              {confirmClear ? 'Confirm clear?' : 'Clear History'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="wh-empty">
          <div className="wh-spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="wh-empty">
          <History size={48} />
          <p>{items.length === 0 ? 'No watch history yet.' : 'Nothing matches this filter.'}</p>
        </div>
      ) : (
        <div className="wh-list">
          {filtered.map((item) => (
            <HistoryItem
              key={item.mediaFileId}
              item={item}
              isPlaying={activeMediaFileId === item.mediaFileId}
              onPlay={onPlay}
            />
          ))}
        </div>
      )}
    </div>
  );
});
