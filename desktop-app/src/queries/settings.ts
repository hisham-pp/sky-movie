import { apiFetch } from './client';
import type {
  AppSettings,
  BackupResult,
  ClearLocalDataResult,
  SyncRequest,
  SyncResult,
  UpdateCheckResult,
  UpdateProgressEvent,
  UpdateStatus,
  YouTubeProgressEvent
} from '@/types';

export async function getSettings(): Promise<AppSettings> {
  return apiFetch<AppSettings>('/api/settings');
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  return apiFetch<AppSettings>('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings)
  });
}

export async function clearLocalLibraryData(): Promise<ClearLocalDataResult> {
  return apiFetch<ClearLocalDataResult>('/api/maintenance/clear', { method: 'POST' });
}

export async function createBackup(destinationPath?: string): Promise<BackupResult | null> {
  return apiFetch<BackupResult>('/api/backup/create', {
    method: 'POST',
    body: JSON.stringify({ destinationPath })
  });
}

export async function restoreBackup(path?: string): Promise<BackupResult | null> {
  return apiFetch<BackupResult>('/api/backup/restore', {
    method: 'POST',
    body: JSON.stringify({ path })
  });
}

export async function exportLibrary(request?: SyncRequest): Promise<SyncResult | null> {
  return apiFetch<SyncResult>('/api/sync/export', {
    method: 'POST',
    body: JSON.stringify(request ?? {})
  });
}

export async function importLibrary(path?: string): Promise<SyncResult | null> {
  return apiFetch<SyncResult>('/api/sync/import', {
    method: 'POST',
    body: JSON.stringify({ path })
  });
}

export async function syncLibrary(request: SyncRequest): Promise<SyncResult | null> {
  return apiFetch<SyncResult>('/api/sync/sync', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}

// Update stubs for Web runtime
export async function checkForUpdates(): Promise<UpdateCheckResult> {
  return {
    hasUpdate: false,
    currentVersion: '0.11.2',
    latestVersion: '0.11.2',
    releaseInfo: null
  };
}
export async function downloadUpdate(): Promise<void> {}
export async function installUpdate(): Promise<void> {}
export async function getUpdateStatus(): Promise<UpdateStatus> {
  return 'idle';
}
export async function dismissUpdateNotification(): Promise<void> {}
export function onUpdateProgress(_cb: (event: UpdateProgressEvent) => void): () => void {
  return () => {};
}

export async function openExternalUrl(url: string): Promise<void> {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export async function downloadYouTubeVideo(_req: { url: string; folderPath: string }): Promise<void> {}
export function onYouTubeDownloadProgress(_cb: (event: YouTubeProgressEvent) => void): () => void {
  return () => {};
}
