import { useState } from 'react';
import { X } from 'lucide-react';
import type { Playlist } from '@shared/ipc';

export function EditPlaylistModal({
  playlist,
  onClose,
  onUpdate,
  busy
}: {
  playlist: Playlist;
  onClose(): void;
  onUpdate(id: number, name?: string, description?: string): void;
  busy: boolean;
}) {
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description || '');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Playlist</h3>
          <button className="close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <label htmlFor="edit-playlist-name">Playlist Name</label>
          <input
            id="edit-playlist-name"
            type="text"
            placeholder="Enter playlist name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <label htmlFor="edit-playlist-description">Description (optional)</label>
          <textarea
            id="edit-playlist-description"
            placeholder="Enter a description for your playlist"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button
            className="primary"
            onClick={() => {
              if (name.trim()) {
                onUpdate(playlist.id, name.trim(), description.trim() || undefined);
              }
            }}
            disabled={!name.trim() || busy}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
