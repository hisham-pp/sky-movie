import { ListMusic, Plus } from 'lucide-react';
import type { Playlist } from '@shared/ipc';
import { Modal } from '../common';

export function PlaylistSelectorDialog({
  playlists,
  onSelect,
  onClose
}: {
  playlists: Playlist[];
  onSelect(playlistId: number): void;
  onClose(): void;
}) {
  return (
    <Modal isOpen={true} onClose={onClose} title="Add to Playlist" maxWidth="small">
      {playlists.length ? (
        <div className="playlist-selector-list">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              className="playlist-selector-item"
              onClick={() => onSelect(playlist.id)}
            >
              <ListMusic size={18} />
              <div className="playlist-selector-info">
                <strong>{playlist.name}</strong>
                <small>{playlist.itemCount} item{playlist.itemCount !== 1 ? 's' : ''}</small>
              </div>
              <Plus size={16} />
            </button>
          ))}
        </div>
      ) : (
        <div className="playlist-selector-empty">
          <ListMusic size={24} />
          <span>No playlists yet</span>
          <p>Create a playlist first to add items to it.</p>
        </div>
      )}
    </Modal>
  );
}
