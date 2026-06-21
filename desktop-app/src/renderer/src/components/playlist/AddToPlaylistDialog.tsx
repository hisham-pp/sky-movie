import { useState } from 'react';
import { Film, Tv, Plus } from 'lucide-react';
import type { Playlist, PlaylistItem, Movie, TvShow } from '@shared/ipc';
import { Modal } from '../common';

interface AddToPlaylistDialogProps {
  playlist: Playlist;
  movies: Movie[];
  shows: TvShow[];
  existingItems: PlaylistItem[];
  busy: boolean;
  onAdd(mediaKind: 'movie' | 'show', itemId: number): void;
  onClose(): void;
}

export function AddToPlaylistDialog({
  playlist,
  movies,
  shows,
  existingItems,
  busy,
  onAdd,
  onClose
}: AddToPlaylistDialogProps) {
  const [activeTab, setActiveTab] = useState<'movies' | 'shows'>('movies');
  const [searchQuery, setSearchQuery] = useState('');

  const existingMovieIds = new Set(existingItems.filter(i => i.mediaKind === 'movie').map(i => i.movieId));
  const existingShowIds = new Set(existingItems.filter(i => i.mediaKind === 'show').map(i => i.showId));

  const filteredMovies = movies
    .filter(m => !existingMovieIds.has(m.id))
    .filter(m => 
      searchQuery === '' || 
      m.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const filteredShows = shows
    .filter(s => !existingShowIds.has(s.id))
    .filter(s => 
      searchQuery === '' || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <Modal isOpen={true} onClose={onClose} title={`Add to ${playlist.name}`} maxWidth="large">
      <div className="add-to-playlist-tabs">
        <button
          className={activeTab === 'movies' ? 'active' : ''}
          onClick={() => setActiveTab('movies')}
        >
          <Film size={16} />
          Movies ({filteredMovies.length})
        </button>
        <button
          className={activeTab === 'shows' ? 'active' : ''}
          onClick={() => setActiveTab('shows')}
        >
          <Tv size={16} />
          TV Shows ({filteredShows.length})
        </button>
      </div>

      <div className="add-to-playlist-search">
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="add-to-playlist-list">
        {activeTab === 'movies' ? (
          filteredMovies.length > 0 ? (
            filteredMovies.map((movie) => (
              <button
                key={movie.id}
                className="add-to-playlist-item"
                onClick={() => onAdd('movie', movie.id)}
                disabled={busy}
              >
                <div className="add-to-playlist-item-poster">
                  {movie.posterPath ? (
                    <img src={movie.posterPath} alt="" />
                  ) : (
                    <div className="add-to-playlist-item-poster-placeholder">
                      <Film size={20} />
                    </div>
                  )}
                </div>
                <div className="add-to-playlist-item-info">
                  <strong>{movie.title}</strong>
                  <small>{movie.releaseYear || 'Unknown year'}</small>
                </div>
                <Plus size={16} />
              </button>
            ))
          ) : (
            <div className="add-to-playlist-empty">
              <Film size={32} />
              <span>No movies available</span>
              <p>All movies are already in this playlist or your library is empty</p>
            </div>
          )
        ) : (
          filteredShows.length > 0 ? (
            filteredShows.map((show) => (
              <button
                key={show.id}
                className="add-to-playlist-item"
                onClick={() => onAdd('show', show.id)}
                disabled={busy}
              >
                <div className="add-to-playlist-item-poster">
                  {show.posterPath ? (
                    <img src={show.posterPath} alt="" />
                  ) : (
                    <div className="add-to-playlist-item-poster-placeholder">
                      <Tv size={20} />
                    </div>
                  )}
                </div>
                <div className="add-to-playlist-item-info">
                  <strong>{show.title}</strong>
                  <small>{show.firstAirYear || 'Unknown year'}</small>
                </div>
                <Plus size={16} />
              </button>
            ))
          ) : (
            <div className="add-to-playlist-empty">
              <Tv size={32} />
              <span>No TV shows available</span>
              <p>All shows are already in this playlist or your library is empty</p>
            </div>
          )
        )}
      </div>
    </Modal>
  );
}
