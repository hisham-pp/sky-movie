import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal, ModalFooter, Button } from '../common';

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

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim(), description.trim() || undefined);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Create New Playlist" maxWidth="small">
      <div className="form-group">
        <label htmlFor="playlist-name">Playlist Name</label>
        <input
          id="playlist-name"
          type="text"
          placeholder="Enter playlist name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="form-group">
        <label htmlFor="playlist-description">Description (optional)</label>
        <textarea
          id="playlist-description"
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
          icon={<Plus />}
          onClick={handleCreate}
          disabled={!name.trim() || busy}
        >
          Create Playlist
        </Button>
      </ModalFooter>
    </Modal>
  );
}
