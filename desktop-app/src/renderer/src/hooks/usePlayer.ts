import * as queries from '@renderer/queries';
/**
 * Custom hook for managing player lifecycle and media playback
 */

import { useEffect, useRef, useState } from 'react';
import Artplayer from 'artplayer';
import type { PlayMediaResult } from '@shared/ipc';
import type { ExtendedHTMLVideoElement } from '../utils/player/types';
import {
  createAudioTrackSetting,
  createSubtitleSetting,
  getBasePlayerConfig,
  AudioContextManager
} from '../utils/player/playerConfig';
import { updatePlayerSettings, ensureAudioOutputEnabled, ensureAudioTrackEnabled } from '../utils/player/trackManagement';
import {
  analyzePlaybackError,
  getPlaybackErrorMessage,
  logPlaybackError
} from '../utils/player/errorHandling';
import {
  initializeProgressTracking,
  shouldSaveProgress,
  shouldRestorePosition,
  getResumePosition,
  isPlaybackCompleted,
  SAVE_INTERVAL_MS
} from '../utils/player/progressTracking';

interface UsePlayerReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  artRef: React.RefObject<Artplayer | null>;
  playbackError: string | null;
}

const LOAD_TIMEOUT_MS = 8000;

/**
 * Custom hook for managing the Artplayer video player instance
 * Handles initialization, progress tracking, audio/video track management, and error handling
 */
export function usePlayer(
  player: PlayMediaResult | null,
  onOpenExternal: (mediaFileId: number) => void
): UsePlayerReturn {
  const containerRef = useRef<HTMLDivElement>(null!);
  const artRef = useRef<Artplayer | null>(null);
  const audioContextManagerRef = useRef<AudioContextManager>(new AudioContextManager());
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const loadTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !player) {
      return;
    }

    setPlaybackError(null);

    // Initialize player with base configuration and settings
    const playerConfig = getBasePlayerConfig(container, player.mediaUrl);
    const art = new Artplayer({
      ...playerConfig,
      settings: [createAudioTrackSetting(artRef), createSubtitleSetting(artRef)],
      quality: []
    } as any);

    artRef.current = art;

    // Initialize progress tracking state
    const progressState = initializeProgressTracking();

    // Setup load timeout to detect codecs that can't be played
    loadTimerRef.current = setTimeout(() => {
      const video = art.video as ExtendedHTMLVideoElement;
      if (!video || video.readyState < HTMLMediaElement.HAVE_METADATA) {
        setPlaybackError('The built-in player did not load this file. HEVC/x265 videos may need the system player.');
      }
    }, LOAD_TIMEOUT_MS);

    // === Progress Update Logic ===
    const updateProgress = async (force = false) => {
      const video = art.video;
      if (!video || !Number.isFinite(video.duration) || video.duration <= 0 || !Number.isFinite(video.currentTime)) {
        return;
      }

      const positionSeconds = Math.floor(video.currentTime);

      if (!shouldSaveProgress(positionSeconds, progressState, force)) {
        return;
      }

      await queries.updateWatchProgress({
        mediaFileId: player.mediaFileId,
        positionSeconds,
        durationSeconds: Math.floor(video.duration),
        completed: isPlaybackCompleted(video.currentTime, video.duration)
      });

      progressState.lastSavedPosition = positionSeconds;
      progressState.lastSavedAt = Date.now();
    };

    // === Position Restore Logic ===
    const restorePosition = () => {
      if (progressState.restoredPosition) {
        return;
      }

      const video = art.video;
      const savedPosition = player.watchProgress?.positionSeconds ?? 0;
      const savedDuration = player.watchProgress?.durationSeconds ?? 0;
      const duration = Number.isFinite(video?.duration) && video.duration > 0 ? video.duration : savedDuration;

      progressState.restoredPosition = true;

      if (!shouldRestorePosition(player, duration)) {
        return;
      }

      if (video) {
        video.currentTime = getResumePosition(savedPosition, duration);
      }
    };

    // === Error Handling ===
    const handlePlaybackError = () => {
      const video = art.video as ExtendedHTMLVideoElement;
      logPlaybackError(video);

      const errorDetails = analyzePlaybackError(video);
      const errorMessage = getPlaybackErrorMessage(errorDetails);
      setPlaybackError(errorMessage);
    };

    // === Audio Context and Output Management ===
    const checkAudioOnPlay = () => {
      const video = art.video as ExtendedHTMLVideoElement;
      if (video && !video.muted && video.volume > 0) {
        audioContextManagerRef.current.resumeIfSuspended();
      }
    };

    const ensureAudioIsReady = () => {
      const video = art.video as ExtendedHTMLVideoElement;
      if (video) {
        ensureAudioOutputEnabled(video);
        ensureAudioTrackEnabled(video);
      }
    };

    // === Playback throttle — slow downloads while video is playing ===
    const enableThrottle  = () => void queries.torrentSetPlaybackThrottle(true).catch(() => {});
    const disableThrottle = () => void queries.torrentSetPlaybackThrottle(false).catch(() => {});

    // === Event Listeners ===
    art.on('video:pause',  () => { disableThrottle(); void updateProgress(true); });
    art.on('video:seeked', () => void updateProgress(true));
    art.on('video:timeupdate', () => void updateProgress());
    art.on('video:ended',  () => { disableThrottle(); void updateProgress(true); });
    art.on('video:error', handlePlaybackError);
    art.on('video:play', () => { enableThrottle(); checkAudioOnPlay(); });

    art.on('video:loadedmetadata', () => {
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current);
      }
      setPlaybackError(null);
      ensureAudioIsReady();
      updatePlayerSettings(art, art.video as ExtendedHTMLVideoElement);
      restorePosition();
    });

    art.on('video:canplay', () => {
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current);
      }
      setPlaybackError(null);
      restorePosition();
    });

    // === Cleanup ===
    return () => {
      disableThrottle();
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current);
      }
      void updateProgress(true);
      audioContextManagerRef.current.close();
      art.destroy(false);
      artRef.current = null;
      container.textContent = '';
    };
  }, [player]);

  // Cleanup on player unmount
  useEffect(() => {
    if (!player) {
      artRef.current?.destroy(false);
      artRef.current = null;
      setPlaybackError(null);
    }
  }, [player]);

  return {
    containerRef,
    artRef,
    playbackError
  };
}
