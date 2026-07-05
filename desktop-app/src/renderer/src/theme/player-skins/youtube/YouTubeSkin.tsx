import * as queries from '@renderer/queries';
import React, { useEffect, useRef, useState } from 'react';
import './YouTubeSkin.css';
import {
  Play, Pause,
  Volume2, Volume1, VolumeX,
  Maximize, Minimize,
  Settings, Captions,
  ChevronRight, ChevronLeft,
  Check, Moon, Gauge, SlidersHorizontal, Sparkles,
} from 'lucide-react';
import { PlayerSkin } from '../PlayerSkin';
import type { PlayerKeyMap, SkinControlsProps } from '../PlayerSkin';
import { VideoEnhancer } from '../../../utils/player/videoEnhancer';
import type { VideoEnhancerParams } from '../../../utils/player/videoEnhancer';
import { buildMpvAudioFilter } from '../../../utils/player/audioEnhance';

function formatTime(secs: number): string {
  if (!Number.isFinite(secs) || secs < 0) return '0:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const SPEED_MIN     = 0.25;
const SPEED_MAX     = 3.0;
const SPEED_STEP    = 0.25;
const SPEED_PRESETS = [1, 1.25, 1.5, 2, 3] as const;
const SLEEP_OPTIONS = [10, 15, 20, 30, 45, 60] as const;

type SettingsPage = 'main' | 'speed' | 'sub' | 'sleep' | 'audio' | 'enhance';

function YouTubeControls({
  props,
  volumeMax,
  volumeBoostMax,
  keyMap,
}: {
  props: SkinControlsProps;
  volumeMax: number;
  volumeBoostMax: number;
  keyMap: PlayerKeyMap;
}) {
  const {
    state, tracks, isVisible, seekOsdVisible, isFullscreen, showMenu, sidecarSubtitles,
    onTogglePlay, onToggleMute, onChangeVolume, onToggleFullscreen,
    onSetSpeed, onSetAudioTrack, onSetSubTrack, onSetSubFile,
    onSetShowMenu, onSeekBarDown, onSeekBarMove, onSeekBarUp,
  } = props;

  const [volExpanded,    setVolExpand]    = useState(false);
  const [settingsPage,   setPage]         = useState<SettingsPage>('main');
  const [volOsd,         setVolOsd]       = useState(false);
  const [stableVol,      setStableVol]    = useState(false);
  const [voiceBoost,     setVoiceBoost]   = useState(false);
  const [sleepMin,       setSleepMin]     = useState<number | null>(null);
  const [sleepDeadline,  setSleepDeadline] = useState<number | null>(null);
  const [showRemaining,  setShowRemaining] = useState(false);
  const [seekOsdDir,     setSeekOsdDir]   = useState<'back' | 'forward' | null>(null);
  const [seekOsdAmt,     setSeekOsdAmt]   = useState(0);
  // Enhancement state
  const [brightness,     setBrightness]   = useState(100);
  const [contrast,       setContrast]     = useState(100);
  const [saturation,     setSaturation]   = useState(100);
  const [bassBoost,      setBassBoost]    = useState(false);
  const [trebleBoost,    setTrebleBoost]  = useState(false);
  // AI enhance state
  const [showAiPanel,    setShowAiPanel]  = useState(false);
  const [aiVideoOn,      setAiVideoOn]    = useState(false);
  const [aiAudioOn,      setAiAudioOn]    = useState(false);
  const [aiSharpness,    setAiSharpness]  = useState(55);  // 0-100 → 0-1
  const [aiDenoise,      setAiDenoise]    = useState(35);
  const [aiColorBoost,   setAiColorBoost] = useState(30);

  const volOsdTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekOsdTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPlaying  = useRef(state.playing);
  const onTogglePlayRef = useRef(onTogglePlay);
  const didMount       = useRef(false);

  // VideoEnhancer instance (WebGL overlay)
  const videoEnhancerRef = useRef<VideoEnhancer | null>(null);

  // Web Audio chain for audio enhancement (ArtPlayer HTML5 path only)
  const audioRef = useRef<{
    ctx: AudioContext;
    bass: BiquadFilterNode;
    treble: BiquadFilterNode;
    voice: BiquadFilterNode;
    compressor: DynamicsCompressorNode;
  } | null>(null);

  useEffect(() => { latestPlaying.current = state.playing; }, [state.playing]);
  useEffect(() => { onTogglePlayRef.current = onTogglePlay; });

  // Sleep timer — a wall-clock deadline polled every second instead of one
  // long setTimeout: Chromium throttles long timers in occluded windows, and
  // the interval is torn down with the component so a pending timer can never
  // pause a later playback session.
  useEffect(() => {
    if (sleepDeadline === null) return;
    const check = () => {
      if (Date.now() < sleepDeadline) return;
      if (latestPlaying.current) onTogglePlayRef.current();
      setSleepMin(null);
      setSleepDeadline(null);
    };
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [sleepDeadline]);

  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    if (state.muted) return;
    setVolOsd(true);
    if (volOsdTimer.current) clearTimeout(volOsdTimer.current);
    volOsdTimer.current = setTimeout(() => setVolOsd(false), 1500);
  }, [state.volume, state.muted]);

  // Listen for seek keys to show directional OSD
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key;
      let dir: 'back' | 'forward' | null = null;
      let amt = 0;
      if (keyMap.seekBackLarge.includes(k))    { dir = 'back';    amt = keyMap.seekBackLargeSeconds; }
      else if (keyMap.seekForwardLarge.includes(k)) { dir = 'forward'; amt = keyMap.seekForwardLargeSeconds; }
      else if (keyMap.seekBack.includes(k))    { dir = 'back';    amt = keyMap.seekBackSeconds; }
      else if (keyMap.seekForward.includes(k)) { dir = 'forward'; amt = keyMap.seekForwardSeconds; }
      if (dir) {
        setSeekOsdDir(dir);
        setSeekOsdAmt(amt);
        if (seekOsdTimer.current) clearTimeout(seekOsdTimer.current);
        seekOsdTimer.current = setTimeout(() => setSeekOsdDir(null), 800);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keyMap]);

  // SVG filter lifecycle — insert/remove when AI video is toggled
  useEffect(() => {
    if (!videoEnhancerRef.current) videoEnhancerRef.current = new VideoEnhancer();
    return () => { videoEnhancerRef.current?.remove(); videoEnhancerRef.current = null; };
  }, []);

  // Single combined CSS filter effect covering AI enhance + manual sliders
  useEffect(() => {
    const enhancer = videoEnhancerRef.current;
    if (aiVideoOn) {
      enhancer?.ensureFilter();
      enhancer?.updateParams({ sharpness: aiSharpness / 100, denoise: aiDenoise / 100, colorBoost: aiColorBoost / 100 });
    } else {
      enhancer?.remove();
      videoEnhancerRef.current = new VideoEnhancer();
    }
    const filterStr = VideoEnhancer.buildFilterString(
      aiVideoOn, aiColorBoost / 100, brightness, contrast, saturation,
    );
    const els = document.querySelectorAll<HTMLElement>('.player canvas, .player video');
    els.forEach(el => { el.style.filter = filterStr || ''; });
    return () => { els.forEach(el => { el.style.filter = ''; }); };
  }, [aiVideoOn, aiSharpness, aiDenoise, aiColorBoost, brightness, contrast, saturation]);

  // AI audio enhance — activate full chain with harmonic exciter
  useEffect(() => {
    if (!audioRef.current) return;
    const { ctx, bass, treble, voice, compressor } = audioRef.current;
    ctx.resume();
    if (aiAudioOn) {
      // Optimized AI preset: moderate bass, clear highs, voice presence, dynamics control
      bass.gain.value     = bassBoost   ? 8  : 5;
      treble.gain.value   = trebleBoost ? 6  : 4;
      voice.gain.value    = voiceBoost  ? 6  : 3;
      compressor.threshold.value = -20;
      compressor.knee.value      = 25;
      compressor.ratio.value     = 3.5;
    } else {
      // Restore individual toggle values
      bass.gain.value     = bassBoost   ? 8 : 0;
      treble.gain.value   = trebleBoost ? 6 : 0;
      voice.gain.value    = voiceBoost  ? 6 : 0;
      if (!stableVol) { compressor.threshold.value = 0; compressor.ratio.value = 1; }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiAudioOn]);

  // Web Audio setup — runs once, only when a <video> element is present (ArtPlayer path)
  useEffect(() => {
    const videoEl = document.querySelector<HTMLVideoElement>('.player video');
    if (!videoEl) return;
    let ctx: AudioContext;
    try {
      ctx = new AudioContext();
      const source = ctx.createMediaElementSource(videoEl);
      const bass = ctx.createBiquadFilter();
      bass.type = 'lowshelf'; bass.frequency.value = 120; bass.gain.value = 0;
      const treble = ctx.createBiquadFilter();
      treble.type = 'highshelf'; treble.frequency.value = 3000; treble.gain.value = 0;
      const voice = ctx.createBiquadFilter();
      voice.type = 'peaking'; voice.frequency.value = 2000; voice.Q.value = 1.5; voice.gain.value = 0;
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = 0; compressor.ratio.value = 1;
      source.connect(bass).connect(treble).connect(voice).connect(compressor).connect(ctx.destination);
      audioRef.current = { ctx, bass, treble, voice, compressor };
    } catch {
      // MPV native canvas path — audio not routable via Web Audio API
    }
    return () => { if (audioRef.current) { audioRef.current.ctx.close(); audioRef.current = null; } };
  }, []);

  // mpv path: no <video> element exists, so Web Audio can't intercept the
  // stream — apply the equivalent enhancement chain as mpv audio filters.
  useEffect(() => {
    if (audioRef.current) return;
    const af = buildMpvAudioFilter({
      bassBoost, trebleBoost, voiceBoost, stableVolume: stableVol, aiAudio: aiAudioOn
    });
    queries.mpvSetAudioFilter(af).catch(() => {});
  }, [bassBoost, trebleBoost, voiceBoost, stableVol, aiAudioOn]);

  // Sync audio enhancement params
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.ctx.resume();
    audioRef.current.bass.gain.value = bassBoost ? 8 : 0;
  }, [bassBoost]);
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.ctx.resume();
    audioRef.current.treble.gain.value = trebleBoost ? 6 : 0;
  }, [trebleBoost]);
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.ctx.resume();
    audioRef.current.voice.gain.value = voiceBoost ? 6 : 0;
  }, [voiceBoost]);
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.ctx.resume();
    const { compressor } = audioRef.current;
    if (stableVol) {
      compressor.threshold.value = -24; compressor.knee.value = 30; compressor.ratio.value = 4;
    } else {
      compressor.threshold.value = 0; compressor.ratio.value = 1;
    }
  }, [stableVol]);

  const openMenu = (page: SettingsPage = 'main') => {
    setPage(page);
    onSetShowMenu('settings');
  };

  const applySleep = (m: number | null) => {
    setSleepMin(m);
    setSleepDeadline(m === null ? null : Date.now() + m * 60_000);
  };

  const totalMax   = volumeMax + volumeBoostMax;
  const progress   = state.duration > 0 ? state.position / state.duration : 0;
  const displayVol = state.muted ? 0 : Math.round(state.volume);
  const boostAmt   = !state.muted && state.volume > volumeMax ? Math.round(state.volume - volumeMax) : 0;

  const audioTracks = tracks.filter(t => t.type === 'audio');
  const subTracks   = tracks.filter(t => t.type === 'sub');
  const selectedAid = tracks.find(t => t.type === 'audio' && t.selected)?.id ?? null;
  const selectedSid = tracks.find(t => t.type === 'sub'   && t.selected)?.id ?? null;
  const activeSub   = subTracks.find(t => t.id === selectedSid);

  const lastSubRef = useRef<number | null>(null);
  if (selectedSid !== null) lastSubRef.current = selectedSid;

  const toggleSubtitles = () => {
    if (selectedSid !== null) { onSetSubTrack(0); }
    else {
      const restore = lastSubRef.current ?? subTracks[0]?.id;
      if (restore != null) onSetSubTrack(restore);
    }
  };

  const speedLabel = state.speed === 1 ? 'Normal' : `${state.speed}×`;
  const sleepLabel = sleepDeadline === null
    ? 'Off'
    : `${Math.max(1, Math.ceil((sleepDeadline - Date.now()) / 60_000))}m left`;
  const subLabel   = selectedSid === null ? 'Off' : activeSub?.title || activeSub?.lang || 'On';

  const VolumeIcon = state.muted || displayVol === 0 ? VolumeX
    : displayVol < 50 ? Volume1 : Volume2;

  return (
    <>
      {/* Volume OSD — top-center pill + big centered icon */}
      <div className={`yt-vol-osd-pill${volOsd ? ' visible' : ''}`}>
        <VolumeIcon size={13} />
        <span>{displayVol}%</span>
        {boostAmt > 0 && <span style={{ color: 'var(--primary)', marginLeft: 2 }}>+{boostAmt}</span>}
      </div>
      <div className={`yt-vol-osd-icon${volOsd ? ' visible' : ''}`}>
        <VolumeIcon size={36} />
      </div>

      {/* Seek OSD — centered left/right ripple */}
      <div className={`yt-seek-osd yt-seek-osd-left${seekOsdDir === 'back' ? ' visible' : ''}`}>
        <span className="yt-seek-osd-arrows">«</span>
        <span className="yt-seek-osd-label">−{seekOsdAmt}s</span>
      </div>
      <div className={`yt-seek-osd yt-seek-osd-right${seekOsdDir === 'forward' ? ' visible' : ''}`}>
        <span className="yt-seek-osd-label">+{seekOsdAmt}s</span>
        <span className="yt-seek-osd-arrows">»</span>
      </div>

      {/* Thin seek bar shown when controls hidden */}
      {seekOsdVisible && (
        <div className="yt-seek-osd-bar">
          <div className="yt-seek-osd-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      )}

      {/* ── Settings panel ───────────────────────────────────────────────────── */}
      {showMenu === 'settings' && (
        <div
          className="yt-settings-panel"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
        >

          {/* Main page */}
          {settingsPage === 'main' && (
            <>
              <div className="yt-settings-title">
                <h4>Settings</h4>
                <p>Adjust your viewing experience</p>
              </div>
              <div className="yt-settings-body">
                <button className="yt-settings-item" onClick={() => setPage('enhance')}>
                  <span className="yt-settings-item-icon"><SlidersHorizontal size={17} /></span>
                  <span className="yt-settings-item-label">Enhancement</span>
                  <span className="yt-settings-item-value">
                    {[bassBoost, trebleBoost, voiceBoost, stableVol, brightness !== 100, contrast !== 100, saturation !== 100].some(Boolean)
                      ? 'On' : 'Off'}
                    <ChevronRight size={14} />
                  </span>
                </button>

                <button className="yt-settings-item" onClick={() => setPage('speed')}>
                  <span className="yt-settings-item-icon"><Gauge size={17} /></span>
                  <span className="yt-settings-item-label">Speed</span>
                  <span className="yt-settings-item-value">
                    {speedLabel}
                    <ChevronRight size={14} />
                  </span>
                </button>

                <button className="yt-settings-item" onClick={() => setPage('sub')}>
                  <span className="yt-settings-item-icon"><Captions size={17} /></span>
                  <span className="yt-settings-item-label">Subtitles/CC</span>
                  <span className="yt-settings-item-value">
                    {subLabel}
                    <ChevronRight size={14} />
                  </span>
                </button>

                <button className="yt-settings-item" onClick={() => setPage('sleep')}>
                  <span className="yt-settings-item-icon"><Moon size={17} /></span>
                  <span className="yt-settings-item-label">Sleep timer</span>
                  <span className="yt-settings-item-value">
                    {sleepLabel}
                    <ChevronRight size={14} />
                  </span>
                </button>

                {audioTracks.length > 1 && (
                  <button className="yt-settings-item" onClick={() => setPage('audio')}>
                    <span className="yt-settings-item-icon"><Volume2 size={17} /></span>
                    <span className="yt-settings-item-label">Audio</span>
                    <span className="yt-settings-item-value">
                      {audioTracks.find(t => t.id === selectedAid)?.lang || 'Track 1'}
                      <ChevronRight size={14} />
                    </span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* Speed submenu */}
          {settingsPage === 'speed' && (() => {
            const speedPct = ((state.speed - SPEED_MIN) / (SPEED_MAX - SPEED_MIN)) * 100;
            const dec = (v: number) => Math.max(SPEED_MIN, Math.round((v - SPEED_STEP) * 100) / 100);
            const inc = (v: number) => Math.min(SPEED_MAX, Math.round((v + SPEED_STEP) * 100) / 100);
            return (
              <>
                <div className="yt-settings-header">
                  <button className="yt-settings-back" onClick={() => setPage('main')}>
                    <ChevronLeft size={18} />
                  </button>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Playback speed</span>
                </div>

                <div className="yt-speed-display">
                  {state.speed === 1 ? '1.00×' : `${state.speed}×`}
                </div>

                <div className="yt-speed-slider-row">
                  <button className="yt-speed-adj" disabled={state.speed <= SPEED_MIN}
                    onClick={() => onSetSpeed(dec(state.speed))}>−</button>
                  <input
                    className="yt-speed-range"
                    type="range" min={SPEED_MIN} max={SPEED_MAX} step={SPEED_STEP}
                    value={state.speed}
                    style={{ '--spd': `${speedPct}%` } as React.CSSProperties}
                    onChange={e => onSetSpeed(Number(e.target.value))}
                  />
                  <button className="yt-speed-adj" disabled={state.speed >= SPEED_MAX}
                    onClick={() => onSetSpeed(inc(state.speed))}>+</button>
                </div>

                <div className="yt-speed-presets">
                  {SPEED_PRESETS.map(v => (
                    <button
                      key={v}
                      className={`yt-speed-chip${state.speed === v ? ' active' : ''}`}
                      onClick={() => onSetSpeed(v)}
                    >
                      {v === 1 ? '1.0' : v}
                    </button>
                  ))}
                </div>
                {state.speed === 1 && <p className="yt-speed-normal-label">Normal</p>}
              </>
            );
          })()}

          {/* Subtitles submenu */}
          {settingsPage === 'sub' && (
            <>
              <div className="yt-settings-header">
                <button className="yt-settings-back" onClick={() => setPage('main')}>
                  <ChevronLeft size={18} />
                </button>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Subtitles/CC</span>
              </div>
              <div className="yt-settings-body">
                <button
                  className={`yt-settings-item${selectedSid === null ? ' active-item' : ''}`}
                  onClick={() => { onSetSubTrack(0); setPage('main'); onSetShowMenu(null); }}
                >
                  <span className="yt-settings-item-label">Off</span>
                  {selectedSid === null && <span className="yt-settings-check"><Check size={16} /></span>}
                </button>

                {subTracks.map(t => (
                  <button
                    key={t.id}
                    className={`yt-settings-item${t.id === selectedSid ? ' active-item' : ''}`}
                    onClick={() => { onSetSubTrack(t.id); setPage('main'); onSetShowMenu(null); }}
                  >
                    <span className="yt-settings-item-label">
                      {t.title || t.lang || `Subtitle ${t.id}`}
                    </span>
                    {t.id === selectedSid && <span className="yt-settings-check"><Check size={16} /></span>}
                  </button>
                ))}

                {sidecarSubtitles.map((s, i) => (
                  <button
                    key={`sc-${i}`}
                    className="yt-settings-item"
                    onClick={() => {
                      const path = s.url.startsWith('file:///')
                        ? decodeURIComponent(s.url.slice(8).replace(/\//g, '\\'))
                        : s.url;
                      onSetSubFile(path);
                      setPage('main');
                      onSetShowMenu(null);
                    }}
                  >
                    <span className="yt-settings-item-label">{s.label} (external)</span>
                  </button>
                ))}

                <p className="yt-settings-note">
                  This setting only applies to the current file.
                </p>
              </div>
            </>
          )}

          {/* Sleep timer submenu */}
          {settingsPage === 'sleep' && (
            <>
              <div className="yt-settings-header">
                <button className="yt-settings-back" onClick={() => setPage('main')}>
                  <ChevronLeft size={18} />
                </button>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Sleep timer</span>
              </div>
              <div className="yt-settings-body">
                <button
                  className={`yt-settings-item${sleepMin === null ? ' active-item' : ''}`}
                  onClick={() => { applySleep(null); setPage('main'); }}
                >
                  <span className="yt-settings-item-label">Off</span>
                  {sleepMin === null && <span className="yt-settings-check"><Check size={16} /></span>}
                </button>
                {SLEEP_OPTIONS.map(m => (
                  <button
                    key={m}
                    className={`yt-settings-item${sleepMin === m ? ' active-item' : ''}`}
                    onClick={() => { applySleep(m); setPage('main'); }}
                  >
                    <span className="yt-settings-item-label">{m} minutes</span>
                    {sleepMin === m && <span className="yt-settings-check"><Check size={16} /></span>}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Audio track submenu */}
          {settingsPage === 'audio' && (
            <>
              <div className="yt-settings-header">
                <button className="yt-settings-back" onClick={() => setPage('main')}>
                  <ChevronLeft size={18} />
                </button>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Audio track</span>
              </div>
              <div className="yt-settings-body">
                {audioTracks.map(t => (
                  <button
                    key={t.id}
                    className={`yt-settings-item${t.id === selectedAid ? ' active-item' : ''}`}
                    onClick={() => { onSetAudioTrack(t.id); setPage('main'); onSetShowMenu(null); }}
                  >
                    <span className="yt-settings-item-label">
                      {t.title || t.lang || `Track ${t.id}`}
                      {t.codec ? ` (${t.codec})` : ''}
                    </span>
                    {t.id === selectedAid && <span className="yt-settings-check"><Check size={16} /></span>}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Enhancement submenu */}
          {settingsPage === 'enhance' && (
            <>
              <div className="yt-settings-header">
                <button className="yt-settings-back" onClick={() => setPage('main')}>
                  <ChevronLeft size={18} />
                </button>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Enhancement</span>
              </div>
              <div className="yt-settings-body">

                {/* Video section */}
                <p className="yt-enhance-section-label">Video</p>

                <div className="yt-enhance-slider-row">
                  <span className="yt-enhance-slider-name">Brightness</span>
                  <input
                    type="range" min={50} max={150} step={1} value={brightness}
                    className="yt-enhance-range"
                    style={{ '--pct': `${((brightness - 50) / 100) * 100}%` } as React.CSSProperties}
                    onChange={e => setBrightness(Number(e.target.value))}
                  />
                  <span className="yt-enhance-slider-val">{brightness}%</span>
                </div>

                <div className="yt-enhance-slider-row">
                  <span className="yt-enhance-slider-name">Contrast</span>
                  <input
                    type="range" min={50} max={150} step={1} value={contrast}
                    className="yt-enhance-range"
                    style={{ '--pct': `${((contrast - 50) / 100) * 100}%` } as React.CSSProperties}
                    onChange={e => setContrast(Number(e.target.value))}
                  />
                  <span className="yt-enhance-slider-val">{contrast}%</span>
                </div>

                <div className="yt-enhance-slider-row">
                  <span className="yt-enhance-slider-name">Saturation</span>
                  <input
                    type="range" min={0} max={200} step={1} value={saturation}
                    className="yt-enhance-range"
                    style={{ '--pct': `${(saturation / 200) * 100}%` } as React.CSSProperties}
                    onChange={e => setSaturation(Number(e.target.value))}
                  />
                  <span className="yt-enhance-slider-val">{saturation}%</span>
                </div>

                <button
                  className="yt-enhance-reset"
                  onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }}
                >
                  Reset video
                </button>

                {/* Audio section */}
                <p className="yt-enhance-section-label" style={{ marginTop: 8 }}>Audio</p>

                {[
                  { label: 'Bass boost',     value: bassBoost,   set: setBassBoost },
                  { label: 'Treble boost',   value: trebleBoost, set: setTrebleBoost },
                  { label: 'Voice boost',    value: voiceBoost,  set: setVoiceBoost },
                  { label: 'Stable volume',  value: stableVol,   set: setStableVol },
                ].map(({ label, value, set }) => (
                  <button
                    key={label}
                    className="yt-settings-item"
                    onClick={() => set(v => !v)}
                  >
                    <span className="yt-settings-item-label">{label}</span>
                    <button
                      className={`yt-toggle${value ? ' on' : ''}`}
                      onClick={e => { e.stopPropagation(); set(v => !v); }}
                    />
                  </button>
                ))}

                <p className="yt-settings-note">
                  Audio effects require HTML5 playback mode. Video filters apply to all modes.
                </p>
              </div>
            </>
          )}

        </div>
      )}

      {/* ── AI Enhance panel ─────────────────────────────────────────────────── */}
      {showAiPanel && (
        <div
          className="yt-ai-panel"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="yt-ai-header">
            <Sparkles size={15} />
            <span>AI Enhance</span>
          </div>

          {/* Video section */}
          <div className="yt-ai-section">
            <div className="yt-ai-section-row">
              <span className="yt-ai-section-label">Video</span>
              <button
                className={`yt-toggle${aiVideoOn ? ' on' : ''}`}
                onClick={() => setAiVideoOn(v => !v)}
              />
            </div>
            {aiVideoOn && (
              <div className="yt-ai-sliders">
                {([
                  { label: 'Sharpness', val: aiSharpness,  set: setAiSharpness  },
                  { label: 'Denoise',   val: aiDenoise,    set: setAiDenoise    },
                  { label: 'Vivid',     val: aiColorBoost, set: setAiColorBoost },
                ] as const).map(({ label, val, set }) => (
                  <div key={label} className="yt-ai-slider-row">
                    <span className="yt-ai-slider-label">{label}</span>
                    <input
                      type="range" min={0} max={100} step={1} value={val}
                      className="yt-ai-range"
                      style={{ '--pct': `${val}%` } as React.CSSProperties}
                      onChange={e => set(Number(e.target.value))}
                    />
                    <span className="yt-ai-slider-val">{val}</span>
                  </div>
                ))}
                <button
                  className="yt-enhance-reset"
                  onClick={() => { setAiSharpness(55); setAiDenoise(35); setAiColorBoost(30); }}
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Audio section */}
          <div className="yt-ai-section">
            <div className="yt-ai-section-row">
              <span className="yt-ai-section-label">Audio</span>
              <button
                className={`yt-toggle${aiAudioOn ? ' on' : ''}`}
                onClick={() => setAiAudioOn(v => !v)}
              />
            </div>
            {aiAudioOn && (
              <p className="yt-settings-note" style={{ marginTop: 4 }}>
                Intelligent preset: balanced dynamics, voice clarity + bass presence.
                Requires HTML5 playback mode.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Controls overlay ─────────────────────────────────────────────────── */}
      <div className={`yt-controls${isVisible ? ' visible' : ''}`}>

        {/* Progress bar */}
        <div
          className="yt-progress-wrap"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => { e.stopPropagation(); onSeekBarDown(e); }}
          onPointerMove={onSeekBarMove}
          onPointerUp={e => { e.stopPropagation(); onSeekBarUp(e); }}
        >
          <div className="yt-progress-track">
            <div className="yt-progress-filled" style={{ width: `${progress * 100}%` }} />
            <div className="yt-progress-thumb"  style={{ left: `${progress * 100}%` }} />
          </div>
        </div>

        {/* Bottom row */}
        <div className="yt-bottom">

          {/* Left: play pill · volume pill · time */}
          <div className="yt-left">
            <div className="yt-pill">
              <button className="yt-btn"
                title={state.playing ? 'Pause (k)' : 'Play (k)'}
                onClick={e => { e.stopPropagation(); onTogglePlay(); }}>
                {state.playing
                  ? <Pause size={20} fill="currentColor" stroke="none" />
                  : <Play  size={20} fill="currentColor" stroke="none" />}
              </button>
            </div>

            <div className="yt-pill"
              onMouseEnter={() => setVolExpand(true)}
              onMouseLeave={() => setVolExpand(false)}
            >
              <button className="yt-btn" title="Mute (m)"
                onClick={e => { e.stopPropagation(); onToggleMute(); }}>
                <VolumeIcon size={20} />
              </button>
              <div className={`yt-vol-expand${volExpanded ? ' open' : ''}`}>
                <input
                  className="yt-volume-slider"
                  type="range" min={0} max={totalMax} step={1} value={displayVol}
                  style={{ '--vol': `${(displayVol / totalMax) * 100}%` } as React.CSSProperties}
                  onClick={e => e.stopPropagation()}
                  onPointerDown={e => e.stopPropagation()}
                  onChange={e => { e.stopPropagation(); onChangeVolume(Number(e.target.value)); }}
                />
              </div>
            </div>

            <div className="yt-time"
              style={{ cursor: 'pointer' }}
              onClick={e => { e.stopPropagation(); setShowRemaining(r => !r); }}
              title="Toggle remaining time"
            >
              {showRemaining
                ? <strong>−{formatTime(Math.max(0, state.duration - state.position))}</strong>
                : <strong>{formatTime(state.position)}</strong>}
              <span className="sep">/</span>
              <span className="yt-time-duration" style={{ opacity: 0.45 }}>{formatTime(state.duration)}</span>
            </div>
          </div>

          {/* Right: CC · AI enhance · settings · fullscreen in single pill */}
          <div className="yt-right">
            <div className="yt-pill">
              <button
                className={`yt-btn${selectedSid !== null ? ' active' : ''}`}
                title={selectedSid !== null ? 'Subtitles on' : 'Subtitles off'}
                onClick={e => { e.stopPropagation(); toggleSubtitles(); }}
              >
                <Captions size={20} />
              </button>

              <button
                className={`yt-btn${showAiPanel ? ' active' : (aiVideoOn || aiAudioOn) ? ' active' : ''}`}
                title="AI Enhance"
                onClick={e => {
                  e.stopPropagation();
                  setShowAiPanel(v => !v);
                  if (showMenu === 'settings') onSetShowMenu(null);
                }}
              >
                <Sparkles size={18} />
              </button>

              <button
                className={`yt-btn${showMenu === 'settings' ? ' active' : ''}`}
                title="Settings"
                onClick={e => {
                  e.stopPropagation();
                  if (showMenu === 'settings') { onSetShowMenu(null); } else { openMenu('main'); setShowAiPanel(false); }
                }}
              >
                <Settings size={18} style={{
                  transform: showMenu === 'settings' ? 'rotate(30deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }} />
              </button>

              <button className="yt-btn" title="Fullscreen (f)"
                onClick={e => { e.stopPropagation(); onToggleFullscreen(); }}>
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

// ── Skin class ────────────────────────────────────────────────────────────────

export class YouTubeSkin extends PlayerSkin {
  readonly id = 'youtube' as const;
  readonly name = 'YouTube';
  readonly description = 'Glass pill controls with red progress bar and nested settings panel.';

  readonly volumeBoostMax = 100;

  readonly keyMap: PlayerKeyMap = {
    togglePlay:              [' ', 'k'],
    seekBack:                ['ArrowLeft'],
    seekForward:             ['ArrowRight'],
    seekBackLarge:           ['j'],
    seekForwardLarge:        ['l'],
    volumeUp:                ['ArrowUp'],
    volumeDown:              ['ArrowDown'],
    toggleMute:              ['m'],
    toggleFullscreen:        ['f', 'F'],
    seekBackSeconds:         5,
    seekForwardSeconds:      5,
    seekBackLargeSeconds:    10,
    seekForwardLargeSeconds: 10,
  };

  renderControls(props: SkinControlsProps) {
    return (
      <YouTubeControls
        props={props}
        volumeMax={this.volumeMax}
        volumeBoostMax={this.volumeBoostMax}
        keyMap={this.keyMap}
      />
    );
  }
}
