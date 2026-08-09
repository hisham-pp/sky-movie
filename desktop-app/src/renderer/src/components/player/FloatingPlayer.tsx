import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2, Volume2, VolumeX, Play, Pause } from 'lucide-react';
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const playerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStartPos.current.x;
    const newY = e.clientY - dragStartPos.current.y;
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

  const handleToggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    // TODO: Implement actual mute functionality with player API
  }, []);

  const handleTogglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
    // TODO: Implement actual play/pause with player API
  }, []);

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
      className={`floating-player${isMinimized ? ' floating-player-minimized' : ''}${isDragging ? ' floating-player-dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        bottom: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="floating-player-header">
        <div className="floating-player-title">
          <strong>{displayTitle}</strong>
          {displaySubtitle && <span>{displaySubtitle}</span>}
        </div>
        <div className="floating-player-controls">
          <Tooltip content={isMinimized ? 'Expand' : 'Minimize'}>
            <button
              className="floating-player-control-btn"
              onClick={handleToggleMinimize}
              aria-label={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </button>
          </Tooltip>
          {onExpand && (
            <Tooltip content="Go to detail page">
              <button
                className="floating-player-control-btn"
                onClick={onExpand}
                aria-label="Expand to full view"
              >
                <Maximize2 size={14} />
              </button>
            </Tooltip>
          )}
          <Tooltip content="Close">
            <button
              className="floating-player-control-btn floating-player-close-btn"
              onClick={onClose}
              aria-label="Close player"
            >
              <X size={14} />
            </button>
          </Tooltip>
        </div>
      </div>

      {!isMinimized && (
        <div className="floating-player-content">
          <div className="floating-player-video">
            {/* TODO: Integrate actual video player */}
            <div className="floating-player-placeholder">
              <Play size={32} />
            </div>
          </div>
          <div className="floating-player-actions">
            <Tooltip content={isPlaying ? 'Pause' : 'Play'}>
              <button
                className="floating-player-action-btn"
                onClick={handleTogglePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
            </Tooltip>
            <Tooltip content={isMuted ? 'Unmute' : 'Mute'}>
              <button
                className="floating-player-action-btn"
                onClick={handleToggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
});
