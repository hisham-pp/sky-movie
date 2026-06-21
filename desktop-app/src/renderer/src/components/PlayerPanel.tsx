import { ExternalLink, HardDrive, Languages, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Artplayer from 'artplayer';
import type { PlayMediaResult } from '@shared/ipc';
import type Option from 'artplayer/types/option';

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
      screenshot: true,
      flip: true,
      rotate: true,
      moreVideoAttr: {
        preload: 'metadata',
        playsInline: true,
        crossOrigin: 'anonymous'
      },
      settings: [
        {
          html: 'Audio Track',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
          selector: [
            {
              html: 'Default',
              value: 'default',
              default: true
            }
          ],
          onSelect: function (item: Option.SettingOption) {
            const video = art.video;
            const trackIndex = item.value === 'default' ? -1 : parseInt(item.value as string);
            
            if (video.audioTracks) {
              for (let i = 0; i < video.audioTracks.length; i++) {
                (video.audioTracks[i] as any).enabled = i === trackIndex;
              }
            }
            return item.html;
          }
        },
        {
          html: 'Subtitle',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M17 3H7a2 2 0 0 0-2 2v3h14V5a2 2 0 0 0-2-2Z"/><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M9 16h6"/></svg>',
          selector: [
            {
              html: 'Off',
              value: 'off',
              default: true
            }
          ],
          onSelect: function (item: Option.SettingOption) {
            const video = art.video;
            const trackIndex = item.value === 'off' ? -1 : parseInt(item.value as string);
            
            if (video.textTracks) {
              for (let i = 0; i < video.textTracks.length; i++) {
                video.textTracks[i].mode = i === trackIndex ? 'showing' : 'hidden';
              }
            }
            return item.html;
          }
        }
      ],
      quality: []
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
      
      // Populate audio tracks
      const video = art.video;
      if (video.audioTracks && video.audioTracks.length > 0) {
        const audioSettings = art.setting.find((s: any) => s.html === 'Audio Track');
        if (audioSettings) {
          audioSettings.selector = [
            { html: 'Default', value: 'default', default: true },
            ...Array.from(video.audioTracks).map((track: any, index) => ({
              html: track.label || `Audio Track ${index + 1}`,
              value: index.toString()
            }))
          ];
          art.setting.update(audioSettings);
        }
      }
      
      // Populate subtitle tracks
      if (video.textTracks && video.textTracks.length > 0) {
        const subtitleSettings = art.setting.find((s: any) => s.html === 'Subtitle');
        if (subtitleSettings) {
          subtitleSettings.selector = [
            { html: 'Off', value: 'off', default: true },
            ...Array.from(video.textTracks)
              .filter((track: TextTrack) => track.kind === 'subtitles' || track.kind === 'captions')
              .map((track: TextTrack, index) => ({
                html: track.label || `Subtitle ${index + 1}`,
                value: index.toString()
              }))
          ];
          art.setting.update(subtitleSettings);
        }
      }
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
