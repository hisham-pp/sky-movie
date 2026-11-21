import { apiFetch } from './client';
import type {
  AddMagnetRequest,
  TorrentBufferProgress,
  TorrentGlobalStats,
  TorrentInfo,
  TorrentMoveRequest,
  TorrentProgressEvent,
  TorrentSearchRequest,
  TorrentSearchResult,
  TorrentSettings,
  TorrentStreamInfo,
  TorrentStreamProgressUpdate
} from '@/types';

export async function torrentSearch(req: TorrentSearchRequest): Promise<TorrentSearchResult[]> {
  return apiFetch<TorrentSearchResult[]>('/api/torrents/search', {
    method: 'POST',
    body: JSON.stringify(req)
  });
}

export async function torrentAddMagnet(req: AddMagnetRequest): Promise<TorrentInfo> {
  return apiFetch<TorrentInfo>('/api/torrents', {
    method: 'POST',
    body: JSON.stringify(req)
  });
}

export async function torrentPause(_id: string): Promise<void> {}
export async function torrentResume(_id: string): Promise<void> {}

export async function torrentRemove(id: string): Promise<void> {
  await apiFetch(`/api/torrents?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function torrentDeleteFiles(id: string): Promise<void> {
  await apiFetch(`/api/torrents?id=${encodeURIComponent(id)}&deleteFiles=true`, { method: 'DELETE' });
}

export async function torrentMove(_req: TorrentMoveRequest): Promise<void> {}

export async function torrentList(): Promise<TorrentInfo[]> {
  return apiFetch<TorrentInfo[]>('/api/torrents');
}

export async function torrentStats(): Promise<TorrentGlobalStats> {
  return apiFetch<TorrentGlobalStats>('/api/torrents/stats');
}

export async function torrentGetSettings(): Promise<TorrentSettings> {
  return apiFetch<TorrentSettings>('/api/torrents/settings');
}

export async function torrentUpdateSettings(settings: Partial<TorrentSettings>): Promise<TorrentSettings> {
  return apiFetch<TorrentSettings>('/api/torrents/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings)
  });
}

export async function torrentOpenFolder(_id: string): Promise<void> {}
export async function torrentRecheck(_id: string): Promise<void> {}

export async function torrentPrepareStream(id: string): Promise<TorrentStreamInfo> {
  return apiFetch<TorrentStreamInfo>(`/api/torrents/stream/${id}`);
}

export async function torrentCleanupStream(id: string): Promise<void> {
  await apiFetch(`/api/torrents/stream/${id}`, { method: 'DELETE' });
}

export async function torrentUpdateStreamProgress(_update: TorrentStreamProgressUpdate): Promise<void> {}

export async function torrentGetBufferProgress(_torrentId: string, _filePath: string): Promise<TorrentBufferProgress> {
  return { fileProgress: 1 };
}

export async function torrentSetPlaybackThrottle(_active: boolean): Promise<void> {}

export function onTorrentProgress(_callback: (event: TorrentProgressEvent) => void): () => void {
  return () => {};
}
