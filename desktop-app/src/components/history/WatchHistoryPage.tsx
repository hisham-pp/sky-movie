'use client';

import { memo, useMemo, useState, useCallback } from 'react';
import { Film, Tv, Clock, CheckCircle2, RotateCcw, Trash2, Play, History, Grid3x3, List } from 'lucide-react';
import type { WatchHistoryItem } from '@shared/ipc';
import { EmptyLibraryState } from '../library/EmptyLibraryState';
import { SectionTitle } from '../library/SectionTitle';
import { Button, Tooltip, PillTabs, type PillTab } from '../common';
import { formatDuration, formatPosition, formatRelativeDate } from '../../utils/dateUtils';
import { toDisplayImageUrl } from '../../utils/imageUrl';

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
  const [imgFailed, setImgFailed] = useState(false);
  const progress = useMemo(
    () => (item.durationSeconds > 0 ? Math.min(100, (item.positionSeconds / item.durationSeconds) * 100) : 0),
    [item.positionSeconds, item.durationSeconds],
  );

  const posterSrc = toDisplayImageUrl(item.posterPath);
  const hasImage = Boolean(posterSrc) && !imgFailed;

  return (
    <div
      className={`tile wh-tile${isPlaying ? ' tile-selected' : ''}`}
      onClick={() => onPlay(item)}
    >
      <div className="poster wh-grid-poster">
        {hasImage ? (
          <img
            src={posterSrc!}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="wh-poster-placeholder">
            <div className="wh-placeholder-glow" />
            <div className="wh-placeholder-icon">
              {item.mediaKind === 'show' ? <Tv size={32} /> : <Film size={32} />}
            </div>
            <div className="wh-placeholder-title">{item.title}</div>
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
  const [imgFailed, setImgFailed] = useState(false);
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

  const posterSrc = toDisplayImageUrl(item.posterPath);
  const hasImage = Boolean(posterSrc) && !imgFailed;

  return (
    <div
      className={`wh-item${isPlaying ? ' wh-item--playing' : ''}`}
      onClick={handleClick}
    >
      {hasImage ? (
        <img
          className="wh-poster"
          src={posterSrc!}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
        />
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

const HISTORY_TABS: PillTab<'all' | 'in-progress' | 'completed'>[] = [
  { id: 'all', label: 'All Activity' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
];

const VIEW_MODE_TABS: PillTab<'grid' | 'list'>[] = [
  { id: 'grid', icon: <Grid3x3 size={17} />, tooltip: 'Grid view', ariaLabel: 'Grid view' },
  { id: 'list', icon: <List size={17} />, tooltip: 'List view', ariaLabel: 'List view' },
];

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
        <div className="wh-header-clean">
          <div className="wh-header-title">
            <div className="wh-header-icon">
              <History size={26} />
            </div>
            <div className="wh-header-text">
              <span className="playlist-browse-kicker">Activity</span>
              <h1>Watch History</h1>
              <p>Keep track of your viewing progress and jump right back in where you left off.</p>
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

        <div className="wh-controls-bar">
          <PillTabs
            tabs={HISTORY_TABS}
            value={filter}
            onChange={setFilter}
          />
          <PillTabs
            size="small"
            tabs={VIEW_MODE_TABS}
            value={viewMode}
            onChange={setViewMode}
            ariaLabel="View mode"
          />
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
