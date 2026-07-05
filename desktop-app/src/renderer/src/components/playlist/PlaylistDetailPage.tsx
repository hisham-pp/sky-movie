import { memo, useState, useCallback } from 'react';
import { ArrowLeft, ListMusic, Edit2, Trash2, Film, Tv, GripVertical, X, Plus, Grid3x3, List, Play, ExternalLink } from 'lucide-react';
import type { Playlist, PlaylistItem, Movie, TvShow } from '@shared/ipc';
import { AddToPlaylistDialog } from './AddToPlaylistDialog';
import { Button, Tooltip } from '../common';

interface PlaylistDetailPageProps {
  playlist: Playlist;
  items: PlaylistItem[];
  busy: boolean;
  movies: Movie[];
  shows: TvShow[];
  onBack(): void;
  onEdit(): void;
  onDelete(): void;
  onRemoveItem(itemId: number): void;
  onReorderItem(playlistId: number, itemId: number, newSortOrder: number): void;
  onAddToPlaylist(playlistId: number, mediaKind: 'movie' | 'show', itemId: number): void;
  onViewMovieDetails(movie: Movie): void;
  onViewShowDetails(show: TvShow): void;
  onPlayAll(): void;
}

type ViewMode = 'list' | 'grid';

export const PlaylistDetailPage = memo(function PlaylistDetailPage({
  playlist,
  items,
  busy,
  movies,
  shows,
  onBack,
  onEdit,
  onDelete,
  onRemoveItem,
  onReorderItem,
  onAddToPlaylist,
  onViewMovieDetails,
  onViewShowDetails,
  onPlayAll
}: PlaylistDetailPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handlePlayAll = useCallback(() => {
    if (items.length === 0) return;
    onPlayAll();
  }, [items.length, onPlayAll]);

  const handleItemClick = useCallback((item: PlaylistItem) => {
    if (item.mediaKind === 'movie' && item.movie) onViewMovieDetails(item.movie);
    else if (item.mediaKind === 'show' && item.show) onViewShowDetails(item.show);
  }, [onViewMovieDetails, onViewShowDetails]);

  const handleDragStart = useCallback((e: React.DragEvent, item: PlaylistItem) => {
    setDraggedItemId(item.id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => setDragOverIndex(null), []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedItemId === null) return;
    const currentIndex = items.findIndex((item) => item.id === draggedItemId);
    if (currentIndex !== targetIndex) {
      onReorderItem(playlist.id, draggedItemId, targetIndex);
    }
    setDraggedItemId(null);
    setDragOverIndex(null);
  }, [draggedItemId, items, onReorderItem, playlist.id]);

  const handleDragEnd = useCallback(() => {
    setDraggedItemId(null);
    setDragOverIndex(null);
  }, []);

  const handleOpenAddDialog = useCallback(() => setShowAddDialog(true), []);
  const handleCloseAddDialog = useCallback(() => setShowAddDialog(false), []);
  const handleAddToPlaylist = useCallback(
    (mediaKind: 'movie' | 'show', itemId: number) => onAddToPlaylist(playlist.id, mediaKind, itemId),
    [onAddToPlaylist, playlist.id],
  );
  const handleSetListView = useCallback(() => setViewMode('list'), []);
  const handleSetGridView = useCallback(() => setViewMode('grid'), []);

  return (
    <section className="media-detail-page playlist-detail-page">
      {items.length > 0 && (
        <div className="playlist-backdrop">
          <div className="playlist-backdrop-collage">
            {items.slice(0, 6).map((item, index) => {
              const posterPath = item.movie?.posterPath || item.show?.posterPath;
              return posterPath ? (
                <img key={item.id} src={posterPath} alt="" style={{ '--delay': index } as React.CSSProperties} />
              ) : null;
            })}
          </div>
          <div className="playlist-backdrop-overlay"></div>
        </div>
      )}

      <div className="detail-hero">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={17} />
          Back to playlists
        </button>

        <div className="playlist-detail-layout">
          <div className="detail-poster playlist-poster-large">
            {items.length > 0 ? (
              <div className="playlist-poster-grid">
                {items.slice(0, 4).map((item, index) => {
                  const posterPath = item.movie?.posterPath || item.show?.posterPath;
                  return posterPath ? (
                    <img key={item.id} src={posterPath} alt="" />
                  ) : (
                    <div key={item.id} className="playlist-poster-placeholder">
                      {item.mediaKind === 'movie' ? <Film size={20} /> : <Tv size={20} />}
                    </div>
                  );
                })}
                {items.length < 4 && Array.from({ length: 4 - Math.min(items.length, 4) }).map((_, i) => (
                  <div key={`empty-${i}`} className="playlist-poster-placeholder">
                    <ListMusic size={20} />
                  </div>
                ))}
              </div>
            ) : (
              <ListMusic size={48} />
            )}
          </div>
          <div className="detail-copy">
            <span className="detail-kicker">Playlist</span>
            <h2>{playlist.name}</h2>
            <p>{playlist.description || 'No description provided'}</p>
            <div className="hero-chips">
              <span>{playlist.itemCount} item{playlist.itemCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="playlist-actions">
              <Button variant="primary" size="medium" icon={<Play />} onClick={handlePlayAll} disabled={busy || items.length === 0}>
                Play All
              </Button>
              <Button variant="secondary" size="medium" icon={<Plus />} onClick={handleOpenAddDialog} disabled={busy}>
                Add Items
              </Button>
              <Button variant="secondary" size="medium" icon={<Edit2 />} onClick={onEdit} disabled={busy}>
                Edit
              </Button>
              <Button variant="danger" size="medium" icon={<Trash2 />} onClick={onDelete} disabled={busy}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="playlist-content">
        <div className="playlist-toolbar">
          <div className="section-title">
            <h2>Playlist Items</h2>
            <span>{items.length} items</span>
          </div>
          <div className="view-mode-toggle">
            <Tooltip content="List view">
              <button className={viewMode === 'list' ? 'active' : ''} onClick={handleSetListView} aria-label="List view">
                <List size={18} />
              </button>
            </Tooltip>
            <Tooltip content="Grid view">
              <button className={viewMode === 'grid' ? 'active' : ''} onClick={handleSetGridView} aria-label="Grid view">
                <Grid3x3 size={18} />
              </button>
            </Tooltip>
          </div>
        </div>

        {items.length ? (
          viewMode === 'list' ? (
            <div className="playlist-items-list">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`playlist-item-row ${draggedItemId === item.id ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="playlist-item-drag-handle"><GripVertical size={16} /></div>
                  <div className="playlist-item-poster" onClick={() => handleItemClick(item)} style={{ cursor: 'pointer' }}>
                    {item.movie?.posterPath || item.show?.posterPath ? (
                      <img src={(item.movie?.posterPath || item.show?.posterPath)!} alt="" />
                    ) : (
                      <div className="playlist-item-poster-placeholder">
                        {item.mediaKind === 'movie' ? <Film size={24} /> : <Tv size={24} />}
                      </div>
                    )}
                  </div>
                  <div className="playlist-item-info" onClick={() => handleItemClick(item)} style={{ cursor: 'pointer', flex: 1 }}>
                    <strong>{item.movie?.title || item.show?.title}</strong>
                    <small>
                      {item.mediaKind === 'movie'
                        ? `Movie • ${item.movie?.releaseYear || 'Unknown year'}`
                        : `TV Show • ${item.show?.firstAirYear || 'Unknown year'}`}
                    </small>
                  </div>
                  <Tooltip content="View details">
                    <button className="playlist-item-view" onClick={(e) => { e.stopPropagation(); handleItemClick(item); }} aria-label="View details">
                      <ExternalLink size={16} />
                    </button>
                  </Tooltip>
                  <Tooltip content="Remove from playlist">
                    <button className="playlist-item-remove" onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }} disabled={busy} aria-label="Remove from playlist">
                      <X size={16} />
                    </button>
                  </Tooltip>
                </div>
              ))}
            </div>
          ) : (
            <div className="playlist-items-grid">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`playlist-grid-item ${draggedItemId === item.id ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleItemClick(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="playlist-grid-item-drag-handle"><GripVertical size={14} /></div>
                  <Tooltip content="Remove from playlist">
                    <button className="playlist-grid-item-remove" onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }} disabled={busy} aria-label="Remove from playlist">
                      <X size={14} />
                    </button>
                  </Tooltip>
                  <div className="playlist-grid-item-poster">
                    {item.movie?.posterPath || item.show?.posterPath ? (
                      <img src={(item.movie?.posterPath || item.show?.posterPath)!} alt="" />
                    ) : (
                      <div className="playlist-grid-item-poster-placeholder">
                        {item.mediaKind === 'movie' ? <Film size={32} /> : <Tv size={32} />}
                      </div>
                    )}
                  </div>
                  <div className="playlist-grid-item-info">
                    <strong>{item.movie?.title || item.show?.title}</strong>
                    <small>
                      {item.mediaKind === 'movie' ? item.movie?.releaseYear || 'Unknown' : item.show?.firstAirYear || 'Unknown'}
                    </small>
                  </div>
                  <div className="playlist-grid-item-type">
                    {item.mediaKind === 'movie' ? <Film size={12} /> : <Tv size={12} />}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="detail-empty">
            <ListMusic size={32} />
            <span>This playlist is empty</span>
            <p>Add movies and TV shows to your playlist</p>
            <Button variant="primary" size="medium" icon={<Plus />} onClick={handleOpenAddDialog} disabled={busy}>
              Add Items
            </Button>
          </div>
        )}
      </div>

      {showAddDialog && (
        <AddToPlaylistDialog
          playlist={playlist}
          movies={movies}
          shows={shows}
          existingItems={items}
          busy={busy}
          onAdd={handleAddToPlaylist}
          onClose={handleCloseAddDialog}
        />
      )}
    </section>
  );
});
