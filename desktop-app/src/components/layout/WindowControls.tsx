'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import { PillButton, PillButtonGroup } from '../common';
import {
  windowMinimize,
  windowMaximize,
  windowClose,
  windowIsMaximized,
  onWindowMaximizeChange,
} from '@/queries';

export interface WindowControlsProps {
  className?: string;
}

/**
 * Segmented window controls (Minimize, Maximize / Restore, and Close)
 * Matching the exact split-pill geometry, colors, hover, and interaction physics of NavControls.
 */
export const WindowControls = memo(function WindowControls({ className = '' }: WindowControlsProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Initial check
    windowIsMaximized().then(setIsMaximized).catch(() => {});

    // Listen for maximize / unmaximize events
    const cleanup = onWindowMaximizeChange((maximized) => {
      setIsMaximized(maximized);
    });

    return cleanup;
  }, []);

  const handleMinimize = useCallback(() => {
    windowMinimize().catch(() => {});
  }, []);

  const handleMaximize = useCallback(async () => {
    await windowMaximize().catch(() => {});
    const max = await windowIsMaximized().catch(() => !isMaximized);
    setIsMaximized(max);
  }, [isMaximized]);

  const handleClose = useCallback(() => {
    windowClose().catch(() => {});
  }, []);

  return (
    <PillButtonGroup className={`window-controls ${className}`.trim()} aria-label="Window controls">
      <PillButton
        position="first"
        onClick={handleMinimize}
        tooltip="Minimize"
        aria-label="Minimize window"
        className="window-control window-control--minimize"
        icon={
          <svg width="10" height="1" viewBox="0 0 10 1">
            <rect width="10" height="1" fill="currentColor" />
          </svg>
        }
      />

      <PillButton
        position="middle"
        onClick={handleMaximize}
        tooltip={isMaximized ? 'Restore Down' : 'Maximize'}
        aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
        className={`window-control ${isMaximized ? 'window-control--restore' : 'window-control--maximize'}`}
        icon={
          isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2.5 2.5V0.5H9.5V7.5H7.5" stroke="currentColor" strokeWidth="1" />
              <rect x="0.5" y="2.5" width="7" height="7" stroke="currentColor" strokeWidth="1" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeWidth="1" />
            </svg>
          )
        }
      />

      <PillButton
        position="last"
        variant="danger"
        onClick={handleClose}
        tooltip="Close"
        aria-label="Close window"
        className="window-control window-control--close"
        icon={
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line x1="0.5" y1="0.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="9.5" y1="0.5" x2="0.5" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        }
      />
    </PillButtonGroup>
  );
});
