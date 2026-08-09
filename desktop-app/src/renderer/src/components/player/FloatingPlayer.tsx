import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { X, Maximize2, Play } from 'lucide-react';
import type { PlayMediaResult } from '@shared/ipc';
import { Tooltip } from '../common';

interface FloatingPlayerProps {
  player: PlayMediaResult | null;
  onClose: () => void;
  onExpand?: () => void;
}

export const FloatingPlayer = memo(function FloatingPlayer({
  player,
  onClose,
  onExpand
}: FloatingPlayerProps) {
  const [position, setPosition] = useState({ x: window.innerWidth - 520, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const playerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    const rect = playerRef.current?.getBoundingClientRect();
    if (rect) {
      dragStartPos.current = {
        x: e.clientX - rect.left,
        y: window.innerHeight - e.clientY - (window.innerHeight - rect.bottom)
      };
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStartPos.current.x;
    const newY = window.innerHeight - e.clientY - dragStartPos.current.y;
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleFullscreen = useCallback(() => {
    // TODO: Implement fullscreen functionality
    if (onExpand) {
      onExpand();
    }
  }, [onExpand]);

  // Early return AFTER all hooks have been called
  if (!player) return null;

  const displayTitle = player.metadata?.title ?? player.fileName?.split('.')[0] ?? 'Unknown';
  const displaySubtitle = player.metadata?.seasonNumber && player.metadata?.episodeNumber
    ? `S${player.metadata.seasonNumber}E${player.metadata.episodeNumber}`
    : player.metadata?.releaseYear
    ? `${player.metadata.releaseYear}`
    : null;

  return (
    <div
      ref={playerRef}
      className={`floating-player${isDragging ? ' floating-player-dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        bottom: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Top overlay controls */}
      <div className="floating-player-top-controls">
        <Tooltip content="Close">
          <button
            className="floating-player-control-btn floating-player-close-btn"
            onClick={onClose}
            aria-label="Close player"
          >
            <X size={16} />
          </button>
        </Tooltip>
        <Tooltip content="Fullscreen">
          <button
            className="floating-player-control-btn"
            onClick={handleFullscreen}
            aria-label="Fullscreen"
          >
            <Maximize2 size={16} />
          </button>
        </Tooltip>
      </div>

      {/* Video area */}
      <div className="floating-player-video">
        {/* TODO: Integrate actual video player */}
        <div className="floating-player-placeholder">
          <Play size={48} />
        </div>
      </div>
    </div>
  );
});
