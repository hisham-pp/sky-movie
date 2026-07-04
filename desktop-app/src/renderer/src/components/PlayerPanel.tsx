import { ExternalLink, HardDrive } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Artplayer from 'artplayer';
import type { PlayMediaResult } from '@shared/ipc';
import { MpvPlayer } from './MpvPlayer';
import { useLibraryControllerContext } from '../hooks/LibraryControllerContext';

const RESUME_START_THRESHOLD = 5;
const RESUME_END_BUFFER = 10;
const SAVE_INTERVAL_MS = 10000;

export function PlayerPanel({
  player,
  onOpenExternal
}: {
  player: PlayMediaResult | null;
  onOpenExternal(mediaFileId: number): void;
}) {
  const { settings, playNextEpisode } = useLibraryControllerContext();
  const playerStyle = settings?.playerStyle ?? 'default';
  const [mpvAvailable, setMpvAvailable] = useState<boolean | null>(null);
  const handleEnded = () => { void playNextEpisode(); };

  useEffect(() => {
    window.skyMovie.mpvIsAvailable()
      .then(v => setMpvAvailable(v))
      .catch(() => setMpvAvailable(false));
  }, []);

  if (!player) {
    return (
      <div className="player">
        <div className="player-empty">
          <HardDrive size={26} />
        </div>
      </div>
    );
  }

  // Wait until we know which engine is available
  if (mpvAvailable === null) return null;

  if (mpvAvailable) {
    return (
      <div className="player">
        <MpvPlayer player={player} playerStyle={playerStyle} onOpenExternal={onOpenExternal} onEnded={handleEnded} />
        <button className="player-external-button" onClick={() => onOpenExternal(player.mediaFileId)}>
          <ExternalLink size={15} />
          Open in system player
        </button>
      </div>
    );
  }

  return <ArtplayerFallback player={player} onOpenExternal={onOpenExternal} onEnded={handleEnded} />;
}

// ── Artplayer fallback ───────────────────────────────────────────────────────

function ArtplayerFallback({
  player,
  onOpenExternal,
  onEnded
}: {
  player: PlayMediaResult;
  onOpenExternal(mediaFileId: number): void;
  onEnded?(): void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const artRef = useRef<Artplayer | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const mediaFileId = player?.mediaFileId ?? null;
  const mediaUrl = player?.mediaUrl ?? null;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !player || !mediaUrl) return;

    setPlaybackError(null);

    const sidecarList = player.sidecarSubtitles ?? [];

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
      flip: true,
      moreVideoAttr: {
        preload: 'auto',
        playsInline: true,
        crossOrigin: 'anonymous'
      },
      ...(sidecarList.length > 0 ? {
        subtitle: {
          url: sidecarList[0].url,
          type: sidecarList[0].type,
          encoding: 'utf-8',
          escape: false
        }
      } : {}),
      settings: [
        {
          html: 'Speed',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
          selector: [
            { html: '0.5×', value: '0.5' },
            { html: '0.75×', value: '0.75' },
            { html: '1×', value: '1', default: true },
            { html: '1.25×', value: '1.25' },
            { html: '1.5×', value: '1.5' },
            { html: '2×', value: '2' },
          ],
          onSelect(item: any) {
            art.playbackRate = parseFloat(item.value);
            return item.html;
          }
        },
        {
          html: 'Subtitles',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h4M15 15h2M7 11h2M13 11h4"/></svg>',
          selector: [
            { html: 'Off', value: 'off', default: sidecarList.length === 0 },
            ...sidecarList.map((s, i) => ({
              html: s.label,
              value: `sidecar:${i}`,
              default: i === 0 && sidecarList.length > 0
            }))
          ],
          onSelect(item: any) {
            if (item.value === 'off') {
              art.subtitle.show = false;
              return item.html;
            }
            if (item.value.startsWith('sidecar:')) {
              const idx = parseInt(item.value.split(':')[1]);
              const sub = sidecarList[idx];
              art.subtitle.url = sub.url;
              art.subtitle.show = true;
              return item.html;
            }
            return item.html;
          }
        }
      ]
    } as any);

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
      if (!video || !Number.isFinite(video.duration) || video.duration <= 0 || !Number.isFinite(video.currentTime)) return;
      const positionSeconds = Math.floor(video.currentTime);
      const now = Date.now();
      if (!force && (positionSeconds === lastSavedPosition || now - lastSavedAt < SAVE_INTERVAL_MS)) return;
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
      if (restoredPosition) return;
      const video = art.video;
      const savedPosition = player.watchProgress?.positionSeconds ?? 0;
      const savedDuration = player.watchProgress?.durationSeconds ?? 0;
      const duration = Number.isFinite(video?.duration) && video.duration > 0 ? video.duration : savedDuration;
      restoredPosition = true;
      if (player.watchProgress?.completed || savedPosition < RESUME_START_THRESHOLD || duration - savedPosition < RESUME_END_BUFFER) return;
      if (video) video.currentTime = Math.min(savedPosition, Math.max(duration - RESUME_END_BUFFER, 0));
    };

    const handleFullscreenKey = (e: KeyboardEvent) => {
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        e.stopImmediatePropagation();
        art.fullscreen = !art.fullscreen;
      }
    };
    document.addEventListener('keydown', handleFullscreenKey, true);

    art.on('video:pause', () => void updateProgress(true));
    art.on('video:seeked', () => void updateProgress(true));
    art.on('video:timeupdate', () => void updateProgress());
    art.on('video:ended', () => {
      void updateProgress(true);
      onEndedRef.current?.();
    });
    art.on('video:error', () => setPlaybackError('The built-in player cannot decode this file. Try opening with system player.'));
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
      document.removeEventListener('keydown', handleFullscreenKey, true);
      window.clearTimeout(loadTimer);
      void updateProgress(true);
      art.destroy(false);
      artRef.current = null;
      container.textContent = '';
    };
  }, [mediaFileId, mediaUrl]);

  useEffect(() => {
    if (!player) {
      artRef.current?.destroy(false);
      artRef.current = null;
      setPlaybackError(null);
    }
  }, [mediaFileId]);

  return (
    <div className="player">
      <div key={player.mediaFileId} ref={containerRef} className="artplayer-host" />
      <button className="player-external-button" onClick={() => onOpenExternal(player.mediaFileId)}>
        <ExternalLink size={15} />
        Open in system player
      </button>
      {playbackError && (
        <div className="player-error">
          <span>{playbackError}</span>
          <button onClick={() => onOpenExternal(player.mediaFileId)}>Open externally</button>
        </div>
      )}
    </div>
  );
}
