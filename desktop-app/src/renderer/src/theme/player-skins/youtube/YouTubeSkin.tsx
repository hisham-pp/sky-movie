import React, { useEffect, useRef, useState } from 'react';
import './YouTubeSkin.css';
import {
  Play, Pause,
  Volume2, Volume1, VolumeX,
  Maximize, Minimize,
  Settings, Captions,
  ChevronRight, ChevronLeft,
  Check, Moon, Gauge, AudioWaveform, Mic2,
} from 'lucide-react';
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

const SPEED_MIN     = 0.25;
const SPEED_MAX     = 3.0;
const SPEED_STEP    = 0.25;
const SPEED_PRESETS = [1, 1.25, 1.5, 2, 3] as const;
const SLEEP_OPTIONS = [10, 15, 20, 30, 45, 60] as const;

type SettingsPage = 'main' | 'speed' | 'sub' | 'sleep' | 'audio';

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
  const [showRemaining,  setShowRemaining] = useState(false);
  const [seekOsdDir,     setSeekOsdDir]   = useState<'back' | 'forward' | null>(null);
  const [seekOsdAmt,     setSeekOsdAmt]   = useState(0);

  const volOsdTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekOsdTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPlaying = useRef(state.playing);
  const didMount      = useRef(false);

  useEffect(() => { latestPlaying.current = state.playing; }, [state.playing]);

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

  const openMenu = (page: SettingsPage = 'main') => {
    setPage(page);
    onSetShowMenu('settings');
  };

  const applySleep = (m: number | null) => {
    if (sleepTimer.current) clearTimeout(sleepTimer.current);
    setSleepMin(m);
    if (m !== null) {
      sleepTimer.current = setTimeout(() => {
        if (latestPlaying.current) onTogglePlay();
        setSleepMin(null);
      }, m * 60 * 1000);
    }
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
                <button className="yt-settings-item" onClick={() => setStableVol(v => !v)}>
                  <span className="yt-settings-item-icon"><AudioWaveform size={17} /></span>
                  <span className="yt-settings-item-label">Stable volume</span>
                  <button
                    className={`yt-toggle${stableVol ? ' on' : ''}`}
                    onClick={e => { e.stopPropagation(); setStableVol(v => !v); }}
                  />
                </button>

                <button className="yt-settings-item" onClick={() => setVoiceBoost(v => !v)}>
                  <span className="yt-settings-item-icon"><Mic2 size={17} /></span>
                  <span className="yt-settings-item-label">Voice boost</span>
                  <button
                    className={`yt-toggle${voiceBoost ? ' on' : ''}`}
                    onClick={e => { e.stopPropagation(); setVoiceBoost(v => !v); }}
                  />
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
                    {sleepMin === null ? 'Off' : `${sleepMin}m`}
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
              <span style={{ opacity: 0.45 }}>{formatTime(state.duration)}</span>
            </div>
          </div>

          {/* Right: CC · settings · fullscreen in single pill */}
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
                className={`yt-btn${showMenu === 'settings' ? ' active' : ''}`}
                title="Settings"
                onClick={e => {
                  e.stopPropagation();
                  if (showMenu === 'settings') { onSetShowMenu(null); } else { openMenu('main'); }
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
