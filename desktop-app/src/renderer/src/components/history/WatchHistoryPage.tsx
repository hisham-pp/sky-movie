import { useState } from 'react';
import { Film, Tv, Clock, CheckCircle2, RotateCcw, Trash2, Play, History } from 'lucide-react';
import type { WatchHistoryItem } from '@shared/ipc';

interface Props {
  items: WatchHistoryItem[];
  loading: boolean;
  activeMediaFileId: number | null;
  onPlay(item: WatchHistoryItem): void;
  onClear(): void;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatPosition(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function PosterPlaceholder({ kind }: { kind: string }) {
  return (
    <div className="wh-poster wh-poster--empty">
      {kind === 'show' ? <Tv size={24} /> : <Film size={24} />}
    </div>
  );
}

export function WatchHistoryPage({ items, loading, activeMediaFileId, onPlay, onClear }: Props) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress'>('all');

  const filtered = items.filter((item) => {
    if (filter === 'completed') return item.completed;
    if (filter === 'in-progress') return !item.completed;
    return true;
  });

  const handleClear = () => {
    if (confirmClear) {
      onClear();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  };

  return (
    <div className="wh-page">
      {/* Header */}
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
              onBlur={() => setConfirmClear(false)}
              title="Clear watch history"
            >
              <Trash2 size={14} />
              {confirmClear ? 'Confirm clear?' : 'Clear History'}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
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
          {filtered.map((item) => {
            const progress = item.durationSeconds > 0
              ? Math.min(100, (item.positionSeconds / item.durationSeconds) * 100)
              : 0;
            const isPlaying = activeMediaFileId === item.mediaFileId;

            return (
              <div
                key={item.mediaFileId}
                className={`wh-item${isPlaying ? ' wh-item--playing' : ''}`}
                onClick={() => onPlay(item)}
              >
                {/* Poster */}
                {item.posterPath ? (
                  <img
                    className="wh-poster"
                    src={item.posterPath}
                    alt={item.title}
                    loading="lazy"
                  />
                ) : (
                  <PosterPlaceholder kind={item.mediaKind} />
                )}

                {/* Info */}
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

                    <span className="wh-date">{formatDate(item.lastWatchedAt)}</span>
                  </div>

                  {/* Progress bar */}
                  {!item.completed && item.durationSeconds > 0 && (
                    <div className="wh-progress-bar">
                      <div className="wh-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>

                {/* Play button */}
                <button
                  className="wh-play-btn"
                  onClick={(e) => { e.stopPropagation(); onPlay(item); }}
                  title={item.completed ? 'Play again' : 'Resume'}
                >
                  <Play size={16} fill="currentColor" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
