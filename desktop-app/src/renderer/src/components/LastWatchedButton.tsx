import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import type { LastWatchedInfo } from '@shared/ipc';
import { formatPosition } from '../utils/dateUtils';

interface LastWatchedButtonProps {
  onPlay: (info: LastWatchedInfo) => void;
  /** Pass the current player mediaFileId so the button refreshes when playback ends */
  activeMediaFileId: number | null;
}

export const LastWatchedButton = memo(function LastWatchedButton({ onPlay, activeMediaFileId }: LastWatchedButtonProps) {
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

  useEffect(() => {
    refresh();
  }, [activeMediaFileId, refresh]);

  useEffect(() => {
    const handler = (e: Event) => {
      const lastWatched = (e as CustomEvent<LastWatchedInfo>).detail;
      onPlay(lastWatched);
    };
    window.addEventListener('sky-movie:play-last-watched', handler);
    return () => window.removeEventListener('sky-movie:play-last-watched', handler);
  }, [onPlay]);

  const handlePlay = useCallback(() => {
    if (!info) return;
    setDismissed(true);
    onPlay(info);
  }, [info, onPlay]);

  const handleDismiss = useCallback(() => setDismissed(true), []);
  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  const progress = useMemo(
    () => (info && info.durationSeconds > 0 ? (info.positionSeconds / info.durationSeconds) * 100 : 0),
    [info],
  );

  // Don't show if no history, dismissed, or currently playing the same file
  if (!info || dismissed || activeMediaFileId === info.mediaFileId) return null;

  const resumeLabel = info.completed ? 'Play Again' : `Resume at ${formatPosition(info.positionSeconds)}`;

  return (
    <div
      className="last-watched-fab"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="last-watched-dismiss" onClick={handleDismiss} title="Dismiss">
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
});
