import { useState } from 'react';
import { ArrowLeft, ListMusic, Edit2, Trash2, Film, Tv, GripVertical, X } from 'lucide-react';
import type { Playlist, PlaylistItem, Movie, TvShow } from '@shared/ipc';

export function PlaylistDetailPage({
  playlist,
  items,
  busy,
  onBack,
  onEdit,
  onDelete,
  onRemoveItem,
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
      onRemoveItem(draggedItem.id);
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
