import { useState } from 'react';
import { X, Plus } from 'lucide-react';

export function CreatePlaylistModal({
  onClose,
  onCreate,
  busy
}: {
  onClose(): void;
  onCreate(name: string, description?: string): void;
  busy: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Playlist</h3>
          <button className="close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <label htmlFor="playlist-name">Playlist Name</label>
          <input
            id="playlist-name"
            type="text"
            placeholder="Enter playlist name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <label htmlFor="playlist-description">Description (optional)</label>
          <textarea
            id="playlist-description"
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
                onCreate(name.trim(), description.trim() || undefined);
              }
            }}
            disabled={!name.trim() || busy}
          >
            <Plus size={16} />
            Create Playlist
          </button>
        </div>
      </div>
    </div>
  );
}
