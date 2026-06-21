import { ListMusic, Plus, X } from 'lucide-react';
import type { Playlist } from '@shared/ipc';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content playlist-selector" onClick={(e) => e.stopPropagation()}>
        <div className="playlist-selector-header">
          <h3>Add to Playlist</h3>
          <button className="close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
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
      </div>
    </div>
  );
}
