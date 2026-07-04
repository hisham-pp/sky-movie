import { useState, useEffect } from 'react';
import { Switch } from '../common';
import { useTorrentSettings } from '../../hooks/useTorrent';
import type { TorrentSettings } from '@shared/ipc';

export function TorrentSettingsTab() {
  const { settings, saving, update } = useTorrentSettings();
  const [local, setLocal] = useState<TorrentSettings | null>(null);

  useEffect(() => { if (settings) setLocal({ ...settings }); }, [settings]);

  if (!local) {
    return (
      <div className="ts-settings-wrap">
        <div className="ts-settings-body">
          <p className="settings-empty">Loading…</p>
        </div>
      </div>
    );
  }

  const patch = <K extends keyof TorrentSettings>(key: K, value: TorrentSettings[K]) =>
    setLocal((prev) => prev ? { ...prev, [key]: value } : prev);

  const chooseFolder = async (key: 'downloadPath' | 'completedPath') => {
    const chosen = await window.skyMovie.chooseFolder('Choose directory');
    if (chosen) patch(key, chosen);
  };

  return (
    <div className="ts-settings-wrap">
      <div className="ts-settings-body">

        {/* ── Paths — full width ─────────────────────────────────── */}
        <div className="settings-section ts-full">
          <div className="settings-section-heading">
            <div><h3>Paths</h3><p>Where torrent files are saved on disk.</p></div>
          </div>
          <div className="ts-path-grid">
            <PathField
              label="Default download directory"
              value={local.downloadPath}
              onChange={(v) => patch('downloadPath', v)}
              onBrowse={() => chooseFolder('downloadPath')}
            />
            {local.moveCompleted && (
              <PathField
                label="Completed downloads folder"
                value={local.completedPath}
                onChange={(v) => patch('completedPath', v)}
                onBrowse={() => chooseFolder('completedPath')}
              />
            )}
          </div>
          <Switch
            id="ts-move"
            label="Move completed downloads to a separate folder"
            checked={local.moveCompleted}
            onChange={(v) => patch('moveCompleted', v)}
          />
        </div>

        {/* ── Queue ─────────────────────────────────────────────── */}
        <div className="settings-section">
          <div className="settings-section-heading">
            <div><h3>Queue</h3><p>Concurrent download limits.</p></div>
          </div>
          <div className="settings-form-grid">
            <InlineNumber label="Max simultaneous downloads" value={local.maxSimultaneousDownloads} min={1} max={20} onChange={(v) => patch('maxSimultaneousDownloads', v)} />
            <InlineNumber label="Max active torrents"        value={local.maxActiveTorrents}        min={1} max={50} onChange={(v) => patch('maxActiveTorrents', v)} />
          </div>
        </div>

        {/* ── Speed limits ──────────────────────────────────────── */}
        <div className="settings-section">
          <div className="settings-section-heading">
            <div><h3>Speed limits</h3><p>Bytes/s — 0 means unlimited.</p></div>
          </div>
          <div className="settings-form-grid">
            <InlineNumber label="Download limit (B/s)" value={local.downloadSpeedLimit} min={0} onChange={(v) => patch('downloadSpeedLimit', v)} />
            <InlineNumber label="Upload limit (B/s)"   value={local.uploadSpeedLimit}   min={0} onChange={(v) => patch('uploadSpeedLimit', v)} />
          </div>
        </div>

        {/* ── Protocol ──────────────────────────────────────────── */}
        <div className="settings-section">
          <div className="settings-section-heading">
            <div><h3>Protocol</h3><p>Network and connection settings.</p></div>
          </div>
          <div className="settings-form-grid">
            <div className="ts-toggle-grid">
              <Switch id="ts-dht" label="DHT"        checked={local.enableDht}          onChange={(v) => patch('enableDht', v)} />
              <Switch id="ts-pex" label="PEX"        checked={local.enablePex}          onChange={(v) => patch('enablePex', v)} />
              <Switch id="ts-lsd" label="LSD"        checked={local.enableLsd}          onChange={(v) => patch('enableLsd', v)} />
              <Switch id="ts-seq" label="Sequential" checked={local.sequentialDownload} onChange={(v) => patch('sequentialDownload', v)} />
            </div>
            <div className="ts-number-grid">
              <InlineNumber label="Port"            value={local.port}             min={1024} max={65535} onChange={(v) => patch('port', v)} />
              <InlineNumber label="Max connections"  value={local.maxConnections}  min={10}   max={1000}  onChange={(v) => patch('maxConnections', v)} />
              <InlineNumber label="Disk cache (MB)"  value={local.diskCacheSizeMb} min={16}   max={1024}  onChange={(v) => patch('diskCacheSizeMb', v)} />
            </div>
          </div>
        </div>

        {/* ── Behaviour ─────────────────────────────────────────── */}
        <div className="settings-section">
          <div className="settings-section-heading">
            <div><h3>Behaviour</h3><p>Automatic actions on download start / finish.</p></div>
          </div>
          <div className="settings-form-grid">
            <div className="ts-toggle-grid">
              <Switch id="ts-autostart"  label="Auto-start"          checked={local.autoStart}   onChange={(v) => patch('autoStart', v)} />
              <Switch id="ts-autoseed"   label="Auto-seed"           checked={local.autoSeed}    onChange={(v) => patch('autoSeed', v)} />
              <Switch id="ts-autodelete" label="Delete after seeding" checked={local.autoDelete} onChange={(v) => patch('autoDelete', v)} />
              {local.autoSeed && (
                <InlineNumber label="Stop at ratio (0 = never)" value={local.seedRatio} min={0} step={0.1} onChange={(v) => patch('seedRatio', v)} />
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── Sticky save bar ───────────────────────────────────────── */}
      <div className="ts-save-bar">
        <button
          onClick={() => update(local)}
          disabled={saving}
          className="settings-btn-primary"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function PathField({ label, value, onChange, onBrowse }: {
  label: string; value: string; onChange(v: string): void; onBrowse(): void;
}) {
  return (
    <div className="settings-field">
      <label className="settings-label">{label}</label>
      <div className="settings-path-row">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="settings-input"
        />
        <button className="settings-btn-ghost" onClick={onBrowse}>Browse</button>
      </div>
    </div>
  );
}

function InlineNumber({ label, value, onChange, min, max, step }: {
  label: string; value: number; onChange(v: number): void;
  min?: number; max?: number; step?: number;
}) {
  return (
    <div className="switch-row" style={{ justifyContent: 'space-between' }}>
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step ?? 1}
        onChange={(e) => onChange(Number(e.target.value))}
        className="settings-number-input"
      />
    </div>
  );
}
