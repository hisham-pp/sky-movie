import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';
import type { MpvTrack, PlayerStyle } from '@shared/ipc';
import type { PlayMediaResult } from '@shared/ipc';
import { getSkin } from '../theme/player-skins';

// ── helpers ───────────────────────────────────────────────────────────────────

interface PlayerState {
  playing:   boolean;
  position:  number;
  duration:  number;
  volume:    number;
  muted:     boolean;
  speed:     number;
  buffering: boolean;
}

const DEFAULT_STATE: PlayerState = {
  playing:   false,
  position:  0,
  duration:  0,
  volume:    100,
  muted:     false,
  speed:     1,
  buffering: true
};

// ── component ─────────────────────────────────────────────────────────────────

export function MpvPlayer({
  player,
  playerStyle = 'default',
  onOpenExternal
}: {
  player: PlayMediaResult;
  playerStyle?: PlayerStyle;
  onOpenExternal(mediaFileId: number): void;
}) {
  const skin = getSkin(playerStyle);
  const { keyMap } = skin;

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef     = useRef<PlayerState>(DEFAULT_STATE);
  const drawingRef   = useRef(false);
  const hideTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seeking      = useRef(false);
  const clickTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickCount   = useRef(0);
  const rippleTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preMuteVolume   = useRef(DEFAULT_STATE.volume);
  const showControlsRef = useRef(true);
  const seekOsdTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state,        setState]     = useState<PlayerState>(DEFAULT_STATE);
  const [tracks,       setTracks]    = useState<MpvTrack[]>([]);
  const [showControls, setShowCtrl]  = useState(true);
  const [seekOsd,      setSeekOsd]   = useState(false);
  const [isFullscreen, setFullscr]   = useState(false);
  const [showMenu,     setShowMenu]  = useState<'settings' | null>(null);
  const [error,        setError]     = useState<string | null>(null);
  const [ripple,       setRipple]    = useState<'left' | 'right' | null>(null);

  const updateState = useCallback((patch: Partial<PlayerState>) => {
    stateRef.current = { ...stateRef.current, ...patch };
    setState(s => ({ ...s, ...patch }));
  }, []);

  // ── canvas draw loop ───────────────────────────────────────────────────────

  const drawFrame = useCallback((jpeg: Uint8Array) => {
    const canvas = canvasRef.current;
    if (!canvas || drawingRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (stateRef.current.buffering) {
      stateRef.current = { ...stateRef.current, buffering: false };
      setState(s => ({ ...s, buffering: false }));
    }

    drawingRef.current = true;
    const blob = new Blob([jpeg.buffer as ArrayBuffer], { type: 'image/jpeg' });
    createImageBitmap(blob).then(bitmap => {
      if (canvas.width  !== bitmap.width)  canvas.width  = bitmap.width;
      if (canvas.height !== bitmap.height) canvas.height = bitmap.height;
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      drawingRef.current = false;
    }).catch(() => { drawingRef.current = false; });
  }, []);

  // ── render size sync ───────────────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      const w = Math.round(width);
      const h = Math.round(height);
      if (w > 0 && h > 0) window.skyMovie.mpvSetRenderSize(w, h).catch(() => {});
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── mpv lifecycle ──────────────────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateState({ ...DEFAULT_STATE });
    setTracks([]);
    setError(null);

    const { width, height } = container.getBoundingClientRect();

    window.skyMovie.mpvOpen({
      filePath:     player.absolutePath ?? (player as any).mediaUrl,
      mediaFileId:  player.mediaFileId,
      renderWidth:  Math.round(width)  || 1280,
      renderHeight: Math.round(height) || 720
    }).catch(err => setError(String(err)));

    window.skyMovie.mpvSetVolume(stateRef.current.volume).catch(() => {});

    const savedPos = player.watchProgress?.positionSeconds ?? 0;
    const savedDur = player.watchProgress?.durationSeconds ?? 0;
    let posRestored = false;

    const unsubFrame  = window.skyMovie.onMpvFrame(drawFrame);
    const unsubEvent  = window.skyMovie.onMpvEvent(ev => {
      if (ev.type === 'property') {
        if (ev.name === 'time-pos'  && typeof ev.value === 'number') {
          if (!seeking.current) updateState({ position: ev.value });
        }
        if (ev.name === 'duration'  && typeof ev.value === 'number') updateState({ duration: ev.value });
        if (ev.name === 'pause'     && typeof ev.value === 'boolean') updateState({ playing: !ev.value });
        if (ev.name === 'volume'    && typeof ev.value === 'number') updateState({ volume: ev.value });
      }
      if (ev.type === 'file-loaded') {
        updateState({ buffering: false });
        if (!posRestored && savedPos > 5 && !player.watchProgress?.completed) {
          const dur = stateRef.current.duration || savedDur;
          if (dur - savedPos > 10) window.skyMovie.mpvSeek(savedPos).catch(() => {});
        }
        posRestored = true;
      }
    });
    const unsubTracks = window.skyMovie.onMpvTracks(setTracks);

    const progressTimer = setInterval(() => {
      const s = stateRef.current;
      if (s.duration > 0 && s.position > 0) {
        window.skyMovie.updateWatchProgress({
          mediaFileId:     player.mediaFileId,
          positionSeconds: Math.floor(s.position),
          durationSeconds: Math.floor(s.duration),
          completed:       s.position / s.duration > 0.92
        }).catch(() => {});
      }
    }, 10_000);

    return () => {
      clearInterval(progressTimer);
      unsubFrame();
      unsubEvent();
      unsubTracks();
      const s = stateRef.current;
      if (s.duration > 0 && s.position > 0) {
        window.skyMovie.updateWatchProgress({
          mediaFileId:     player.mediaFileId,
          positionSeconds: Math.floor(s.position),
          durationSeconds: Math.floor(s.duration),
          completed:       s.position / s.duration > 0.92
        }).catch(() => {});
      }
      window.skyMovie.mpvClose().catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.mediaFileId]);

  // ── keyboard shortcuts (driven by skin keyMap) ─────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const k = e.key;

      if (keyMap.togglePlay.includes(k)) {
        e.preventDefault(); resetHideTimer(); togglePlay();
      } else if (keyMap.seekBackLarge.includes(k)) {
        e.preventDefault();
        showControlsRef.current ? resetHideTimer() : triggerSeekOsd();
        window.skyMovie.mpvSeek(Math.max(0, stateRef.current.position - keyMap.seekBackLargeSeconds)).catch(() => {});
      } else if (keyMap.seekForwardLarge.includes(k)) {
        e.preventDefault();
        showControlsRef.current ? resetHideTimer() : triggerSeekOsd();
        window.skyMovie.mpvSeek(stateRef.current.position + keyMap.seekForwardLargeSeconds).catch(() => {});
      } else if (keyMap.seekBack.includes(k)) {
        e.preventDefault();
        showControlsRef.current ? resetHideTimer() : triggerSeekOsd();
        window.skyMovie.mpvSeek(Math.max(0, stateRef.current.position - keyMap.seekBackSeconds)).catch(() => {});
      } else if (keyMap.seekForward.includes(k)) {
        e.preventDefault();
        showControlsRef.current ? resetHideTimer() : triggerSeekOsd();
        window.skyMovie.mpvSeek(stateRef.current.position + keyMap.seekForwardSeconds).catch(() => {});
      } else if (keyMap.volumeUp.includes(k)) {
        e.preventDefault(); resetHideTimer();
        changeVolume(Math.min(skin.volumeMax + skin.volumeBoostMax, stateRef.current.volume + 5));
      } else if (keyMap.volumeDown.includes(k)) {
        e.preventDefault(); resetHideTimer();
        changeVolume(Math.max(0, stateRef.current.volume - 5));
      } else if (keyMap.toggleFullscreen.includes(k)) {
        e.preventDefault(); resetHideTimer(); toggleFullscreen();
      } else if (keyMap.toggleMute.includes(k)) {
        e.preventDefault(); resetHideTimer(); toggleMute();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyMap]);

  // ── fullscreen sync ────────────────────────────────────────────────────────

  useEffect(() => {
    const onChange = () => setFullscr(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // ── controls auto-hide ─────────────────────────────────────────────────────

  const resetHideTimer = useCallback(() => {
    showControlsRef.current = true;
    setShowCtrl(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { showControlsRef.current = false; setShowCtrl(false); }, 3000);
  }, []);

  const triggerSeekOsd = useCallback(() => {
    setSeekOsd(true);
    if (seekOsdTimer.current) clearTimeout(seekOsdTimer.current);
    seekOsdTimer.current = setTimeout(() => setSeekOsd(false), 1500);
  }, []);

  // ── actions ────────────────────────────────────────────────────────────────

  const togglePlay = () => {
    stateRef.current.playing
      ? window.skyMovie.mpvPause().catch(() => {})
      : window.skyMovie.mpvPlay().catch(() => {});
  };

  const toggleMute = () => {
    const muted = !stateRef.current.muted;
    if (muted) {
      preMuteVolume.current = stateRef.current.volume || skin.volumeMax;
      updateState({ muted });
      window.skyMovie.mpvSetVolume(0).catch(() => {});
    } else {
      const restoreVol = preMuteVolume.current || skin.volumeMax;
      updateState({ muted, volume: restoreVol });
      window.skyMovie.mpvSetVolume(restoreVol).catch(() => {});
    }
  };

  const changeVolume = (v: number) => {
    updateState({ volume: v, muted: v === 0 });
    window.skyMovie.mpvSetVolume(v).catch(() => {});
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    document.fullscreenElement
      ? document.exitFullscreen().catch(() => {})
      : el.requestFullscreen().catch(() => {});
  };

  const showRipple = (side: 'left' | 'right') => {
    setRipple(side);
    if (rippleTimer.current) clearTimeout(rippleTimer.current);
    rippleTimer.current = setTimeout(() => setRipple(null), 600);
  };

  // ── seek bar ───────────────────────────────────────────────────────────────

  const onSeekBarDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    seeking.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    doSeek(e);
  };
  const onSeekBarMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!seeking.current) return;
    doSeek(e);
  };
  const onSeekBarUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!seeking.current) return;
    seeking.current = false;
    doSeek(e);
    window.skyMovie.mpvSeek(stateRef.current.position).catch(() => {});
  };
  const doSeek = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    updateState({ position: pct * stateRef.current.duration });
  };

  // ── click / wheel on video area ────────────────────────────────────────────

  const onVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.default-controls')) return;
    resetHideTimer();
    clickCount.current += 1;
    if (clickCount.current === 1) {
      clickTimer.current = setTimeout(() => {
        if (clickCount.current === 1) togglePlay();
        clickCount.current = 0;
      }, 250);
    } else if (clickCount.current === 2) {
      if (clickTimer.current) clearTimeout(clickTimer.current);
      clickCount.current = 0;
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const isLeft = e.clientX - rect.left < rect.width / 2;
      if (isLeft) {
        window.skyMovie.mpvSeek(Math.max(0, stateRef.current.position - keyMap.seekBackLargeSeconds)).catch(() => {});
        showRipple('left');
      } else {
        window.skyMovie.mpvSeek(stateRef.current.position + keyMap.seekForwardLargeSeconds).catch(() => {});
        showRipple('right');
      }
    }
  };

  const onVideoWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.default-controls')) return;
    e.preventDefault();
    changeVolume(Math.min(skin.volumeMax + skin.volumeBoostMax, Math.max(0, stateRef.current.volume + (e.deltaY < 0 ? 5 : -5))));
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="mpv-player"
      onMouseMove={resetHideTimer}
      onPointerDown={() => setShowMenu(null)}
      onClick={onVideoClick}
      onWheel={onVideoWheel}
    >
      <canvas ref={canvasRef} className="mpv-canvas" />

      {/* Double-click skip ripples */}
      <div className={`mpv-ripple mpv-ripple-left${ripple === 'left' ? ' active' : ''}`}>
        <RotateCcw size={28} />
        <span>{keyMap.seekBackLargeSeconds} seconds</span>
      </div>
      <div className={`mpv-ripple mpv-ripple-right${ripple === 'right' ? ' active' : ''}`}>
        <RotateCw size={28} />
        <span>{keyMap.seekForwardLargeSeconds} seconds</span>
      </div>

      {/* Buffering spinner */}
      {state.buffering && (
        <div className="mpv-buffering">
          <div className="mpv-spinner" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mpv-error">
          <p>{error}</p>
          <button onClick={() => onOpenExternal(player.mediaFileId)}>Open in system player</button>
        </div>
      )}

      {/* Controls — rendered by the active skin */}
      {skin.renderControls({
        state,
        tracks: tracks as any,
        isVisible: showControls,
        seekOsdVisible: seekOsd && !showControls,
        isFullscreen,
        showMenu,
        sidecarSubtitles: player.sidecarSubtitles ?? [],
        onTogglePlay:     togglePlay,
        onToggleMute:     toggleMute,
        onChangeVolume:   changeVolume,
        onToggleFullscreen: toggleFullscreen,
        onSeekTo:         (s) => window.skyMovie.mpvSeek(s).catch(() => {}),
        onSetSpeed:       (s) => { updateState({ speed: s }); window.skyMovie.mpvSetSpeed(s).catch(() => {}); },
        onSetAudioTrack:  (id) => window.skyMovie.mpvSetAudioTrack(id).catch(() => {}),
        onSetSubTrack:    (id) => window.skyMovie.mpvSetSubTrack(id).catch(() => {}),
        onSetSubFile:     (path) => window.skyMovie.mpvSetSubFile(path).catch(() => {}),
        onSetShowMenu:    setShowMenu,
        onSeekBarDown,
        onSeekBarMove,
        onSeekBarUp
      })}
    </div>
  );
}
