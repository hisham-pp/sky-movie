import { memo, useMemo, useState, useCallback } from 'react';
import { Film, Tv, Clock, CheckCircle2, RotateCcw, Trash2, Play, History, Grid3x3, List } from 'lucide-react';
import type { WatchHistoryItem } from '@shared/ipc';
import { EmptyLibraryState } from '../library/EmptyLibraryState';
import { SectionTitle } from '../library/SectionTitle';
import { Button, Tooltip } from '../common';
import { formatDuration, formatPosition, formatRelativeDate } from '../../utils/dateUtils';

interface Props {
  items: WatchHistoryItem[];
  loading: boolean;
  activeMediaFileId: number | null;
  onPlay(item: WatchHistoryItem): void;
  onClear(): void;
  onDeleteItem(mediaFileId: number): void;
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
  onDelete(mediaFileId: number): void;
}

const HistoryGridItem = memo(function HistoryGridItem({
  item,
  isPlaying,
  onPlay,
  onDelete
}: HistoryItemProps) {
  const progress = useMemo(
    () => (item.durationSeconds > 0 ? Math.min(100, (item.positionSeconds / item.durationSeconds) * 100) : 0),
    [item.positionSeconds, item.durationSeconds],
  );

  return (
    <div
      className={`tile wh-tile${isPlaying ? ' tile-selected' : ''}`}
      onClick={() => onPlay(item)}
    >
      <div className="poster wh-grid-poster">
        {item.posterPath ? (
          <img src={item.posterPath} alt={item.title} loading="lazy" decoding="async" />
        ) : (
          <div className="wh-poster-placeholder">
            {item.mediaKind === 'show' ? <Tv size={34} /> : <Film size={34} />}
          </div>
        )}
        <span className="tile-badge">
          {item.mediaKind === 'show' ? 'TV SHOW' : 'MOVIE'}
        </span>
        {item.completed ? (
          <span className="wh-tile-status-badge wh-done">
            <CheckCircle2 size={11} /> DONE
          </span>
        ) : item.watchCount > 1 ? (
          <span className="wh-tile-status-badge">
            <RotateCcw size={11} /> {item.watchCount}×
          </span>
        ) : null}

        <Tooltip content="Remove from history">
          <button
            className="wh-tile-del-btn"
            aria-label="Remove from history"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.mediaFileId);
            }}
          >
            <Trash2 size={13} />
          </button>
        </Tooltip>

        {!item.completed && item.durationSeconds > 0 && (
          <div className="wh-tile-progress-bar">
            <div className="wh-tile-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}

        <span className="tile-overlay">
          <strong>{item.title}</strong>
          <small>
            {item.completed
              ? 'Completed'
              : `${formatPosition(item.positionSeconds)}${item.durationSeconds > 0 ? ` / ${formatDuration(item.durationSeconds)}` : ''}`}
          </small>
          <Tooltip content={item.completed ? 'Play again' : 'Resume playback'}>
            <button
              className="details-button"
              aria-label={item.completed ? 'Play again' : 'Resume'}
              onClick={(e) => {
                e.stopPropagation();
                onPlay(item);
              }}
            >
              <Play size={16} fill="currentColor" />
            </button>
          </Tooltip>
        </span>
      </div>
      <strong>{item.title}</strong>
      <span>{formatRelativeDate(item.lastWatchedAt)}</span>
    </div>
  );
});

const HistoryItem = memo(function HistoryItem({ item, isPlaying, onPlay, onDelete }: HistoryItemProps) {
  const progress = useMemo(
    () => (item.durationSeconds > 0 ? Math.min(100, (item.positionSeconds / item.durationSeconds) * 100) : 0),
    [item.positionSeconds, item.durationSeconds],
  );

  const handleClick = useCallback(() => onPlay(item), [item, onPlay]);
  const handlePlayClick = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); onPlay(item); },
    [item, onPlay],
  );
  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(item.mediaFileId);
    },
    [item.mediaFileId, onDelete],
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

      <div className="wh-item-actions flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Tooltip content={item.completed ? 'Play again' : 'Resume'}>
          <button
            className="wh-play-btn"
            onClick={handlePlayClick}
            aria-label={item.completed ? 'Play again' : 'Resume'}
          >
            <Play size={16} fill="currentColor" />
          </button>
        </Tooltip>
        <Tooltip content="Remove from history">
          <button
            className="wh-del-btn"
            onClick={handleDeleteClick}
            aria-label="Remove from history"
          >
            <Trash2 size={14} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
});

export const WatchHistoryPage = memo(function WatchHistoryPage({
  items,
  loading,
  activeMediaFileId,
  onPlay,
  onClear,
  onDeleteItem,
}: Props) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const completedCount = useMemo(() => items.filter((i) => i.completed).length, [items]);
  const inProgressCount = useMemo(() => items.filter((i) => !i.completed).length, [items]);

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
    <div className="browse-grid">
      <section className="library-list wh-page-scroller">
        <div className="wh-header-clean mt-6 mb-5">
          <div className="wh-header-title">
            <History size={26} className="text-[var(--primary)]" />
            <div>
              <span className="playlist-browse-kicker">Activity</span>
              <h1 className="text-2xl font-bold text-[var(--ink)]">Watch History</h1>
            </div>
            {!loading && <span className="wh-count">{items.length}</span>}
          </div>

          <div className="wh-header-actions">
            {items.length > 0 && (
              <Button
                variant="danger"
                size="small"
                icon={<Trash2 size={14} />}
                onClick={handleClear}
                onBlur={handleBlur}
              >
                {confirmClear ? 'Confirm clear?' : 'Clear History'}
              </Button>
            )}
          </div>
        </div>

        <div className="filter-row justify-between mb-4">
          <div className="flex items-center gap-2">
            {(['all', 'in-progress', 'completed'] as const).map((f) => (
              <button
                key={f}
                className={`filter-toggle-btn${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All Activity' : f === 'in-progress' ? 'In Progress' : 'Completed'}
              </button>
            ))}
          </div>
          <div className="view-mode-toggle">
            <Tooltip content="Grid view">
              <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} aria-label="Grid view">
                <Grid3x3 size={17} />
              </button>
            </Tooltip>
            <Tooltip content="List view">
              <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} aria-label="List view">
                <List size={17} />
              </button>
            </Tooltip>
          </div>
        </div>

        <SectionTitle
          title={filter === 'all' ? 'All Titles' : filter === 'in-progress' ? 'In Progress' : 'Completed'}
          count={filtered.length}
        />

        {loading ? (
          <div className="wh-empty">
            <div className="wh-spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyLibraryState
            icon={<History size={34} />}
            label={items.length > 0 ? 'No matches' : 'No watch history yet'}
            title={items.length > 0 ? 'Try selecting a different filter.' : 'Your watched movies and shows will appear here.'}
            description={items.length > 0 ? '' : 'As you play media from your library, Sky Movie tracks your progress so you can resume anytime.'}
          />
        ) : viewMode === 'grid' ? (
          <div className="poster-grid wh-poster-grid">
            {filtered.map((item) => (
              <HistoryGridItem
                key={item.mediaFileId}
                item={item}
                isPlaying={activeMediaFileId === item.mediaFileId}
                onPlay={onPlay}
                onDelete={onDeleteItem}
              />
            ))}
          </div>
        ) : (
          <div className="wh-list">
            {filtered.map((item) => (
              <HistoryItem
                key={item.mediaFileId}
                item={item}
                isPlaying={activeMediaFileId === item.mediaFileId}
                onPlay={onPlay}
                onDelete={onDeleteItem}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
});
