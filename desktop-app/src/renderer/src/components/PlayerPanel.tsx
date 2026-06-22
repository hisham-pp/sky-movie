import { ExternalLink, HardDrive, Volume2, Languages } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import type { PlayMediaResult, MediaTrack } from '@shared/ipc';

export function PlayerPanel({
  player,
  onOpenExternal
}: {
  player: PlayMediaResult | null;
  onOpenExternal(mediaFileId: number): void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<number>(-1);
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState<number>(-1);
  const isHTTPStream = player?.mediaUrl?.startsWith('http://') || player?.mediaUrl?.startsWith('https://');

  // Helper to build stream URL with track parameters
  const buildStreamUrl = (audioTrack: number = -1, subtitleTrack: number = -1): string => {
    if (!player?.mediaUrl) return '';

    if (!isHTTPStream) {
      // For non-HTTP URLs, just return the original
      return player.mediaUrl;
    }

    const url = new URL(player.mediaUrl);
    if (audioTrack >= 0) {
      url.searchParams.set('audio', String(audioTrack));
    }
    if (subtitleTrack >= 0) {
      url.searchParams.set('subtitle', String(subtitleTrack));
    }
    return url.toString();
  };

  useEffect(() => {
    if (!player || !videoRef.current) {
      return;
    }

    setPlaybackError(null);
    const video = videoRef.current;

    // Initialize playback
    const initialize = async () => {
      try {
        // Build URL with current track selection
        const streamUrl = buildStreamUrl(selectedAudioTrack, selectedSubtitleTrack);
        video.src = streamUrl;
        video.load();

        // Restore watch progress
        if (player.watchProgress) {
          const savedPosition = player.watchProgress.positionSeconds;
          if (
            savedPosition >= 5 &&
            player.watchProgress.durationSeconds - savedPosition >= 10 &&
            !player.watchProgress.completed
          ) {
            video.currentTime = savedPosition;
          }
        }
      } catch (error) {
        console.error('Error initializing playback:', error);
        setPlaybackError('Failed to initialize playback');
      }
    };

    initialize();
  }, [player, selectedAudioTrack, selectedSubtitleTrack, isHTTPStream]);

  const handleError = () => {
    const video = videoRef.current;
    if (!video?.error) return;

    const errorCode = video.error.code;
    let message = 'Unable to play video. ';

    if (errorCode === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || errorCode === MediaError.MEDIA_ERR_DECODE) {
      message += 'Codec may not be supported on this system. Try opening with system player.';
    } else if (errorCode === MediaError.MEDIA_ERR_NETWORK) {
      message += 'Network error loading video.';
    } else if (errorCode === MediaError.MEDIA_ERR_ABORTED) {
      message += 'Video loading was aborted.';
    }

    setPlaybackError(message);
    console.error('Video error:', { code: errorCode, message: video.error.message });
  };

  const handleTimeUpdate = async () => {
    const video = videoRef.current;
    if (!video || !player || !Number.isFinite(video.currentTime) || !Number.isFinite(video.duration)) {
      return;
    }

    // Save progress every 10 seconds
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
      <div className="player-container" style={{ width: '100%', height: '100%', background: '#000' }}>
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          crossOrigin="anonymous"
          onError={handleError}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onPause={handleTimeUpdate}
          style={{ display: 'block' }}
        />
      </div>

      {/* Track Selection UI */}
      {(player.audioTracks?.length ?? 0 > 1) || (player.subtitleTracks?.length ?? 0 > 0) ? (
        <div className="player-tracks-panel" style={{ padding: '12px', background: '#1a1a1a', borderTop: '1px solid #333' }}>
          {/* Audio Tracks */}
          {player.audioTracks && player.audioTracks.length > 1 && (
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={16} style={{ color: '#888' }} />
              <select
                value={selectedAudioTrack}
                onChange={(e) => setSelectedAudioTrack(Number(e.target.value))}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  background: '#2a2a2a',
                  color: '#fff',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                {player.audioTracks.map((track, idx) => (
                  <option key={idx} value={track.index}>
                    Audio: {track.title || track.language || `Track ${track.index + 1}`} ({track.codec})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subtitle Tracks */}
          {player.subtitleTracks && player.subtitleTracks.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Languages size={16} style={{ color: '#888' }} />
              <select
                value={selectedSubtitleTrack}
                onChange={(e) => setSelectedSubtitleTrack(Number(e.target.value))}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  background: '#2a2a2a',
                  color: '#fff',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                <option value={-1}>No Subtitles</option>
                {player.subtitleTracks.map((track, idx) => (
                  <option key={idx} value={track.index}>
                    {track.title || track.language || `Track ${track.index + 1}`} ({track.codec})
                  </option>
                ))}
              </select>
            </div>
          )}
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
