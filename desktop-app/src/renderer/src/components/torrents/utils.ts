export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`;
}

export function formatEta(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '∞';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    metadata:    'Getting metadata…',
    downloading: 'Downloading',
    paused:      'Paused',
    queued:      'Queued',
    checking:    'Checking',
    stalled:     'Stalled',
    completed:   'Completed',
    error:       'Error',
  };
  return map[status] ?? status;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    downloading: 'text-emerald-400',
    completed:   'text-blue-400',
    paused:      'text-yellow-400',
    error:       'text-red-400',
    stalled:     'text-orange-400',
    metadata:    'text-purple-400',
    queued:      'text-slate-400',
    checking:    'text-cyan-400',
  };
  return map[status] ?? 'text-slate-400';
}
