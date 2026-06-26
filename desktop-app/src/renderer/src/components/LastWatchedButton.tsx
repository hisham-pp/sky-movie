import { useEffect, useState, useCallback } from 'react';
import type { LastWatchedInfo } from '@shared/ipc';

interface LastWatchedButtonProps {
  onPlay: (mediaFileId: number) => void;
  /** Pass the current player mediaFileId so the button refreshes when playback ends */
  activeMediaFileId: number | null;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LastWatchedButton({ onPlay, activeMediaFileId }: LastWatchedButtonProps) {
  const [info, setInfo] = useState<LastWatchedInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const result = await window.skyMovie.getLastWatched();
      setInfo(result);
      setDismissed(false);
    } catch {
      // silently ignore
    }
  }, []);

  // Refresh on mount and whenever the active player changes (e.g. after playback starts/stops)
  useEffect(() => {
    refresh();
  }, [activeMediaFileId, refresh]);

  // Handle Ctrl+L keyboard shortcut trigger
  useEffect(() => {
    const handler = (e: Event) => {
      const mediaFileId = (e as CustomEvent<number>).detail;
      onPlay(mediaFileId);
    };
    window.addEventListener('sky-movie:play-last-watched', handler);
    return () => window.removeEventListener('sky-movie:play-last-watched', handler);
  }, [onPlay]);

  const handlePlay = () => {
    if (!info) return;
    setDismissed(true);
    onPlay(info.mediaFileId);
  };

  // Don't show if no history, dismissed, or currently playing the same file
  if (!info || dismissed || activeMediaFileId === info.mediaFileId) return null;

  const progress = info.durationSeconds > 0 ? (info.positionSeconds / info.durationSeconds) * 100 : 0;
  const resumeLabel = info.completed ? 'Play Again' : `Resume at ${formatTime(info.positionSeconds)}`;

  return (
    <div
      className="last-watched-fab"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button className="last-watched-dismiss" onClick={() => setDismissed(true)} title="Dismiss">
        ×
      </button>

      <button className="last-watched-body" onClick={handlePlay} title={`${resumeLabel} — ${info.title}`}>
        <div className="last-watched-icon">▶</div>
        <div className="last-watched-text">
          <span className="last-watched-action">{resumeLabel}</span>
          <span className="last-watched-title">{info.title}</span>
          {!info.completed && (
            <div className="last-watched-bar">
              <div className="last-watched-fill" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </button>

      {hovered && (
        <div className="last-watched-hint">Ctrl + L</div>
      )}
    </div>
  );
}
