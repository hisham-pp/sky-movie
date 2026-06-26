import React, { useEffect, useRef, useState } from 'react';
import './DefaultSkin.css';
import {
  Pause, Play,
  Volume2, VolumeX,
  Maximize, Minimize,
  Settings, ChevronDown,
  RotateCcw, RotateCw
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
  const volOsdTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didMount     = useRef(false);

  // Show top-left volume OSD whenever volume changes (keyboard / scroll wheel)
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    if (state.muted) return;
    setVolOsd(true);
    if (volOsdTimer.current) clearTimeout(volOsdTimer.current);
    volOsdTimer.current = setTimeout(() => setVolOsd(false), 1800);
  }, [state.volume, state.muted]);

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

          {/* Right: settings (speed + audio + subtitles) · fullscreen */}
          <div className="default-right">

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
