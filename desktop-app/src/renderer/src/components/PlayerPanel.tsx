import { HardDrive } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Artplayer from 'artplayer';
import type { PlayMediaResult } from '@shared/ipc';

export function PlayerPanel({ player }: { player: PlayMediaResult | null }) {
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
      theme: '#0df2c9',
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

    const updateProgress = async () => {
      const video = art.video;
      if (!video || !Number.isFinite(video.duration)) {
        return;
      }

      await window.skyMovie.updateWatchProgress({
        mediaFileId: player.mediaFileId,
        positionSeconds: Math.floor(video.currentTime),
        durationSeconds: Math.floor(video.duration),
        completed: video.duration > 0 && video.currentTime / video.duration > 0.92
      });
    };

    const handlePlaybackError = () => {
      setPlaybackError('This file could not be played in the built-in player.');
    };

    art.on('video:pause', () => void updateProgress());
    art.on('video:ended', () => void updateProgress());
    art.on('video:error', handlePlaybackError);
    art.on('video:loadedmetadata', () => setPlaybackError(null));

    return () => {
      void updateProgress();
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
      {playbackError ? <div className="player-error">{playbackError}</div> : null}
    </div>
  );
}
