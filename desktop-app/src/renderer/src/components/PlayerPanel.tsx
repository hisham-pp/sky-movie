import { ExternalLink, HardDrive } from 'lucide-react';
import { useRef, useEffect, useState, useCallback } from 'react';
import type { PlayMediaResult } from '@shared/ipc';

const SKIP_SECONDS = 10;

export function PlayerPanel({
  player,
  onOpenExternal
}: {
  player: PlayMediaResult | null;
  onOpenExternal(mediaFileId: number): void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initGenRef = useRef(0); // incremented each time we switch videos
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const isHTTPStream = player?.mediaUrl?.startsWith('http://') || player?.mediaUrl?.startsWith('https://');

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const video = videoRef.current;
    if (!video || !player) return;

    // Don't hijack shortcuts when the user is typing in an input
    if (
      document.activeElement &&
      ['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement as HTMLElement).tagName)
    ) return;

    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
        break;

      case 'ArrowRight':
      case 'l':
        e.preventDefault();
        video.currentTime = Math.min(video.currentTime + SKIP_SECONDS, video.duration || Infinity);
        break;

      case 'ArrowLeft':
      case 'j':
        e.preventDefault();
        video.currentTime = Math.max(video.currentTime - SKIP_SECONDS, 0);
        break;

      case 'ArrowUp':
        e.preventDefault();
        video.volume = Math.min(video.volume + 0.1, 1);
        break;

      case 'ArrowDown':
        e.preventDefault();
        video.volume = Math.max(video.volume - 0.1, 0);
        break;

      case 'm':
      case 'M':
        e.preventDefault();
        video.muted = !video.muted;
        break;

      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;

      case 'Escape':
        // Browser handles Escape to exit fullscreen natively; nothing extra needed.
        break;

      default:
        break;
    }
  }, [player]);

  function toggleFullscreen() {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      container.requestFullscreen().catch(() => {});
    }
  }

  useEffect(() => {
    // Use capture phase so our handler fires before the native <video controls>
    // handler. This lets e.preventDefault() suppress the built-in Space/arrow
    // behaviour and avoids the double-toggle that happens when the video element
    // has focus.
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  // ── Video source initialisation ───────────────────────────────────────────
  useEffect(() => {
    if (!player || !videoRef.current) {
      console.log('[Player] No player or videoRef, skipping init', { hasPlayer: !!player, hasRef: !!videoRef.current });
      return;
    }

    setPlaybackError(null);
    const video = videoRef.current;

    console.log('[Player] Initializing playback', {
      mediaFileId: player.mediaFileId,
      mediaUrl: player.mediaUrl,
      isHTTPStream,
      hasWatchProgress: !!player.watchProgress,
      audioTracks: player.audioTracks?.length ?? 0
    });

    const onLoadStart = () => console.log('[Player] loadstart — browser began loading', video.src);
    const onLoadedMetadata = () => console.log('[Player] loadedmetadata — duration:', video.duration, 'readyState:', video.readyState);
    const onCanPlayThrough = () => console.log('[Player] canplaythrough');
    const onWaiting = () => console.log('[Player] waiting — buffering…');
    const onStalled = () => console.log('[Player] stalled');
    const onSuspend = () => console.log('[Player] suspend');

    video.addEventListener('loadstart', onLoadStart);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('canplaythrough', onCanPlayThrough);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('stalled', onStalled);
    video.addEventListener('suspend', onSuspend);

    // Increment generation so any in-flight callbacks from the previous video
    // know they are stale and must not touch the element.
    const gen = ++initGenRef.current;

    // Mute and stop BEFORE clearing src so there is no audio gap between
    // the old stream stopping and the new one starting.
    video.muted = true;
    video.pause();
    video.src = '';
    video.load();

    // Handlers added inside initialize() must also be cleaned up; keep refs
    // to them so the effect cleanup can remove them if they haven't fired yet.
    let onMeta: (() => void) | null = null;
    let onCanPlay: (() => void) | null = null;

    const initialize = () => {
      if (gen !== initGenRef.current) return; // stale — a newer video was selected
      try {
        console.log('[Player] Setting src:', player.mediaUrl);
        video.src = player.mediaUrl;
        video.load();
        console.log('[Player] video.load() called, readyState:', video.readyState, 'networkState:', video.networkState);

        // Restore watch progress once metadata is known
        onMeta = () => {
          if (gen !== initGenRef.current) return;
          if (player.watchProgress) {
            const savedPosition = player.watchProgress.positionSeconds;
            console.log('[Player] Watch progress found:', { savedPosition, duration: player.watchProgress.durationSeconds, completed: player.watchProgress.completed });
            if (
              savedPosition >= 5 &&
              player.watchProgress.durationSeconds - savedPosition >= 10 &&
              !player.watchProgress.completed
            ) {
              video.currentTime = savedPosition;
              console.log('[Player] Restored position to:', savedPosition);
            }
          }
          onMeta = null;
        };
        video.addEventListener('loadedmetadata', onMeta, { once: true });

        onCanPlay = () => {
          if (gen !== initGenRef.current) return;
          console.log('[Player] canplay fired — volume:', video.volume, 'muted:', video.muted);
          video.muted = false;
          video.volume = 1.0;
          video.play().catch((err) => {
            console.warn('[Player] play() blocked, retrying muted:', err);
            video.muted = true;
            video.play()
              .then(() => {
                video.muted = false;
                console.log('[Player] unmuted after muted-play fallback');
              })
              .catch((e) => console.error('[Player] muted play also blocked:', e));
          });
          onCanPlay = null;
        };
        video.addEventListener('canplay', onCanPlay, { once: true });

      } catch (error) {
        console.error('[Player] Error initializing playback:', error);
        setPlaybackError('Failed to initialize playback');
      }
    };

    initialize();

    return () => {
      // Stop audio immediately so it doesn't bleed into the next video
      video.muted = true;
      video.pause();

      video.removeEventListener('loadstart', onLoadStart);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('canplaythrough', onCanPlayThrough);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('stalled', onStalled);
      video.removeEventListener('suspend', onSuspend);
      // Remove handlers that were added inside initialize() and may not have fired
      if (onMeta) video.removeEventListener('loadedmetadata', onMeta);
      if (onCanPlay) video.removeEventListener('canplay', onCanPlay);
    };
  }, [player]);

  const handleError = () => {
    const video = videoRef.current;
    if (!video?.error) return;

    const errorCode = video.error.code;
    const errorNames: Record<number, string> = {
      [MediaError.MEDIA_ERR_ABORTED]: 'MEDIA_ERR_ABORTED',
      [MediaError.MEDIA_ERR_NETWORK]: 'MEDIA_ERR_NETWORK',
      [MediaError.MEDIA_ERR_DECODE]: 'MEDIA_ERR_DECODE',
      [MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED]: 'MEDIA_ERR_SRC_NOT_SUPPORTED'
    };

    console.error('[Player] Video error:', {
      code: errorCode,
      codeName: errorNames[errorCode] ?? 'UNKNOWN',
      message: video.error.message,
      url: video.src,
      networkState: video.networkState,
      readyState: video.readyState,
      isHTTPStream
    });

    let message = 'Unable to play video. ';
    if (errorCode === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || errorCode === MediaError.MEDIA_ERR_DECODE) {
      message += isHTTPStream
        ? 'Stream codec not supported. Make sure FFmpeg is installed on your system.'
        : 'Codec may not be supported on this system. Try opening with system player.';
    } else if (errorCode === MediaError.MEDIA_ERR_NETWORK) {
      message += 'Network error loading video. Is the streaming server running?';
    } else if (errorCode === MediaError.MEDIA_ERR_ABORTED) {
      message += 'Video loading was aborted.';
    }

    setPlaybackError(message);
  };

  const handleTimeUpdate = async () => {
    const video = videoRef.current;
    if (!video || !player || !Number.isFinite(video.currentTime) || !Number.isFinite(video.duration)) {
      return;
    }

    const now = Date.now();
    const lastSaved = parseInt(video.dataset.lastSaved || '0');
    if (now - lastSaved < 10000) return;

    const positionSeconds = Math.floor(video.currentTime);
    const durationSeconds = Math.floor(video.duration);
    const completed = durationSeconds > 0 && video.currentTime / durationSeconds > 0.92;

    await window.skyMovie.updateWatchProgress({
      mediaFileId: player.mediaFileId,
      positionSeconds,
      durationSeconds,
      completed
    });

    video.dataset.lastSaved = now.toString();
  };

  const handleEnded = async () => {
    const video = videoRef.current;
    if (!video || !player) return;

    await window.skyMovie.updateWatchProgress({
      mediaFileId: player.mediaFileId,
      positionSeconds: Math.floor(video.currentTime),
      durationSeconds: Math.floor(video.duration),
      completed: true
    });
  };

  if (!player) {
    return (
      <div className="player">
        <div className="player-empty">
          <HardDrive size={26} />
        </div>
      </div>
    );
  }

  return (
    <div className="player">
      <div
        ref={containerRef}
        className="player-container"
        style={{ width: '100%', height: '100%', background: '#000' }}
      >
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          onError={handleError}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onPause={handleTimeUpdate}
          style={{ display: 'block' }}
        />
      </div>

      {player.audioTracks && player.audioTracks.length > 1 ? (
        <div className="player-tracks-panel" style={{ padding: '12px', background: '#1a1a1a', borderTop: '1px solid #333' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {player.audioTracks.length} audio tracks available (switching via system player)
          </div>
        </div>
      ) : null}

      <button className="player-external-button" onClick={() => onOpenExternal(player.mediaFileId)}>
        <ExternalLink size={15} />
        Open in system player
      </button>
      {playbackError ? (
        <div className="player-error">
          <span>{playbackError}</span>
          <button onClick={() => onOpenExternal(player.mediaFileId)}>Open externally</button>
        </div>
      ) : null}
    </div>
  );
}
