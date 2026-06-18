import { HardDrive } from 'lucide-react';
import { useRef } from 'react';
import type { PlayMediaResult } from '@shared/ipc';

export function PlayerPanel({ player }: { player: PlayMediaResult | null }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  async function updateProgress() {
    const video = videoRef.current;
    if (!video || !player || !Number.isFinite(video.duration)) {
      return;
    }

    await window.skyMovie.updateWatchProgress({
      mediaFileId: player.mediaFileId,
      positionSeconds: Math.floor(video.currentTime),
      durationSeconds: Math.floor(video.duration),
      completed: video.duration > 0 && video.currentTime / video.duration > 0.92
    });
  }

  return (
    <div className="player">
      {player ? (
        <video
          ref={videoRef}
          key={player.mediaUrl}
          src={player.mediaUrl}
          controls
          onPause={updateProgress}
          onEnded={updateProgress}
        />
      ) : (
        <div className="player-empty">
          <HardDrive size={26} />
        </div>
      )}
    </div>
  );
}
