import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from 'react';
import {
  Pause,
  Play,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  ChevronDown
} from 'lucide-react';
import type { MpvTrack } from '@shared/ipc';
import type { PlayMediaResult } from '@shared/ipc';

// ── helpers ──────────────────────────────────────────────────────────────────

function formatTime(secs: number): string {
  if (!Number.isFinite(secs) || secs < 0) return '0:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── types ────────────────────────────────────────────────────────────────────

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
  volume:    80,
  muted:     false,
  speed:     1,
  buffering: true
};

// ── component ─────────────────────────────────────────────────────────────────

export function MpvPlayer({
  player,
  onOpenExternal
}: {
  player: PlayMediaResult;
  onOpenExternal(mediaFileId: number): void;
}) {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const stateRef       = useRef<PlayerState>(DEFAULT_STATE);
  const drawingRef     = useRef(false);  // prevent overlapping draws

  const [state,      setState]      = useState<PlayerState>(DEFAULT_STATE);
  const [tracks,     setTracks]     = useState<MpvTrack[]>([]);
  const [showControls, setShowCtrl] = useState(true);
  const [isFullscreen, setFullscr]  = useState(false);
  const [showMenu,   setShowMenu]   = useState<'audio' | 'sub' | 'speed' | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seeking   = useRef(false);

  // Sync ref for use inside closures
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

    // Clear buffering spinner on the first frame we actually receive
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
      if (w > 0 && h > 0) {
        window.skyMovie.mpvSetRenderSize(w, h).catch(() => {});
      }
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
      filePath:      player.absolutePath ?? (player as any).mediaUrl,
      mediaFileId:   player.mediaFileId,
      renderWidth:   Math.round(width)  || 1280,
      renderHeight:  Math.round(height) || 720
    }).catch(err => setError(String(err)));

    window.skyMovie.mpvSetVolume(stateRef.current.volume).catch(() => {});

    // Restore watch position after file-loaded
    const savedPos = player.watchProgress?.positionSeconds ?? 0;
    const savedDur = player.watchProgress?.durationSeconds ?? 0;
    let posRestored = false;

    const unsubFrame  = window.skyMovie.onMpvFrame(drawFrame);
    const unsubEvent  = window.skyMovie.onMpvEvent(ev => {
      if (ev.type === 'property') {
        if (ev.name === 'time-pos' && typeof ev.value === 'number') {
          if (!seeking.current) updateState({ position: ev.value });
        }
        if (ev.name === 'duration' && typeof ev.value === 'number') {
          updateState({ duration: ev.value });
        }
        if (ev.name === 'pause' && typeof ev.value === 'boolean') {
          updateState({ playing: !ev.value });
        }
        if (ev.name === 'volume' && typeof ev.value === 'number') {
          updateState({ volume: ev.value });
        }
      }
      if (ev.type === 'file-loaded') {
        updateState({ buffering: false });
        // Restore position
        if (!posRestored && savedPos > 5 && !player.watchProgress?.completed) {
          const dur = stateRef.current.duration || savedDur;
          if (dur - savedPos > 10) {
            window.skyMovie.mpvSeek(savedPos).catch(() => {});
          }
        }
        posRestored = true;
      }
    });
    const unsubTracks = window.skyMovie.onMpvTracks(setTracks);

    // Save progress every 10s
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
      // Save final position
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

  // ── keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      // Skip any modifier-key combos — those belong to global shortcuts (e.g. Alt+Left = navigate back)
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          resetHideTimer();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          resetHideTimer();
          window.skyMovie.mpvSeek(Math.max(0, stateRef.current.position - 5)).catch(() => {});
          break;
        case 'ArrowRight':
          e.preventDefault();
          resetHideTimer();
          window.skyMovie.mpvSeek(stateRef.current.position + 5).catch(() => {});
          break;
        case 'ArrowUp':
          e.preventDefault();
          resetHideTimer();
          changeVolume(Math.min(100, stateRef.current.volume + 5));
          break;
        case 'ArrowDown':
          e.preventDefault();
          resetHideTimer();
          changeVolume(Math.max(0, stateRef.current.volume - 5));
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          resetHideTimer();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          resetHideTimer();
          toggleMute();
          break;
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── fullscreen sync ────────────────────────────────────────────────────────

  useEffect(() => {
    const onChange = () => setFullscr(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // ── controls auto-hide ─────────────────────────────────────────────────────

  const resetHideTimer = useCallback(() => {
    setShowCtrl(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowCtrl(false), 3000);
  }, []);

  // ── actions ────────────────────────────────────────────────────────────────

  const togglePlay = () => {
    if (stateRef.current.playing) {
      window.skyMovie.mpvPause().catch(() => {});
    } else {
      window.skyMovie.mpvPlay().catch(() => {});
    }
  };

  const toggleMute = () => {
    const muted = !stateRef.current.muted;
    updateState({ muted });
    window.skyMovie.mpvSetVolume(muted ? 0 : stateRef.current.volume).catch(() => {});
  };

  const changeVolume = (v: number) => {
    updateState({ volume: v, muted: v === 0 });
    window.skyMovie.mpvSetVolume(v).catch(() => {});
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen().catch(() => {});
    }
  };

  // ── seek bar ───────────────────────────────────────────────────────────────

  const onSeekDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    seeking.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    doSeek(e);
  };
  const onSeekMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!seeking.current) return;
    doSeek(e);
  };
  const onSeekUp = (e: ReactPointerEvent<HTMLDivElement>) => {
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

  // ── track selectors ────────────────────────────────────────────────────────

  const audioTracks = tracks.filter(t => t.type === 'audio');
  const subTracks   = tracks.filter(t => t.type === 'sub');
  const selectedAid = tracks.find(t => t.type === 'audio' && t.selected)?.id ?? null;
  const selectedSid = tracks.find(t => t.type === 'sub'   && t.selected)?.id ?? null;

  // ── render ─────────────────────────────────────────────────────────────────

  const progress = state.duration > 0 ? state.position / state.duration : 0;

  return (
    <div
      ref={containerRef}
      className="mpv-player"
      onMouseMove={resetHideTimer}
      onPointerDown={() => setShowMenu(null)}
    >
      {/* Video canvas */}
      <canvas ref={canvasRef} className="mpv-canvas" />

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
          <button onClick={() => onOpenExternal(player.mediaFileId)}>
            Open in system player
          </button>
        </div>
      )}

      {/* Controls overlay */}
      <div className={`mpv-controls${showControls ? ' visible' : ''}`}>

        {/* Seek bar */}
        <div
          className="mpv-seek"
          onPointerDown={onSeekDown}
          onPointerMove={onSeekMove}
          onPointerUp={onSeekUp}
        >
          <div className="mpv-seek-track">
            <div className="mpv-seek-fill" style={{ width: `${progress * 100}%` }} />
            <div className="mpv-seek-thumb" style={{ left: `${progress * 100}%` }} />
          </div>
        </div>

        {/* Bottom row */}
        <div className="mpv-bottom">
          {/* Left group */}
          <div className="mpv-left">
            <button className="mpv-btn" onClick={togglePlay} title={state.playing ? 'Pause (Space)' : 'Play (Space)'}>
              {state.playing ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <div className="mpv-volume-group">
              <button className="mpv-btn" onClick={toggleMute} title="Mute (M)">
                {state.muted || state.volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                className="mpv-volume-slider"
                type="range"
                min={0} max={100} step={1}
                value={state.muted ? 0 : state.volume}
                style={{ '--vol': `${state.muted ? 0 : state.volume}%` } as React.CSSProperties}
                onChange={e => changeVolume(Number(e.target.value))}
              />
            </div>

            <span className="mpv-time">
              {formatTime(state.position)} / {formatTime(state.duration)}
            </span>
          </div>

          {/* Right group */}
          <div className="mpv-right">
            {/* Speed */}
            <div className="mpv-menu-wrap">
              <button
                className="mpv-btn mpv-btn-text"
                onClick={e => { e.stopPropagation(); setShowMenu(showMenu === 'speed' ? null : 'speed'); }}
                title="Playback speed"
              >
                {state.speed}× <ChevronDown size={12} />
              </button>
              {showMenu === 'speed' && (
                <div className="mpv-menu">
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(s => (
                    <button
                      key={s}
                      className={`mpv-menu-item${state.speed === s ? ' active' : ''}`}
                      onClick={() => {
                        updateState({ speed: s });
                        window.skyMovie.mpvSetSpeed(s).catch(() => {});
                        setShowMenu(null);
                      }}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Audio tracks */}
            {audioTracks.length > 0 && (
              <div className="mpv-menu-wrap">
                <button
                  className="mpv-btn mpv-btn-text"
                  onClick={e => { e.stopPropagation(); setShowMenu(showMenu === 'audio' ? null : 'audio'); }}
                  title="Audio track"
                >
                  Audio <ChevronDown size={12} />
                </button>
                {showMenu === 'audio' && (
                  <div className="mpv-menu">
                    {audioTracks.map(t => (
                      <button
                        key={t.id}
                        className={`mpv-menu-item${t.id === selectedAid ? ' active' : ''}`}
                        onClick={() => {
                          window.skyMovie.mpvSetAudioTrack(t.id).catch(() => {});
                          setShowMenu(null);
                        }}
                      >
                        {t.title || t.lang || `Track ${t.id}`}
                        {t.codec ? ` (${t.codec})` : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subtitles */}
            <div className="mpv-menu-wrap">
              <button
                className="mpv-btn mpv-btn-text"
                onClick={e => { e.stopPropagation(); setShowMenu(showMenu === 'sub' ? null : 'sub'); }}
                title="Subtitles"
              >
                <Settings size={16} /> <ChevronDown size={12} />
              </button>
              {showMenu === 'sub' && (
                <div className="mpv-menu">
                  <button
                    className={`mpv-menu-item${selectedSid === null ? ' active' : ''}`}
                    onClick={() => {
                      window.skyMovie.mpvSetSubTrack(0).catch(() => {});
                      setShowMenu(null);
                    }}
                  >
                    Off
                  </button>
                  {subTracks.map(t => (
                    <button
                      key={t.id}
                      className={`mpv-menu-item${t.id === selectedSid ? ' active' : ''}`}
                      onClick={() => {
                        window.skyMovie.mpvSetSubTrack(t.id).catch(() => {});
                        setShowMenu(null);
                      }}
                    >
                      {t.title || t.lang || `Sub ${t.id}`}
                    </button>
                  ))}
                  {/* Sidecar subtitles — loaded via mpv sub-add */}
                  {(player.sidecarSubtitles ?? []).map((s, i) => (
                    <button
                      key={`sc-${i}`}
                      className="mpv-menu-item"
                      onClick={async () => {
                        // Convert file:// URL to path for mpv
                        const path = s.url.startsWith('file:///')
                          ? decodeURIComponent(s.url.slice(8).replace(/\//g, '\\'))
                          : s.url;
                        await window.skyMovie.mpvSetSubFile(path).catch(() => {});
                        setShowMenu(null);
                      }}
                    >
                      {s.label} (external)
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="mpv-btn" onClick={toggleFullscreen} title="Fullscreen (F)">
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
