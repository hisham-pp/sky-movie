import { useState } from 'react';
import { ArrowLeft, ListMusic, Edit2, Trash2, Film, Tv, GripVertical, X, Plus, Grid3x3, List, Play, ExternalLink } from 'lucide-react';
import type { Playlist, PlaylistItem, Movie, TvShow, MediaFile } from '@shared/ipc';
import { AddToPlaylistDialog } from './AddToPlaylistDialog';

interface PlaylistDetailPageProps {
  playlist: Playlist;
  items: PlaylistItem[];
  busy: boolean;
  movies: Movie[];
  shows: TvShow[];
  selectedFiles: MediaFile[];
  onBack(): void;
  onEdit(): void;
  onDelete(): void;
  onRemoveItem(itemId: number): void;
  onReorderItem(playlistId: number, itemId: number, newSortOrder: number): void;
  onSelectMovie(movie: Movie): void;
  onSelectShow(show: TvShow): void;
  onAddToPlaylist(playlistId: number, mediaKind: 'movie' | 'show', itemId: number): void;
  onViewMovieDetails(movie: Movie): void;
  onViewShowDetails(show: TvShow): void;
  onPlay(file: MediaFile): void;
}

type ViewMode = 'list' | 'grid';

export function PlaylistDetailPage({
  playlist,
  items,
  busy,
  movies,
  shows,
  selectedFiles,
  onBack,
  onEdit,
  onDelete,
  onRemoveItem,
  onReorderItem,
  onSelectMovie,
  onSelectShow,
  onAddToPlaylist,
  onViewMovieDetails,
  onViewShowDetails,
  onPlay
}: PlaylistDetailPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handlePlayAll = async () => {
    if (items.length === 0) return;
    
    // Get the first item and find its files
    const firstItem = items[0];
    let filesForFirstItem: MediaFile[] = [];
    
    if (firstItem.mediaKind === 'movie' && firstItem.movie) {
      await onSelectMovie(firstItem.movie);
      filesForFirstItem = selectedFiles;
    } else if (firstItem.mediaKind === 'show' && firstItem.show) {
      await onSelectShow(firstItem.show);
      filesForFirstItem = selectedFiles;
    }
    
    // Play the first file if available
    if (filesForFirstItem.length > 0) {
      onPlay(filesForFirstItem[0]);
    }
  };

  const handleItemClick = (item: PlaylistItem) => {
    if (item.mediaKind === 'movie' && item.movie) {
      onViewMovieDetails(item.movie);
    } else if (item.mediaKind === 'show' && item.show) {
      onViewShowDetails(item.show);
    }
  };

  const handleDragStart = (e: React.DragEvent, item: PlaylistItem, index: number) => {
    setDraggedItemId(item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedItemId === null) return;
    
    const draggedItem = items.find(item => item.id === draggedItemId);
    if (!draggedItem) return;

    const currentIndex = items.findIndex(item => item.id === draggedItemId);
    if (currentIndex === targetIndex) {
      setDraggedItemId(null);
      setDragOverIndex(null);
      return;
    }

    // Call the reorder function with new sort order
    onReorderItem(playlist.id, draggedItemId, targetIndex);
    
    setDraggedItemId(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverIndex(null);
  };

  return (
    <section className="media-detail-page playlist-detail-page">
      {items.length > 0 && (
        <div className="playlist-backdrop">
          <div className="playlist-backdrop-collage">
            {items.slice(0, 6).map((item, index) => {
              const posterPath = item.movie?.posterPath || item.show?.posterPath;
              return posterPath ? (
                <img key={item.id} src={posterPath} alt="" style={{ '--delay': index } as any} />
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
              <button onClick={handlePlayAll} disabled={busy || items.length === 0} className="primary-button play-all-button">
                <Play size={16} />
                Play All
              </button>
              <button onClick={() => setShowAddDialog(true)} disabled={busy}>
                <Plus size={16} />
                Add Items
              </button>
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

      <div className="playlist-content">
        <div className="playlist-toolbar">
          <div className="section-title">
            <h2>Playlist Items</h2>
            <span>{items.length} items</span>
          </div>
          <div className="view-mode-toggle">
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List size={18} />
            </button>
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <Grid3x3 size={18} />
            </button>
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
                  onDragStart={(e) => handleDragStart(e, item, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="playlist-item-drag-handle">
                    <GripVertical size={16} />
                  </div>
                  <div 
                    className="playlist-item-poster"
                    onClick={() => handleItemClick(item)}
                    style={{ cursor: 'pointer' }}
                  >
                    {item.movie?.posterPath || item.show?.posterPath ? (
                      <img src={(item.movie?.posterPath || item.show?.posterPath)!} alt="" />
                    ) : (
                      <div className="playlist-item-poster-placeholder">
                        {item.mediaKind === 'movie' ? <Film size={24} /> : <Tv size={24} />}
                      </div>
                    )}
                  </div>
                  <div 
                    className="playlist-item-info"
                    onClick={() => handleItemClick(item)}
                    style={{ cursor: 'pointer', flex: 1 }}
                  >
                    <strong>{item.movie?.title || item.show?.title}</strong>
                    <small>
                      {item.mediaKind === 'movie'
                        ? `Movie • ${item.movie?.releaseYear || 'Unknown year'}`
                        : `TV Show • ${item.show?.firstAirYear || 'Unknown year'}`}
                    </small>
                  </div>
                  <button
                    className="playlist-item-view"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemClick(item);
                    }}
                    title="View details"
                  >
                    <ExternalLink size={16} />
                  </button>
                  <button
                    className="playlist-item-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(item.id);
                    }}
                    disabled={busy}
                    title="Remove from playlist"
                  >
                    <X size={16} />
                  </button>
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
                  onDragStart={(e) => handleDragStart(e, item, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleItemClick(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="playlist-grid-item-drag-handle">
                    <GripVertical size={14} />
                  </div>
                  <button
                    className="playlist-grid-item-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(item.id);
                    }}
                    disabled={busy}
                    title="Remove from playlist"
                  >
                    <X size={14} />
                  </button>
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
                      {item.mediaKind === 'movie'
                        ? item.movie?.releaseYear || 'Unknown'
                        : item.show?.firstAirYear || 'Unknown'}
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
            <button className="primary-button" onClick={() => setShowAddDialog(true)} disabled={busy}>
              <Plus size={16} />
              Add Items
            </button>
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
          onAdd={(mediaKind, itemId) => {
            onAddToPlaylist(playlist.id, mediaKind, itemId);
          }}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </section>
  );
}
