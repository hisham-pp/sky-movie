import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { X, Maximize2 } from 'lucide-react';
import type { PlayMediaResult } from '@shared/ipc';
import { Tooltip } from '../common';
import { MpvPlayer } from './MpvPlayer';
import { useLibraryControllerContext } from '../../hooks/LibraryControllerContext';

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
  const { settings } = useLibraryControllerContext();
  const playerStyle = settings?.playerStyle ?? 'default';
  const resumePlayback = settings?.resumePlayback ?? true;
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

  const handleFullscreen = useCallback(() => {
    const videoContainer = playerRef.current;
    if (!videoContainer) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      videoContainer.requestFullscreen().catch(() => {});
    }
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'escape':
          e.preventDefault();
          onClose();
          break;
        case 'f':
          e.preventDefault();
          handleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleFullscreen]);

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
        <Tooltip content="Close (Esc)">
          <button
            className="floating-player-control-btn floating-player-close-btn"
            onClick={onClose}
            aria-label="Close player"
          >
            <X size={16} />
          </button>
        </Tooltip>
        <Tooltip content="Fullscreen (F)">
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
        <MpvPlayer 
          player={player} 
          playerStyle={playerStyle} 
          resumePlayback={resumePlayback}
          onEnded={onClose}
        />
      </div>
    </div>
  );
});
