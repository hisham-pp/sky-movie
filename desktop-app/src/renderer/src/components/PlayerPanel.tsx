import { ExternalLink, HardDrive, Languages, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Artplayer from 'artplayer';
import type { PlayMediaResult } from '@shared/ipc';

// Extend HTMLVideoElement to include audioTracks
interface ExtendedHTMLVideoElement extends HTMLVideoElement {
  audioTracks?: AudioTrackList;
}

interface AudioTrack {
  enabled: boolean;
  label: string;
}

interface AudioTrackList extends Array<AudioTrack> {
  length: number;
}

// Type for Artplayer setting options
interface SettingOption {
  html: string;
  value: string;
  default?: boolean;
}

interface Setting {
  html: string;
  icon: string;
  selector: SettingOption[];
  onSelect?: (item: SettingOption) => string;
}

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
  const audioContextRef = useRef<AudioContext | null>(null);
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
      volume: 1.0,
      autoplay: false,
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
      // @ts-ignore - rotate is valid but not in type definitions
      rotate: true,
      moreVideoAttr: {
        preload: 'auto',
        playsInline: true,
        crossOrigin: 'anonymous',
        'webkit-playsinline': 'true',
        'x5-playsinline': 'true',
        controls: false
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
          onSelect: function (item: SettingOption) {
            const video = art.video as ExtendedHTMLVideoElement;
            const trackIndex = item.value === 'default' ? -1 : parseInt(item.value);
            
            if (video.audioTracks) {
              for (let i = 0; i < video.audioTracks.length; i++) {
                video.audioTracks[i].enabled = i === trackIndex;
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
          onSelect: function (item: SettingOption) {
            const video = art.video;
            const trackIndex = item.value === 'off' ? -1 : parseInt(item.value);
            
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
    } as any);
    artRef.current = art;
    let restoredPosition = false;
    let lastSavedPosition = -1;
    let lastSavedAt = 0;

    const loadTimer = window.setTimeout(() => {
      const video = art.video;
      if (!video || video.readyState < HTMLMediaElement.HAVE_METADATA) {
        setPlaybackError('The built-in player did not load this file. HEVC/x265 videos may need the system player.');
      }
    }, 8000);

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
      const video = art.video;
      const error = video?.error;
      let errorMsg = 'The built-in player cannot decode this file. ';
      
      if (error) {
        if (error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || error.code === MediaError.MEDIA_ERR_DECODE) {
          errorMsg += 'Video codec (HEVC/x265) or audio codec (AC3/DTS/EAC3/TrueHD/AAC-HE) may not be supported. ';
        }
      }
      errorMsg += 'Try the system player.';
      setPlaybackError(errorMsg);
    };

    // Additional handler to check for silent audio
    const checkAudioOnPlay = () => {
      const video = art.video as ExtendedHTMLVideoElement;
      if (video && !video.muted && video.volume > 0) {
        // If video is playing but audio context is suspended, try to resume it
        // This can happen in Chromium-based browsers due to autoplay policies
        try {
          if (!audioContextRef.current && ((window as any).AudioContext || (window as any).webkitAudioContext)) {
            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
          }
          if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().catch(() => {
              // Ignore errors - this is a best-effort attempt
            });
          }
        } catch (e) {
          // Ignore errors creating audio context
        }
      }
    };

    art.on('video:pause', () => void updateProgress(true));
    art.on('video:seeked', () => void updateProgress(true));
    art.on('video:timeupdate', () => void updateProgress());
    art.on('video:ended', () => void updateProgress(true));
    art.on('video:error', handlePlaybackError);
    art.on('video:play', checkAudioOnPlay);
    art.on('video:loadedmetadata', () => {
      window.clearTimeout(loadTimer);
      setPlaybackError(null);
      restorePosition();
      
      // Ensure audio is enabled and unmuted
      const video = art.video as ExtendedHTMLVideoElement;
      if (video) {
        video.muted = false;
        if (video.volume === 0) {
          video.volume = 1.0;
        }
        
        // Force enable first audio track if audioTracks API is supported
        if (video.audioTracks && video.audioTracks.length > 0) {
          let hasEnabledTrack = false;
          for (let i = 0; i < video.audioTracks.length; i++) {
            if (video.audioTracks[i].enabled) {
              hasEnabledTrack = true;
              break;
            }
          }
          // If no track is enabled, enable the first one
          if (!hasEnabledTrack && video.audioTracks.length > 0) {
            video.audioTracks[0].enabled = true;
          }
        }
      }
      
      // Populate audio tracks
      if (video.audioTracks && video.audioTracks.length > 0) {
        const audioSettings = (art.setting as any).find((s: Setting) => s.html === 'Audio Track');
        if (audioSettings) {
          audioSettings.selector = [
            { html: 'Default', value: 'default', default: true },
            ...Array.from(video.audioTracks).map((track: any, index) => ({
              html: track.label || `Audio Track ${index + 1}`,
              value: index.toString()
            }))
          ];
          (art.setting as any).update(audioSettings);
        }
      }
      
      // Populate subtitle tracks
      if (video.textTracks && video.textTracks.length > 0) {
        const subtitleSettings = (art.setting as any).find((s: Setting) => s.html === 'Subtitle');
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
          (art.setting as any).update(subtitleSettings);
        }
      }
    });
    art.on('video:canplay', () => {
      window.clearTimeout(loadTimer);
      setPlaybackError(null);
      restorePosition();
      
      // Ensure audio is enabled on canplay
      const video = art.video as ExtendedHTMLVideoElement;
      if (video) {
        video.muted = false;
        if (video.volume === 0) {
          video.volume = 1.0;
        }
        
        // Double-check audio track is enabled
        if (video.audioTracks && video.audioTracks.length > 0) {
          let hasEnabledTrack = false;
          for (let i = 0; i < video.audioTracks.length; i++) {
            if (video.audioTracks[i].enabled) {
              hasEnabledTrack = true;
              break;
            }
          }
          if (!hasEnabledTrack) {
            video.audioTracks[0].enabled = true;
          }
        }
      }
    });

    return () => {
      window.clearTimeout(loadTimer);
      void updateProgress(true);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
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
