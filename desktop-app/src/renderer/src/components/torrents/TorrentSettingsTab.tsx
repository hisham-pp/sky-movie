import { useState, useEffect } from 'react';
import { Save, FolderOpen } from 'lucide-react';
import { useTorrentSettings } from '../../hooks/useTorrent';
import type { TorrentSettings } from '@shared/ipc';

export function TorrentSettingsTab() {
  const { settings, saving, update } = useTorrentSettings();
  const [local, setLocal] = useState<TorrentSettings | null>(null);

  useEffect(() => { if (settings) setLocal({ ...settings }); }, [settings]);

  if (!local) {
    return <div className="flex items-center justify-center h-full text-white/30 text-sm">Loading settings…</div>;
  }

  const patch = <K extends keyof TorrentSettings>(key: K, value: TorrentSettings[K]) =>
    setLocal((prev) => prev ? { ...prev, [key]: value } : prev);

  const handleSave = () => update(local);

  const chooseFolder = async (key: 'downloadPath' | 'completedPath') => {
    const chosen = await window.skyMovie.chooseFolder('Choose directory');
    if (chosen) patch(key, chosen);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

        <Section title="Paths">
          <FolderField
            label="Default download directory"
            value={local.downloadPath}
            onChange={(v) => patch('downloadPath', v)}
            onBrowse={() => chooseFolder('downloadPath')}
          />
          <div className="flex items-center gap-3 mt-3">
            <Toggle
              label="Move completed downloads"
              checked={local.moveCompleted}
              onChange={(v) => patch('moveCompleted', v)}
            />
          </div>
          {local.moveCompleted && (
            <FolderField
              label="Completed downloads directory"
              value={local.completedPath}
              onChange={(v) => patch('completedPath', v)}
              onBrowse={() => chooseFolder('completedPath')}
            />
          )}
        </Section>

        <Section title="Queue">
          <NumberField label="Max simultaneous downloads" value={local.maxSimultaneousDownloads} onChange={(v) => patch('maxSimultaneousDownloads', v)} min={1} max={20} />
          <NumberField label="Max active torrents" value={local.maxActiveTorrents} onChange={(v) => patch('maxActiveTorrents', v)} min={1} max={50} />
        </Section>

        <Section title="Speed Limits (0 = unlimited, bytes/s)">
          <NumberField label="Download speed limit" value={local.downloadSpeedLimit} onChange={(v) => patch('downloadSpeedLimit', v)} min={0} />
          <NumberField label="Upload speed limit" value={local.uploadSpeedLimit} onChange={(v) => patch('uploadSpeedLimit', v)} min={0} />
        </Section>

        <Section title="Protocol">
          <Toggle label="Enable DHT"             checked={local.enableDht}  onChange={(v) => patch('enableDht', v)} />
          <Toggle label="Enable PEX"             checked={local.enablePex}  onChange={(v) => patch('enablePex', v)} />
          <Toggle label="Enable LSD"             checked={local.enableLsd}  onChange={(v) => patch('enableLsd', v)} />
          <Toggle label="Sequential download"    checked={local.sequentialDownload} onChange={(v) => patch('sequentialDownload', v)} />
          <NumberField label="Port" value={local.port} onChange={(v) => patch('port', v)} min={1024} max={65535} />
          <NumberField label="Max connections"   value={local.maxConnections} onChange={(v) => patch('maxConnections', v)} min={10} max={1000} />
          <NumberField label="Disk cache (MB)"   value={local.diskCacheSizeMb} onChange={(v) => patch('diskCacheSizeMb', v)} min={16} max={1024} />
        </Section>

        <Section title="Behaviour">
          <Toggle label="Auto start downloads"   checked={local.autoStart}   onChange={(v) => patch('autoStart', v)} />
          <Toggle label="Auto seed after done"   checked={local.autoSeed}    onChange={(v) => patch('autoSeed', v)} />
          {local.autoSeed && (
            <NumberField label="Seed ratio limit (0 = no limit)" value={local.seedRatio} onChange={(v) => patch('seedRatio', v)} min={0} step={0.1} />
          )}
          <Toggle label="Auto delete after seeding" checked={local.autoDelete} onChange={(v) => patch('autoDelete', v)} />
        </Section>

      </div>

      <div className="flex justify-end px-5 py-3 border-t border-white/5">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-50 text-white text-sm font-medium transition-all"
        >
          <Save size={14} />
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange(v: boolean): void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-[var(--color-primary)]' : 'bg-white/10'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
    </label>
  );
}

function NumberField({ label, value, onChange, min, max, step }: {
  label: string; value: number; onChange(v: number): void;
  min?: number; max?: number; step?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-white/60">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step ?? 1}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-28 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-sm text-white/80 text-right focus:outline-none focus:border-white/25 transition-colors"
      />
    </div>
  );
}

function FolderField({ label, value, onChange, onBrowse }: {
  label: string; value: string; onChange(v: string): void; onBrowse(): void;
}) {
  return (
    <div>
      <label className="text-xs text-white/40 mb-1 block">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/70 focus:outline-none focus:border-white/25 transition-colors font-mono text-xs"
        />
        <button
          onClick={onBrowse}
          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
        >
          <FolderOpen size={14} />
        </button>
      </div>
    </div>
  );
}
