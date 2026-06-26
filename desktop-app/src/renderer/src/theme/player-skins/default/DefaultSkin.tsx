import React, { useEffect, useRef, useState } from 'react';
import './DefaultSkin.css';
import {
  Pause, Play,
  Volume2, VolumeX,
  Maximize, Minimize,
  Settings, Sparkles,
  RotateCcw, RotateCw
} from 'lucide-react';
import { VideoEnhancer } from '../../../utils/player/videoEnhancer';
import type { VideoEnhancerParams } from '../../../utils/player/videoEnhancer';
import { PlayerSkin } from '../PlayerSkin';
import type { PlayerKeyMap, SkinControlsProps } from '../PlayerSkin';

function formatTime(secs: number): string {
  if (!Number.isFinite(secs) || secs < 0) return '0:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── Stateful controls component ───────────────────────────────────────────────

function DefaultControls({
  props,
  volumeMax,
  volumeBoostMax,
  keyMap
}: {
  props: SkinControlsProps;
  volumeMax: number;
  volumeBoostMax: number;
  keyMap: PlayerKeyMap;
}) {
  const {
    state, tracks, isVisible, seekOsdVisible, isFullscreen, showMenu, sidecarSubtitles,
    onTogglePlay, onToggleMute, onChangeVolume, onToggleFullscreen,
    onSeekTo, onSetSpeed, onSetAudioTrack, onSetSubTrack, onSetSubFile,
    onSetShowMenu, onSeekBarDown, onSeekBarMove, onSeekBarUp
  } = props;

  const [volOsd,      setVolOsd]     = useState(false);
  const [volExpanded, setVolExpand]  = useState(false);
  // Enhancement state
  const [brightness,  setBrightness] = useState(100);
  const [contrast,    setContrast]   = useState(100);
  const [saturation,  setSaturation] = useState(100);
  const [bassBoost,   setBassBoost]  = useState(false);
  const [trebleBoost, setTrebleBoost] = useState(false);
  const [voiceBoost,  setVoiceBoost] = useState(false);
  const [stableVol,   setStableVol]  = useState(false);

  const volOsdTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didMount     = useRef(false);

  const audioRef = useRef<{
    ctx: AudioContext;
    bass: BiquadFilterNode;
    treble: BiquadFilterNode;
    voice: BiquadFilterNode;
    compressor: DynamicsCompressorNode;
  } | null>(null);
  // AI enhance state
  const [showAiPanel,    setShowAiPanel]  = useState(false);
  const [aiVideoOn,      setAiVideoOn]    = useState(false);
  const [aiAudioOn,      setAiAudioOn]    = useState(false);
  const [aiSharpness,    setAiSharpness]  = useState(55);
  const [aiDenoise,      setAiDenoise]    = useState(35);
  const [aiColorBoost,   setAiColorBoost] = useState(30);
  const videoEnhancerRef = useRef<VideoEnhancer | null>(null);

  // Show top-left volume OSD whenever volume changes (keyboard / scroll wheel)
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    if (state.muted) return;
    setVolOsd(true);
    if (volOsdTimer.current) clearTimeout(volOsdTimer.current);
    volOsdTimer.current = setTimeout(() => setVolOsd(false), 1800);
  }, [state.volume, state.muted]);

  // Single combined filter effect (AI sharpening SVG + manual CSS sliders)
  useEffect(() => {
    const enhancer = videoEnhancerRef.current;
    if (aiVideoOn) {
      enhancer?.ensureFilter();
      enhancer?.updateParams({ sharpness: aiSharpness / 100, denoise: aiDenoise / 100, colorBoost: aiColorBoost / 100 });
    } else {
      enhancer?.remove();
      if (enhancer) videoEnhancerRef.current = new VideoEnhancer();
    }
    const filterStr = VideoEnhancer.buildFilterString(
      aiVideoOn, aiColorBoost / 100, brightness, contrast, saturation,
    );
    const els = document.querySelectorAll<HTMLElement>('.player canvas, .player video');
    els.forEach(el => { el.style.filter = filterStr || ''; });
    return () => { els.forEach(el => { el.style.filter = ''; }); };
  }, [aiVideoOn, aiSharpness, aiDenoise, aiColorBoost, brightness, contrast, saturation]);

  // Web Audio setup
  useEffect(() => {
    const videoEl = document.querySelector<HTMLVideoElement>('.player video');
    if (!videoEl) return;
    try {
      const ctx = new AudioContext();
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
    } catch { /* MPV path */ }
    return () => { if (audioRef.current) { audioRef.current.ctx.close(); audioRef.current = null; } };
  }, []);

  useEffect(() => { if (audioRef.current) { audioRef.current.ctx.resume(); audioRef.current.bass.gain.value = bassBoost ? 8 : 0; } }, [bassBoost]);
  useEffect(() => { if (audioRef.current) { audioRef.current.ctx.resume(); audioRef.current.treble.gain.value = trebleBoost ? 6 : 0; } }, [trebleBoost]);
  useEffect(() => { if (audioRef.current) { audioRef.current.ctx.resume(); audioRef.current.voice.gain.value = voiceBoost ? 6 : 0; } }, [voiceBoost]);
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.ctx.resume();
    const { compressor } = audioRef.current;
    if (stableVol) { compressor.threshold.value = -24; compressor.knee.value = 30; compressor.ratio.value = 4; }
    else { compressor.threshold.value = 0; compressor.ratio.value = 1; }
  }, [stableVol]);

  // Initialize VideoEnhancer instance on mount
  useEffect(() => {
    if (!videoEnhancerRef.current) videoEnhancerRef.current = new VideoEnhancer();
    return () => { videoEnhancerRef.current?.remove(); videoEnhancerRef.current = null; };
  }, []);

  // AI Audio enhance preset
  useEffect(() => {
    if (!audioRef.current) return;
    const { ctx, bass, treble, voice, compressor } = audioRef.current;
    ctx.resume();
    if (aiAudioOn) {
      bass.gain.value   = bassBoost   ? 8 : 5;
      treble.gain.value = trebleBoost ? 6 : 4;
      voice.gain.value  = voiceBoost  ? 6 : 3;
      compressor.threshold.value = -20; compressor.knee.value = 25; compressor.ratio.value = 3.5;
    } else {
      bass.gain.value   = bassBoost   ? 8 : 0;
      treble.gain.value = trebleBoost ? 6 : 0;
      voice.gain.value  = voiceBoost  ? 6 : 0;
      if (!stableVol) { compressor.threshold.value = 0; compressor.ratio.value = 1; }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiAudioOn]);

  const totalMax   = volumeMax + volumeBoostMax;
  const progress   = state.duration > 0 ? state.position / state.duration : 0;
  const audioTracks  = tracks.filter(t => t.type === 'audio');
  const subTracks    = tracks.filter(t => t.type === 'sub');
  const selectedAid  = tracks.find(t => t.type === 'audio' && t.selected)?.id ?? null;
  const selectedSid  = tracks.find(t => t.type === 'sub'   && t.selected)?.id ?? null;
  const displayVol   = state.muted ? 0 : Math.round(state.volume);
  const boostAmount  = !state.muted && state.volume > volumeMax ? Math.round(state.volume - volumeMax) : 0;

  return (
    <>
      {/* Top-left volume OSD — appears on keyboard / scroll volume change */}
      <div className={`default-vol-osd${volOsd ? ' visible' : ''}`}>
        {state.muted || state.volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        <span>{displayVol}</span>
        {boostAmount > 0 && <span className="default-boost-label">+{boostAmount}</span>}
      </div>

      {/* Seek OSD — thin progress + time shown when seeking without controls visible */}
      {seekOsdVisible && (
        <>
          <div className="default-seek-osd-time">
            {formatTime(state.position)} / {formatTime(state.duration)}
          </div>
          <div className="default-seek-osd-bar">
            <div
              className="default-seek-osd-fill"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </>
      )}

      {/* Controls overlay */}
      <div className={`default-controls${isVisible ? ' visible' : ''}`}>

        {/* Seek bar */}
        <div
          className="default-seek"
          onPointerDown={onSeekBarDown}
          onPointerMove={onSeekBarMove}
          onPointerUp={onSeekBarUp}
        >
          <div className="default-seek-track">
            <div className="default-seek-fill" style={{ width: `${progress * 100}%` }} />
            <div className="default-seek-thumb" style={{ left: `${progress * 100}%` }} />
          </div>
        </div>

        {/* Bottom row */}
        <div className="default-bottom">

          {/* Left: mute · hover-expand volume slider · volume number · boost · time */}
          <div className="default-left">
            <div
              className={`default-volume-group${volExpanded ? ' expanded' : ''}`}
              onMouseEnter={() => setVolExpand(true)}
              onMouseLeave={() => setVolExpand(false)}
            >
              <button className="default-btn" onClick={onToggleMute} title="Mute (M)">
                {state.muted || state.volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <div className="default-volume-expand">
                <input
                  className="default-volume-slider"
                  type="range"
                  min={0}
                  max={totalMax}
                  step={1}
                  value={displayVol}
                  style={{ '--vol': `${(displayVol / totalMax) * 100}%` } as React.CSSProperties}
                  onChange={e => onChangeVolume(Number(e.target.value))}
                />
              </div>
            </div>

            {volExpanded && (
              <>
                <span className="default-vol-label">{displayVol}/{volumeMax}</span>
                {boostAmount > 0 && (
                  <span className="default-boost-label">+{boostAmount} boost</span>
                )}
              </>
            )}

            <span className="default-time">
              {formatTime(state.position)} / {formatTime(state.duration)}
            </span>
          </div>

          {/* Center: −Ns · play/pause · +Ns */}
          <div className="default-center">
            <button
              className="default-btn default-skip-btn"
              onClick={() => onSeekTo(Math.max(0, state.position - keyMap.seekBackLargeSeconds))}
              title={`Rewind ${keyMap.seekBackLargeSeconds}s`}
            >
              <span className="default-skip-inner">
                <RotateCcw size={18} />
                <span className="default-skip-label">{keyMap.seekBackLargeSeconds}</span>
              </span>
            </button>

            <button
              className="default-btn default-play-btn"
              onClick={onTogglePlay}
              title={state.playing ? 'Pause (Space)' : 'Play (Space)'}
            >
              {state.playing ? <Pause size={22} /> : <Play size={22} />}
            </button>

            <button
              className="default-btn default-skip-btn"
              onClick={() => onSeekTo(state.position + keyMap.seekForwardLargeSeconds)}
              title={`Forward ${keyMap.seekForwardLargeSeconds}s`}
            >
              <span className="default-skip-inner">
                <RotateCw size={18} />
                <span className="default-skip-label">{keyMap.seekForwardLargeSeconds}</span>
              </span>
            </button>
          </div>

          {/* Right: settings (speed + audio + subtitles) · AI enhance · fullscreen */}
          <div className="default-right">

            {/* AI Enhance panel */}
            {showAiPanel && (
              <div
                className="default-ai-panel"
                onClick={e => e.stopPropagation()}
                onPointerDown={e => e.stopPropagation()}
              >
                <div className="default-ai-header">
                  <Sparkles size={13} />
                  <span>AI Enhance</span>
                </div>
                <div className="default-ai-body">
                  <div className="default-ai-row">
                    <span className="default-ai-label">Video</span>
                    <span
                      className={`default-toggle${aiVideoOn ? ' on' : ''}`}
                      onClick={() => setAiVideoOn(v => !v)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                  {aiVideoOn && ([
                    { label: 'Sharpness', val: aiSharpness,  set: setAiSharpness  },
                    { label: 'Denoise',   val: aiDenoise,    set: setAiDenoise    },
                    { label: 'Vivid',     val: aiColorBoost, set: setAiColorBoost },
                  ] as const).map(({ label, val, set }) => (
                    <div key={label} className="default-enhance-row" style={{ padding: '3px 0' }}>
                      <span className="default-enhance-name" style={{ width: 60, fontSize: 11 }}>{label}</span>
                      <input
                        type="range" min={0} max={100} step={1} value={val}
                        className="default-enhance-range"
                        style={{ '--pct': `${val}%` } as React.CSSProperties}
                        onChange={e => set(Number(e.target.value))}
                      />
                      <span className="default-enhance-val">{val}</span>
                    </div>
                  ))}
                  <div className="default-ai-row" style={{ marginTop: 6 }}>
                    <span className="default-ai-label">Audio</span>
                    <span
                      className={`default-toggle${aiAudioOn ? ' on' : ''}`}
                      onClick={() => setAiAudioOn(v => !v)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* AI button */}
            <button
              className={`default-btn${aiVideoOn || aiAudioOn ? ' default-btn-active' : ''}`}
              title="AI Enhance"
              onClick={e => { e.stopPropagation(); setShowAiPanel(v => !v); }}
            >
              <Sparkles size={15} />
            </button>

            {/* Combined settings panel */}
            <div className="default-menu-wrap">
              <button
                className="default-btn"
                onClick={e => { e.stopPropagation(); onSetShowMenu(showMenu === 'settings' ? null : 'settings'); }}
                title="Settings"
              >
                <Settings size={16} />
              </button>
              {showMenu === 'settings' && (
                <div className="default-menu default-settings-panel">

                  {/* Speed */}
                  <div className="default-settings-section">
                    <span className="default-settings-label">Speed</span>
                    <div className="default-settings-row">
                      {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(s => (
                        <button
                          key={s}
                          className={`default-settings-chip${state.speed === s ? ' active' : ''}`}
                          onClick={() => onSetSpeed(s)}
                        >
                          {s}×
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Audio tracks */}
                  {audioTracks.length > 0 && (
                    <div className="default-settings-section">
                      <span className="default-settings-label">Audio</span>
                      {audioTracks.map(t => (
                        <button
                          key={t.id}
                          className={`default-menu-item${t.id === selectedAid ? ' active' : ''}`}
                          onClick={() => { onSetAudioTrack(t.id); onSetShowMenu(null); }}
                        >
                          {t.title || t.lang || `Track ${t.id}`}
                          {t.codec ? ` (${t.codec})` : ''}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Subtitles */}
                  <div className="default-settings-section">
                    <span className="default-settings-label">Subtitles</span>
                    <button
                      className={`default-menu-item${selectedSid === null ? ' active' : ''}`}
                      onClick={() => { onSetSubTrack(0); onSetShowMenu(null); }}
                    >
                      Off
                    </button>
                    {subTracks.map(t => (
                      <button
                        key={t.id}
                        className={`default-menu-item${t.id === selectedSid ? ' active' : ''}`}
                        onClick={() => { onSetSubTrack(t.id); onSetShowMenu(null); }}
                      >
                        {t.title || t.lang || `Sub ${t.id}`}
                      </button>
                    ))}
                    {sidecarSubtitles.map((s, i) => (
                      <button
                        key={`sc-${i}`}
                        className="default-menu-item"
                        onClick={() => {
                          const path = s.url.startsWith('file:///')
                            ? decodeURIComponent(s.url.slice(8).replace(/\//g, '\\'))
                            : s.url;
                          onSetSubFile(path);
                          onSetShowMenu(null);
                        }}
                      >
                        {s.label} (external)
                      </button>
                    ))}
                  </div>

                  {/* Enhancement */}
                  <div className="default-settings-section">
                    <span className="default-settings-label">Video</span>
                    {([
                      { label: 'Brightness', val: brightness, set: setBrightness, min: 50, max: 150 },
                      { label: 'Contrast',   val: contrast,   set: setContrast,   min: 50, max: 150 },
                      { label: 'Saturation', val: saturation, set: setSaturation, min: 0,  max: 200 },
                    ] as const).map(({ label, val, set, min, max }) => (
                      <div key={label} className="default-enhance-row">
                        <span className="default-enhance-name">{label}</span>
                        <input
                          type="range" min={min} max={max} step={1} value={val}
                          className="default-enhance-range"
                          style={{ '--pct': `${((val - min) / (max - min)) * 100}%` } as React.CSSProperties}
                          onChange={e => set(Number(e.target.value))}
                        />
                        <span className="default-enhance-val">{val}%</span>
                      </div>
                    ))}
                    <button
                      className="default-enhance-reset"
                      onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }}
                    >
                      Reset
                    </button>
                  </div>

                  <div className="default-settings-section">
                    <span className="default-settings-label">Audio</span>
                    {([
                      { label: 'Bass boost',    val: bassBoost,   set: setBassBoost },
                      { label: 'Treble boost',  val: trebleBoost, set: setTrebleBoost },
                      { label: 'Voice boost',   val: voiceBoost,  set: setVoiceBoost },
                      { label: 'Stable volume', val: stableVol,   set: setStableVol },
                    ] as const).map(({ label, val, set }) => (
                      <button
                        key={label}
                        className={`default-menu-item default-enhance-toggle${val ? ' active' : ''}`}
                        onClick={() => set(v => !v)}
                      >
                        <span>{label}</span>
                        <span className={`default-toggle${val ? ' on' : ''}`} />
                      </button>
                    ))}
                  </div>

                </div>
              )}
            </div>

            <button className="default-btn" onClick={onToggleFullscreen} title="Fullscreen (F)">
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Skin class ────────────────────────────────────────────────────────────────

export class DefaultSkin extends PlayerSkin {
  readonly id = 'default' as const;
  readonly name = 'Default';
  readonly description = 'Standard controls with seek bar, volume, track selection and fullscreen toggle.';

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
    seekForwardLargeSeconds: 10
  };

  renderControls(props: SkinControlsProps) {
    return (
      <DefaultControls
        props={props}
        volumeMax={this.volumeMax}
        volumeBoostMax={this.volumeBoostMax}
        keyMap={this.keyMap}
      />
    );
  }
}
