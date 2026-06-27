import { memo, useMemo, useState, useCallback } from 'react';
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

export const AddToPlaylistDialog = memo(function AddToPlaylistDialog({
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

  const existingMovieIds = useMemo(
    () => new Set(existingItems.filter((i) => i.mediaKind === 'movie').map((i) => i.movieId)),
    [existingItems],
  );
  const existingShowIds = useMemo(
    () => new Set(existingItems.filter((i) => i.mediaKind === 'show').map((i) => i.showId)),
    [existingItems],
  );

  const q = searchQuery.toLowerCase();

  const filteredMovies = useMemo(
    () => movies.filter((m) => !existingMovieIds.has(m.id) && (q === '' || m.title.toLowerCase().includes(q))),
    [movies, existingMovieIds, q],
  );

  const filteredShows = useMemo(
    () => shows.filter((s) => !existingShowIds.has(s.id) && (q === '' || s.title.toLowerCase().includes(q))),
    [shows, existingShowIds, q],
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value), []);
  const handleMoviesTab = useCallback(() => setActiveTab('movies'), []);
  const handleShowsTab = useCallback(() => setActiveTab('shows'), []);

  return (
    <Modal isOpen={true} onClose={onClose} title={`Add to ${playlist.name}`} maxWidth="large">
      <div className="add-to-playlist-tabs">
        <button className={activeTab === 'movies' ? 'active' : ''} onClick={handleMoviesTab}>
          <Film size={16} />
          Movies ({filteredMovies.length})
        </button>
        <button className={activeTab === 'shows' ? 'active' : ''} onClick={handleShowsTab}>
          <Tv size={16} />
          TV Shows ({filteredShows.length})
        </button>
      </div>

      <div className="add-to-playlist-search">
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className="add-to-playlist-list">
        {activeTab === 'movies' ? (
          filteredMovies.length > 0 ? (
            filteredMovies.map((movie) => (
              <button key={movie.id} className="add-to-playlist-item" onClick={() => onAdd('movie', movie.id)} disabled={busy}>
                <div className="add-to-playlist-item-poster">
                  {movie.posterPath ? (
                    <img src={movie.posterPath} alt="" />
                  ) : (
                    <div className="add-to-playlist-item-poster-placeholder"><Film size={20} /></div>
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
              <button key={show.id} className="add-to-playlist-item" onClick={() => onAdd('show', show.id)} disabled={busy}>
                <div className="add-to-playlist-item-poster">
                  {show.posterPath ? (
                    <img src={show.posterPath} alt="" />
                  ) : (
                    <div className="add-to-playlist-item-poster-placeholder"><Tv size={20} /></div>
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
});
