import * as queries from '@renderer/queries';
import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import type { LastWatchedInfo } from '@shared/ipc';
import { formatPosition } from '../../utils/dateUtils';
import { Tooltip } from '../common';

interface LastWatchedButtonProps {
  onPlay: (info: LastWatchedInfo) => void;
  /** Pass the current player mediaFileId so the button refreshes when playback ends */
  activeMediaFileId: number | null;
}

export const LastWatchedButton = memo(function LastWatchedButton({ onPlay, activeMediaFileId }: LastWatchedButtonProps) {
  const [info, setInfo] = useState<LastWatchedInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const result = await queries.getLastWatched();
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

  const progress = useMemo(
    () => (info && info.durationSeconds > 0 ? (info.positionSeconds / info.durationSeconds) * 100 : 0),
    [info],
  );

  // Don't show if no history, dismissed, or currently playing the same file
  if (!info || dismissed || activeMediaFileId === info.mediaFileId) return null;

  const resumeLabel = info.completed ? 'Play Again' : `Resume at ${formatPosition(info.positionSeconds)}`;
  const tooltipContent = (
    <>
      <div>{resumeLabel} — {info.title}</div>
      <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>Ctrl + L</div>
    </>
  );

  return (
    <div className="last-watched-fab">
      <button className="last-watched-dismiss" onClick={handleDismiss} title="Dismiss">
        ×
      </button>

      <Tooltip content={tooltipContent} placement="left">
        <button className="last-watched-body" onClick={handlePlay}>
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
      </Tooltip>
    </div>
  );
});
