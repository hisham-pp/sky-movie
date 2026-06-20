import { ExternalLink, HardDrive } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Artplayer from 'artplayer';
import type { PlayMediaResult } from '@shared/ipc';

const resumeStartThresholdSeconds = 5;
const resumeEndBufferSeconds = 10;
const saveIntervalMs = 10000;

export function PlayerPanel({
  player,
  onOpenExternal
}: {
  player: PlayMediaResult | null;
  onOpenExternal(mediaFileId: number): void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const artRef = useRef<Artplayer | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !player) {
      return;
    }

    setPlaybackError(null);
    const art = new Artplayer({
      container,
      url: player.mediaUrl,
      theme: '#89ceff',
      volume: 0.8,
      autoplay: true,
      pip: true,
      mutex: true,
      hotkey: true,
      setting: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      miniProgressBar: true,
      moreVideoAttr: {
        preload: 'metadata',
        playsInline: true
      }
    });
    artRef.current = art;
    let restoredPosition = false;
    let lastSavedPosition = -1;
    let lastSavedAt = 0;

    const loadTimer = window.setTimeout(() => {
      const video = art.video;
      if (!video || video.readyState < HTMLMediaElement.HAVE_METADATA) {
        setPlaybackError('The built-in player did not load this file. HEVC/x265 videos usually need the system player.');
      }
    }, 5000);

    const updateProgress = async (force = false) => {
      const video = art.video;
      if (!video || !Number.isFinite(video.duration) || video.duration <= 0 || !Number.isFinite(video.currentTime)) {
        return;
      }

      const positionSeconds = Math.floor(video.currentTime);
      const now = Date.now();

      if (!force && (positionSeconds === lastSavedPosition || now - lastSavedAt < saveIntervalMs)) {
        return;
      }

      await window.skyMovie.updateWatchProgress({
        mediaFileId: player.mediaFileId,
        positionSeconds,
        durationSeconds: Math.floor(video.duration),
        completed: video.duration > 0 && video.currentTime / video.duration > 0.92
      });
      lastSavedPosition = positionSeconds;
      lastSavedAt = now;
    };

    const restorePosition = () => {
      if (restoredPosition) {
        return;
      }

      const video = art.video;
      const savedPosition = player.watchProgress?.positionSeconds ?? 0;
      const savedDuration = player.watchProgress?.durationSeconds ?? 0;
      const duration = Number.isFinite(video?.duration) && video.duration > 0 ? video.duration : savedDuration;

      restoredPosition = true;

      if (
        player.watchProgress?.completed ||
        savedPosition < resumeStartThresholdSeconds ||
        duration - savedPosition < resumeEndBufferSeconds
      ) {
        return;
      }

      if (video) {
        video.currentTime = Math.min(savedPosition, Math.max(duration - resumeEndBufferSeconds, 0));
      }
    };

    const handlePlaybackError = () => {
      setPlaybackError('The built-in player cannot decode this file. HEVC/x265 videos usually need the system player.');
    };

    art.on('video:pause', () => void updateProgress(true));
    art.on('video:seeked', () => void updateProgress(true));
    art.on('video:timeupdate', () => void updateProgress());
    art.on('video:ended', () => void updateProgress(true));
    art.on('video:error', handlePlaybackError);
    art.on('video:loadedmetadata', () => {
      window.clearTimeout(loadTimer);
      setPlaybackError(null);
      restorePosition();
    });
    art.on('video:canplay', () => {
      window.clearTimeout(loadTimer);
      setPlaybackError(null);
      restorePosition();
    });

    return () => {
      window.clearTimeout(loadTimer);
      void updateProgress(true);
      art.destroy(false);
      artRef.current = null;
      container.textContent = '';
    };
  }, [player]);

  useEffect(() => {
    if (!player) {
      artRef.current?.destroy(false);
      artRef.current = null;
      setPlaybackError(null);
    }
  }, [player]);

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
      <div key={player.mediaUrl} ref={containerRef} className="artplayer-host" />
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
