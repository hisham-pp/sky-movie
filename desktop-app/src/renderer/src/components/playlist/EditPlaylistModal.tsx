import { useState } from 'react';
import { Save } from 'lucide-react';
import type { Playlist } from '@shared/ipc';
import { Modal, ModalFooter, Button } from '../common';

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

  const handleUpdate = () => {
    if (name.trim()) {
      onUpdate(playlist.id, name.trim(), description.trim() || undefined);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Playlist" maxWidth="small">
      <div className="form-group">
        <label htmlFor="edit-playlist-name">Playlist Name</label>
        <input
          id="edit-playlist-name"
          type="text"
          placeholder="Enter playlist name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="form-group">
        <label htmlFor="edit-playlist-description">Description (optional)</label>
        <textarea
          id="edit-playlist-description"
          placeholder="Enter a description for your playlist"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          icon={<Save />}
          onClick={handleUpdate}
          disabled={!name.trim() || busy}
        >
          Save Changes
        </Button>
      </ModalFooter>
    </Modal>
  );
}
