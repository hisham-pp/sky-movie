import * as queries from '@renderer/queries';
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
import { getSkin } from '../../theme/player-skins';
import { savePlaybackProgress } from './progress';

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
  resumePlayback = true,
  isFloating = false,
  onOpenExternal,
  onEnded,
  onFloatingExpand,
  onFloatingClose
}: {
  player: PlayMediaResult;
  playerStyle?: PlayerStyle;
  resumePlayback?: boolean;
  isFloating?: boolean;
  onOpenExternal?(mediaFileId: number): void;
  onEnded?(): void;
  onFloatingExpand?(): void;
  onFloatingClose?(): void;
}) {
  const skin = getSkin(playerStyle);
  const resumeRef = useRef(resumePlayback);
  resumeRef.current = resumePlayback;
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
  const onEndedRef      = useRef(onEnded);
  onEndedRef.current    = onEnded;
  const tracksRef       = useRef<MpvTrack[]>([]);
  const trackOsdTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state,        setState]     = useState<PlayerState>(DEFAULT_STATE);
  const [tracks,       setTracks]    = useState<MpvTrack[]>([]);
  const [showControls, setShowCtrl]  = useState(true);
  const [seekOsd,      setSeekOsd]   = useState(false);
  const [isFullscreen, setFullscr]   = useState(false);
  const [showMenu,     setShowMenu]  = useState<'settings' | 'aiEnhance' | null>(null);
  const [error,        setError]     = useState<string | null>(null);
  const [ripple,       setRipple]    = useState<'left' | 'right' | null>(null);
  const [trackOsd,     setTrackOsd]  = useState<string | null>(null);
  const [bufferProgress, setBufferProgress] = useState<number>(0);
  const [showCursor,   setShowCursor] = useState(true);

  const updateState = useCallback((patch: Partial<PlayerState>) => {
    stateRef.current = { ...stateRef.current, ...patch };
    setState(s => ({ ...s, ...patch }));
  }, []);

  // ── canvas draw loop ───────────────────────────────────────────────────────

  // WebGL context and texture state refs
  const glRef = useRef<WebGLRenderingContext | WebGL2RenderingContext | null>(null);
  const texRef = useRef<WebGLTexture | null>(null);
  const progRef = useRef<WebGLProgram | null>(null);

  const initWebGL = (canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return null;
    
    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;
    const fsSource = `
      precision mediump float;
      uniform sampler2D u_image;
      varying vec2 v_texCoord;
      void main() {
        gl_FragColor = texture2D(u_image, v_texCoord).bgra;
      }
    `;
    
    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    
    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    const prog = gl.createProgram();
    if (!prog || !vs || !fs) return null;
    
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1, -1,  1,
      -1,  1,  1, -1,  1,  1
    ]), gl.STATIC_DRAW);
    
    const posLoc = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    
    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 1,  1, 1,  0, 0,
      0, 0,  1, 1,  1, 0
    ]), gl.STATIC_DRAW);
    
    const texLoc = gl.getAttribLocation(prog, 'a_texCoord');
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);
    
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    progRef.current = prog;
    texRef.current = tex;
    return gl;
  };

  const drawFrame = useCallback((rgba: Uint8Array, width: number, height: number) => {
    const canvas = canvasRef.current;
    if (!canvas || drawingRef.current) return;
    
    if (stateRef.current.buffering) {
      stateRef.current = { ...stateRef.current, buffering: false };
      setState(s => ({ ...s, buffering: false }));
    }

    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    let gl = glRef.current;
    if (!gl || gl.isContextLost()) {
      gl = initWebGL(canvas);
      glRef.current = gl;
    }
    if (!gl) return;
    
    drawingRef.current = true;
    
    requestAnimationFrame(() => {
      try {
        gl.viewport(0, 0, width, height);
        gl.bindTexture(gl.TEXTURE_2D, texRef.current);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } catch (e) {
        console.error('WebGL render error', e);
      } finally {
        drawingRef.current = false;
      }
    });
  }, []);

  // ── render size sync ───────────────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      const w = Math.round(width);
      const h = Math.round(height);
      if (w > 0 && h > 0) queries.mpvSetRenderSize(w, h).catch(() => {});
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
    setBufferProgress(0);

    const { width, height } = container.getBoundingClientRect();

    queries.mpvOpen({
      filePath:     player.playbackKind === 'torrent' ? player.mediaUrl : player.absolutePath ?? player.mediaUrl,
      mediaFileId:  player.mediaFileId,
      renderWidth:  Math.round(width)  || 1280,
      renderHeight: Math.round(height) || 720
    }).catch(err => setError(String(err)));

    queries.mpvSetVolume(stateRef.current.volume).catch(() => {});

    const savedPos = player.watchProgress?.positionSeconds ?? 0;
    const savedDur = player.watchProgress?.durationSeconds ?? 0;
    let posRestored = false;
    let eofFired = false;

    const unsubFrame  = queries.onMpvFrame(drawFrame);
    const unsubEvent  = queries.onMpvEvent(ev => {
      if (ev.type === 'property') {
        if (ev.name === 'time-pos'  && typeof ev.value === 'number') {
          if (!seeking.current) updateState({ position: ev.value });
        }
        if (ev.name === 'duration'  && typeof ev.value === 'number') updateState({ duration: ev.value });
        if (ev.name === 'pause'     && typeof ev.value === 'boolean') updateState({ playing: !ev.value });
        if (ev.name === 'volume'    && typeof ev.value === 'number') updateState({ volume: ev.value });
        // keep-open=yes means eof-reached flips true only at natural end of
        // file — never on manual close or when another file replaces this one.
        if (ev.name === 'eof-reached' && typeof ev.value === 'boolean') {
          if (ev.value && !eofFired) {
            eofFired = true;
            const s = stateRef.current;
            if (s.duration > 0) {
              savePlaybackProgress(player, Math.floor(s.duration), Math.floor(s.duration), true).catch(() => {});
            }
            onEndedRef.current?.();
          } else if (!ev.value) {
            eofFired = false;
          }
        }
      }
      if (ev.type === 'file-loaded') {
        updateState({ buffering: false });
        if (!posRestored && resumeRef.current && savedPos > 5 && !player.watchProgress?.completed) {
          const dur = stateRef.current.duration || savedDur;
          if (dur - savedPos > 10) queries.mpvSeek(savedPos).catch(() => {});
        }
        posRestored = true;
      }
    });
    const unsubTracks = queries.onMpvTracks(ts => {
      tracksRef.current = ts;
      setTracks(ts);
    });

    // Save progress every 15 seconds (reduced frequency to minimize IPC overhead)
    // Only save when actually playing to avoid unnecessary writes
    const progressTimer = setInterval(() => {
      const s = stateRef.current;
      if (s.playing && s.duration > 0 && s.position > 0) {
        savePlaybackProgress(player, Math.floor(s.position), Math.floor(s.duration), s.position / s.duration > 0.92).catch(() => {});
      }
    }, 15_000);

    // Periodic cleanup to help with long playback sessions
    // Request browser idle callback every 2 minutes to allow GC
    let cleanupCounter = 0;
    const cleanupTimer = setInterval(() => {
      cleanupCounter++;
      // Every 2 minutes during playback
      if (cleanupCounter % 8 === 0 && stateRef.current.playing) {
        // Give the browser a hint that it can run GC during idle time
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            // No-op, just giving browser a chance to clean up
          });
        }
      }
    }, 15_000);

    // Poll buffer progress for torrent streams
    let bufferTimer: ReturnType<typeof setInterval> | null = null;
    if (player.playbackKind === 'torrent' && player.torrentId && player.torrentFilePath) {
      bufferTimer = setInterval(() => {
        if (player.torrentId && player.torrentFilePath) {
          queries.torrentGetBufferProgress(player.torrentId, player.torrentFilePath)
            .then(result => setBufferProgress(result.fileProgress))
            .catch(() => {});
        }
      }, 2000);
    }

    return () => {
      clearInterval(progressTimer);
      clearInterval(cleanupTimer);
      if (bufferTimer) clearInterval(bufferTimer);
      unsubFrame();
      unsubEvent();
      unsubTracks();
      const s = stateRef.current;
      if (s.duration > 0 && s.position > 0) {
        savePlaybackProgress(player, Math.floor(s.position), Math.floor(s.duration), s.position / s.duration > 0.92).catch(() => {});
      }
      queries.mpvClose().catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.mediaFileId]);

  // ── audio / subtitle track cycling (Ctrl+H / Ctrl+J) ───────────────────────
  // Only refs are used so the functions stay valid inside the long-lived
  // keydown listener without resubscribing on every tracks update.

  const showTrackOsd = (text: string) => {
    setTrackOsd(text);
    if (trackOsdTimer.current) clearTimeout(trackOsdTimer.current);
    trackOsdTimer.current = setTimeout(() => setTrackOsd(null), 1800);
  };

  const trackLabel = (t: MpvTrack) => t.title || t.lang || `Track ${t.id}`;

  const cycleAudioTrack = () => {
    const audio = tracksRef.current.filter(t => t.type === 'audio');
    if (audio.length < 2) return;
    const idx = audio.findIndex(t => t.selected);
    const next = audio[(idx + 1) % audio.length];
    tracksRef.current = tracksRef.current.map(t =>
      t.type === 'audio' ? { ...t, selected: t.id === next.id } : t
    );
    queries.mpvSetAudioTrack(next.id).catch(() => {});
    showTrackOsd(`Audio · ${trackLabel(next)}`);
  };

  const cycleSubTrack = () => {
    const subs = tracksRef.current.filter(t => t.type === 'sub');
    if (subs.length === 0) return;
    // Cycle Off → first → … → last → Off
    const idx = subs.findIndex(t => t.selected);
    const next = idx + 1 < subs.length ? subs[idx + 1] : null;
    tracksRef.current = tracksRef.current.map(t =>
      t.type === 'sub' ? { ...t, selected: next !== null && t.id === next.id } : t
    );
    queries.mpvSetSubTrack(next?.id ?? 0).catch(() => {});
    showTrackOsd(next ? `Subtitles · ${trackLabel(next)}` : 'Subtitles · Off');
  };

  // ── keyboard shortcuts (driven by skin keyMap) ─────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
        if (e.key === 'h' || e.key === 'H') {
          e.preventDefault(); cycleAudioTrack(); return;
        }
        if (e.key === 'j' || e.key === 'J') {
          e.preventDefault(); cycleSubTrack(); return;
        }
      }
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const k = e.key;

      if (keyMap.togglePlay.includes(k)) {
        e.preventDefault(); resetHideTimer(); togglePlay();
      } else if (keyMap.seekBackLarge.includes(k)) {
        e.preventDefault();
        showControlsRef.current ? resetHideTimer() : triggerSeekOsd();
        queries.mpvSeek(Math.max(0, stateRef.current.position - keyMap.seekBackLargeSeconds)).catch(() => {});
      } else if (keyMap.seekForwardLarge.includes(k)) {
        e.preventDefault();
        showControlsRef.current ? resetHideTimer() : triggerSeekOsd();
        queries.mpvSeek(stateRef.current.position + keyMap.seekForwardLargeSeconds).catch(() => {});
      } else if (keyMap.seekBack.includes(k)) {
        e.preventDefault();
        showControlsRef.current ? resetHideTimer() : triggerSeekOsd();
        queries.mpvSeek(Math.max(0, stateRef.current.position - keyMap.seekBackSeconds)).catch(() => {});
      } else if (keyMap.seekForward.includes(k)) {
        e.preventDefault();
        showControlsRef.current ? resetHideTimer() : triggerSeekOsd();
        queries.mpvSeek(stateRef.current.position + keyMap.seekForwardSeconds).catch(() => {});
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

  // ── controls auto-hide + cursor hide ───────────────────────────────────────

  const resetHideTimer = useCallback(() => {
    showControlsRef.current = true;
    setShowCtrl(true);
    setShowCursor(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { 
      showControlsRef.current = false; 
      setShowCtrl(false);
      setShowCursor(false);
    }, 3000);
  }, []);

  const triggerSeekOsd = useCallback(() => {
    setSeekOsd(true);
    if (seekOsdTimer.current) clearTimeout(seekOsdTimer.current);
    seekOsdTimer.current = setTimeout(() => setSeekOsd(false), 1500);
  }, []);

  // ── actions ────────────────────────────────────────────────────────────────

  const togglePlay = () => {
    stateRef.current.playing
      ? queries.mpvPause().catch(() => {})
      : queries.mpvPlay().catch(() => {});
  };

  const toggleMute = () => {
    const muted = !stateRef.current.muted;
    if (muted) {
      preMuteVolume.current = stateRef.current.volume || skin.volumeMax;
      updateState({ muted });
      queries.mpvSetVolume(0).catch(() => {});
    } else {
      const restoreVol = preMuteVolume.current || skin.volumeMax;
      updateState({ muted, volume: restoreVol });
      queries.mpvSetVolume(restoreVol).catch(() => {});
    }
  };

  const changeVolume = (v: number) => {
    updateState({ volume: v, muted: v === 0 });
    queries.mpvSetVolume(v).catch(() => {});
  };

  const toggleFullscreen = () => {
    if (isFloating && onFloatingExpand) {
      onFloatingExpand();
      return;
    }

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
    queries.mpvSeek(stateRef.current.position).catch(() => {});
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
        queries.mpvSeek(Math.max(0, stateRef.current.position - keyMap.seekBackLargeSeconds)).catch(() => {});
        showRipple('left');
      } else {
        queries.mpvSeek(stateRef.current.position + keyMap.seekForwardLargeSeconds).catch(() => {});
        showRipple('right');
      }
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="mpv-player"
      style={{ cursor: showCursor ? 'default' : 'none' }}
      onMouseMove={resetHideTimer}
      onPointerDown={() => setShowMenu(null)}
      onClick={onVideoClick}
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

      {/* Track-switch OSD (Ctrl+H / Ctrl+J) */}
      <div className={`mpv-track-osd${trackOsd ? ' visible' : ''}`}>
        {trackOsd}
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
          {onOpenExternal && <button onClick={() => onOpenExternal(player.mediaFileId)}>Open in system player</button>}
        </div>
      )}

      {/* Controls — rendered by the active skin */}
      {skin.renderControls({
        state,
        tracks: tracks as any,
        isVisible: showControls,
        seekOsdVisible: seekOsd && !showControls,
        isFullscreen,
        isFloating,
        showMenu,
        sidecarSubtitles: player.sidecarSubtitles ?? [],
        bufferProgress: player.playbackKind === 'torrent' ? bufferProgress : undefined,
        onTogglePlay:     togglePlay,
        onToggleMute:     toggleMute,
        onChangeVolume:   changeVolume,
        onToggleFullscreen: toggleFullscreen,
        onSeekTo:         (s) => queries.mpvSeek(s).catch(() => {}),
        onSetSpeed:       (s) => { updateState({ speed: s }); queries.mpvSetSpeed(s).catch(() => {}); },
        onSetAudioTrack:  (id) => queries.mpvSetAudioTrack(id).catch(() => {}),
        onSetSubTrack:    (id) => queries.mpvSetSubTrack(id).catch(() => {}),
        onSetSubFile:     (path) => queries.mpvSetSubFile(path).catch(() => {}),
        onSetShowMenu:    setShowMenu,
        onSeekBarDown,
        onSeekBarMove,
        onSeekBarUp,
        onFloatingExpand,
        onFloatingClose
      })}
    </div>
  );
}
