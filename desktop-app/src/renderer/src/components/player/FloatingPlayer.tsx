import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import type { PlayMediaResult } from '@shared/ipc';
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
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const playerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't drag in expanded mode or when clicking on player controls
    if (isExpanded) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.mpv-player')) return;

    setIsDragging(true);
    const rect = playerRef.current?.getBoundingClientRect();
    if (rect) {
      dragStartPos.current = {
        x: e.clientX - rect.left,
        y: window.innerHeight - e.clientY - (window.innerHeight - rect.bottom)
      };
    }
  }, [isExpanded]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStartPos.current.x;
    const newY = window.innerHeight - e.clientY - dragStartPos.current.y;
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    // Request fullscreen on the player container
    const container = playerRef.current;
    if (container) {
      container.requestFullscreen().catch(() => {});
    }
  }, []);

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
    // Exit fullscreen if in fullscreen mode
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
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

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isExpanded]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape' && !isExpanded) {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isExpanded]);

  if (!player) return null;

  return (
    <div
      ref={playerRef}
      className={`floating-player${isDragging ? ' floating-player-dragging' : ''}${isExpanded ? ' floating-player-expanded' : ''}`}
      style={!isExpanded ? {
        left: `${position.x}px`,
        bottom: `${position.y}px`,
      } : undefined}
      onMouseDown={handleMouseDown}
    >
      {/* MpvPlayer with skin - skin will render expand/close buttons when isFloating=true */}
      <MpvPlayer 
        player={player} 
        playerStyle={playerStyle} 
        resumePlayback={resumePlayback}
        isFloating={!isExpanded}
        onEnded={onClose}
        onFloatingExpand={handleExpand}
        onFloatingClose={onClose}
      />
    </div>
  );
});
