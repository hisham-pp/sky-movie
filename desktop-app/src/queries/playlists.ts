import { apiFetch } from './client';
import type {
  AddToPlaylistRequest,
  CreatePlaylistRequest,
  Playlist,
  PlaylistItem,
  RemoveFromPlaylistRequest,
  UpdatePlaylistRequest
} from '@/types';

export async function getPlaylists(): Promise<Playlist[]> {
  return apiFetch<Playlist[]>('/api/playlists');
}

export async function getPlaylistById(id: number): Promise<PlaylistItem[]> {
  return apiFetch<PlaylistItem[]>(`/api/playlists/${id}`);
}

export async function createPlaylist(request: CreatePlaylistRequest): Promise<Playlist> {
  return apiFetch<Playlist>('/api/playlists', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}

export async function updatePlaylist(request: UpdatePlaylistRequest): Promise<Playlist> {
  return apiFetch<Playlist>(`/api/playlists/${request.id}`, {
    method: 'PATCH',
    body: JSON.stringify(request)
  });
}

export async function deletePlaylist(id: number): Promise<void> {
  await apiFetch(`/api/playlists/${id}`, { method: 'DELETE' });
}

export async function addToPlaylist(request: AddToPlaylistRequest): Promise<void> {
  await apiFetch(`/api/playlists/${request.playlistId}/items`, {
    method: 'POST',
    body: JSON.stringify(request)
  });
}

export async function removeFromPlaylist(request: RemoveFromPlaylistRequest): Promise<void> {
  await apiFetch(`/api/playlists/${request.playlistId}/items/${request.itemId}`, {
    method: 'DELETE'
  });
}

export async function reorderPlaylistItem(playlistId: number, itemId: number, newSortOrder: number): Promise<void> {
  await apiFetch(`/api/playlists/${playlistId}/reorder`, {
    method: 'POST',
    body: JSON.stringify({ itemId, newSortOrder })
  });
}
