import { useState } from 'react';
import { ArrowLeft, ListMusic, Plus, Trash2, Edit2, X, Film, Tv, GripVertical } from 'lucide-react';
import type { Playlist, PlaylistItem, Movie, TvShow } from '@shared/ipc';

export function PlaylistView({
  playlists,
  selectedPlaylist,
  playlistItems,
  selectedTitle,
  busy,
  onSelectPlaylist,
  onCreatePlaylist,
  onUpdatePlaylist,
  onDeletePlaylist,
  onRemoveFromPlaylist,
  onReorderPlaylistItem,
  onBackToLibrary,
  onSelectMovie,
  onSelectShow
}: {
  playlists: Playlist[];
  selectedPlaylist: Playlist | null;
  playlistItems: PlaylistItem[];
  selectedTitle: string;
  busy: boolean;
  onSelectPlaylist(playlist: Playlist): void;
  onCreatePlaylist(name: string, description?: string): void;
  onUpdatePlaylist(id: number, name?: string, description?: string): void;
  onDeletePlaylist(id: number): void;
  onRemoveFromPlaylist(playlistId: number, itemId: number): void;
  onReorderPlaylistItem(playlistId: number, itemId: number, newSortOrder: number): void;
  onBackToLibrary(): void;
  onSelectMovie(movie: Movie): void;
  onSelectShow(show: TvShow): void;
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  if (selectedPlaylist) {
    return (
      <PlaylistDetailPage
        playlist={selectedPlaylist}
        items={playlistItems}
        busy={busy}
        onBack={() => {
          onBackToLibrary();
        }}
        onEdit={() => {
          setEditingPlaylist(selectedPlaylist);
          setEditName(selectedPlaylist.name);
          setEditDescription(selectedPlaylist.description || '');
          setShowEditModal(true);
        }}
        onDelete={() => onDeletePlaylist(selectedPlaylist.id)}
        onRemoveItem={(itemId) => onRemoveFromPlaylist(selectedPlaylist.id, itemId)}
        onReorderItem={(itemId, newSortOrder) => onReorderPlaylistItem(selectedPlaylist.id, itemId, newSortOrder)}
        onSelectMovie={onSelectMovie}
        onSelectShow={onSelectShow}
      />
    );
  }

  return (
    <div className="browse-grid">
      <section className="library-list">
        <div className="hero-strip browse-hero">
          <div className="hero-copy">
            <div className="hero-poster">
              <ListMusic size={34} />
            </div>
            <div>
              <span>Playlists</span>
              <h2>My Playlists</h2>
              <p>Create and manage your custom playlists with movies and TV shows.</p>
              <div className="hero-chips">
                <span>{playlists.length} playlists</span>
              </div>
            </div>
          </div>
        </div>

        <div className="filter-row">
          <button className="active">All playlists</button>
        </div>

        <div className="section-title">
          <h2>Your Playlists</h2>
          <button
            className="create-playlist-button"
            onClick={() => {
              setNewPlaylistName('');
              setNewPlaylistDescription('');
              setShowCreateModal(true);
            }}
            disabled={busy}
          >
            <Plus size={16} />
            Create Playlist
          </button>
        </div>

        {playlists.length ? (
          <div className="playlist-grid">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="playlist-card"
                onClick={() => onSelectPlaylist(playlist)}
              >
                <div className="playlist-icon">
                  <ListMusic size={32} />
                </div>
                <div className="playlist-info">
                  <h3>{playlist.name}</h3>
                  <p>{playlist.description || 'No description'}</p>
                  <span>{playlist.itemCount} item{playlist.itemCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="library-empty-state">
            <div className="empty-orbit" aria-hidden="true">
              <ListMusic size={34} />
            </div>
            <span>No playlists yet</span>
            <h3>Create your first playlist</h3>
            <p>Organize your favorite movies and TV shows into custom playlists.</p>
          </div>
        )}

        {showCreateModal && (
          <CreatePlaylistModal
            onClose={() => setShowCreateModal(false)}
            onCreate={(name, description) => {
              onCreatePlaylist(name, description);
              setShowCreateModal(false);
            }}
            busy={busy}
          />
        )}

        {showEditModal && editingPlaylist && (
          <EditPlaylistModal
            playlist={editingPlaylist}
            onClose={() => setShowEditModal(false)}
            onUpdate={(id, name, description) => {
              onUpdatePlaylist(id, name, description);
              setShowEditModal(false);
            }}
            busy={busy}
          />
        )}
      </section>
    </div>
  );
}

function PlaylistDetailPage({
  playlist,
  items,
  busy,
  onBack,
  onEdit,
  onDelete,
  onRemoveItem,
  onReorderItem,
  onSelectMovie,
  onSelectShow
}: {
  playlist: Playlist;
  items: PlaylistItem[];
  busy: boolean;
  onBack(): void;
  onEdit(): void;
  onDelete(): void;
  onRemoveItem(itemId: number): void;
  onReorderItem(itemId: number, newSortOrder: number): void;
  onSelectMovie(movie: Movie): void;
  onSelectShow(show: TvShow): void;
}) {
  const [draggedItem, setDraggedItem] = useState<PlaylistItem | null>(null);

  const handleDragStart = (item: PlaylistItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetItem: PlaylistItem) => {
    if (draggedItem && draggedItem.id !== targetItem.id) {
      onReorderItem(draggedItem.id, targetItem.sortOrder);
    }
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <section className="media-detail-page playlist-detail-page">
      <div className="detail-hero">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={17} />
          Back to playlists
        </button>

        <div className="playlist-detail-layout">
          <div className="detail-poster">
            <ListMusic size={48} />
          </div>
          <div className="detail-copy">
            <span className="detail-kicker">Playlist</span>
            <h2>{playlist.name}</h2>
            <p>{playlist.description || 'No description'}</p>
            <div className="hero-chips">
              <span>{playlist.itemCount} item{playlist.itemCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="playlist-actions">
              <button onClick={onEdit} disabled={busy}>
                <Edit2 size={16} />
                Edit
              </button>
              <button onClick={onDelete} disabled={busy} className="delete-button">
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="playlist-detail-grid">
        <section className="detail-card">
          <div className="section-title">
            <h2>Playlist Items</h2>
            <span>{items.length} items</span>
          </div>

          {items.length ? (
            <div className="playlist-items-list">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`playlist-item-row ${draggedItem?.id === item.id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(item)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(item)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="playlist-item-drag-handle">
                    <GripVertical size={16} />
                  </div>
                  <div className="playlist-item-icon">
                    {item.mediaKind === 'movie' ? <Film size={20} /> : <Tv size={20} />}
                  </div>
                  <div className="playlist-item-info">
                    <strong>{item.movie?.title || item.show?.title}</strong>
                    <small>
                      {item.mediaKind === 'movie'
                        ? `Movie • ${item.movie?.releaseYear || 'Unknown year'}`
                        : `TV Show • ${item.show?.firstAirYear || 'Unknown year'}`}
                    </small>
                  </div>
                  <button
                    className="playlist-item-remove"
                    onClick={() => onRemoveItem(item.id)}
                    disabled={busy}
                    title="Remove from playlist"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="detail-empty">
              <ListMusic size={22} />
              <span>This playlist is empty</span>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function CreatePlaylistModal({
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
            Create Playlist
          </button>
        </div>
      </div>
    </div>
  );
}

function EditPlaylistModal({
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
