'use client';

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

export const LastWatchedButton = memo(function LastWatchedButton({
  onPlay,
  activeMediaFileId
}: LastWatchedButtonProps) {
  const [info, setInfo] = useState<LastWatchedInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const result = await queries.getLastWatched();
      setInfo(result);
      setDismissed(false);
      setLeaving(false);
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
    setLeaving(true);
    setTimeout(() => {
      setDismissed(true);
      setLeaving(false);
      onPlay(info);
    }, 180);
  }, [info, onPlay]);

  const handleDismiss = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLeaving(true);
    setTimeout(() => {
      setDismissed(true);
      setLeaving(false);
    }, 220);
  }, []);

  const progress = useMemo(
    () => (info && info.durationSeconds > 0 ? (info.positionSeconds / info.durationSeconds) * 100 : 0),
    [info],
  );

  // Don't show if no history, dismissed, or currently playing the same file
  if (!info || dismissed || activeMediaFileId === info.mediaFileId) return null;

  const actionLabel = info.completed ? 'Play again' : 'Continue play';
  const actionText = info.completed
    ? 'Play again'
    : `Resume at ${formatPosition(info.positionSeconds)}`;

  const tooltipContent = (
    <div className="last-watched-tip">
      <div className="last-watched-tip-action">{actionText}</div>
      <div className="last-watched-tip-sub">
        <span className="last-watched-tip-title">{info.title}</span>
        <kbd className="last-watched-tip-kbd">Ctrl + L</kbd>
      </div>
    </div>
  );

  return (
    <div className={`last-watched-fab ${leaving ? 'leaving' : ''}`}>
      <div className="last-watched-halo" aria-hidden="true" />
      <div className="last-watched-toast">
        <Tooltip content={tooltipContent} placement="top">
          <button
            className="last-watched-main"
            onClick={handlePlay}
            type="button"
            aria-label={`${actionText} — ${info.title}`}
          >
            <span className="last-watched-play" aria-hidden="true">
              <svg className="tri" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" />
              </svg>
            </span>
            <span className="last-watched-copy">
              <span className="last-watched-label">{actionLabel}</span>
              <span className="last-watched-title">
                {info.title}
              </span>
              {!info.completed && (
                <div className="last-watched-bar">
                  <div className="last-watched-fill" style={{ width: `${progress}%` }} />
                </div>
              )}
            </span>
          </button>
        </Tooltip>

        <Tooltip content="Dismiss" placement="top">
          <button
            className="last-watched-close"
            onClick={handleDismiss}
            aria-label="Dismiss"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </Tooltip>
      </div>
    </div>
  );
});
