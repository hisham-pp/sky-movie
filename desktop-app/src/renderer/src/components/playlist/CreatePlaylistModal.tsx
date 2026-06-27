import { memo, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Modal, ModalFooter, Button } from '../common';

export const CreatePlaylistModal = memo(function CreatePlaylistModal({
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

  const handleCreate = useCallback(() => {
    if (name.trim()) onCreate(name.trim(), description.trim() || undefined);
  }, [name, description, onCreate]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value), []);
  const handleDescChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value), []);

  return (
    <Modal isOpen={true} onClose={onClose} title="Create New Playlist" maxWidth="small">
      <div className="form-group">
        <label htmlFor="playlist-name">Playlist Name</label>
        <input
          id="playlist-name"
          type="text"
          placeholder="Enter playlist name"
          value={name}
          onChange={handleNameChange}
          autoFocus
        />
      </div>
      <div className="form-group">
        <label htmlFor="playlist-description">Description (optional)</label>
        <textarea
          id="playlist-description"
          placeholder="Enter a description for your playlist"
          value={description}
          onChange={handleDescChange}
          rows={3}
        />
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon={<Plus />} onClick={handleCreate} disabled={!name.trim() || busy}>
          Create Playlist
        </Button>
      </ModalFooter>
    </Modal>
  );
});
