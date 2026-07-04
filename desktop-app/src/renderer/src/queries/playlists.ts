import { bind } from './client';

export const getPlaylists = bind('getPlaylists');
export const getPlaylistById = bind('getPlaylistById');
export const createPlaylist = bind('createPlaylist');
export const updatePlaylist = bind('updatePlaylist');
export const deletePlaylist = bind('deletePlaylist');
export const addToPlaylist = bind('addToPlaylist');
export const removeFromPlaylist = bind('removeFromPlaylist');
export const reorderPlaylistItem = bind('reorderPlaylistItem');
