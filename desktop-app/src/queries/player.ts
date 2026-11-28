import { apiFetch } from './client';
import type {
  LastWatchedInfo,
  MpvEvent,
  MpvOpenRequest,
  MpvTrack,
  PlayMediaResult,
  WatchHistoryItem,
  WatchProgressUpdate
} from '@/types';

export async function playMedia(mediaFileId: number): Promise<PlayMediaResult> {
  return apiFetch<PlayMediaResult>(`/api/media/${mediaFileId}/play`);
}

export async function openMediaExternally(mediaFileId: number): Promise<void> {
  await apiFetch(`/api/media/${mediaFileId}/external`, { method: 'POST' });
}

export async function updateWatchProgress(update: WatchProgressUpdate): Promise<void> {
  await apiFetch('/api/watch/progress', {
    method: 'POST',
    body: JSON.stringify(update)
  });
}

export async function getLastWatched(): Promise<LastWatchedInfo | null> {
  return apiFetch<LastWatchedInfo | null>('/api/watch/last');
}

export async function getWatchHistory(): Promise<WatchHistoryItem[]> {
  return apiFetch<WatchHistoryItem[]>('/api/watch/history');
}

export async function clearWatchHistory(): Promise<void> {
  await apiFetch('/api/watch/history', { method: 'DELETE' });
}

export async function deleteWatchHistoryItem(mediaFileId: number): Promise<void> {
  await apiFetch(`/api/watch/history/${mediaFileId}`, { method: 'DELETE' });
}

// mpv player fallback stubs (web runtime uses Artplayer directly)
export async function mpvIsAvailable(): Promise<boolean> {
  return false;
}
export async function mpvOpen(_req: MpvOpenRequest): Promise<void> {}
export async function mpvClose(): Promise<void> {}
export async function mpvPlay(): Promise<void> {}
export async function mpvPause(): Promise<void> {}
export async function mpvSeek(_s: number): Promise<void> {}
export async function mpvSetVolume(_v: number): Promise<void> {}
export async function mpvSetAudioTrack(_id: number): Promise<void> {}
export async function mpvSetSubTrack(_id: number): Promise<void> {}
export async function mpvSetSpeed(_s: number): Promise<void> {}
export async function mpvSetRenderSize(_w: number, _h: number): Promise<void> {}
export async function mpvSetSubFile(_p: string): Promise<void> {}
export async function mpvSetAudioFilter(_f: string): Promise<void> {}
export function onMpvFrame(_cb: (rgba: Uint8Array, width: number, height: number) => void): () => void {
  return () => {};
}
export function onMpvEvent(_cb: (ev: MpvEvent) => void): () => void {
  return () => {};
}
export function onMpvTracks(_cb: (tracks: MpvTrack[]) => void): () => void {
  return () => {};
}
