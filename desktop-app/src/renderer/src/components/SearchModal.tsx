import { Search, Film, Tv, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Movie, TvShow } from '@shared/ipc';
import { Modal } from './common';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  movies: Movie[];
  shows: TvShow[];
  onSelectMovie: (movie: Movie) => void;
  onSelectShow: (show: TvShow) => void;
}

export function SearchModal({
  isOpen,
  onClose,
  movies,
  shows,
  onSelectMovie,
  onSelectShow
}: SearchModalProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredMovies = query
    ? movies.filter((m) => m.title.toLowerCase().includes(query.toLowerCase()))
    : [];

  const filteredShows = query
    ? shows.filter((s) => s.title.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleMovieClick = (movie: Movie) => {
    onSelectMovie(movie);
    onClose();
  };

  const handleShowClick = (show: TvShow) => {
    onSelectShow(show);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} customContent={true}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search movies and shows..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="search-modal-input"
          />
          <button className="search-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="search-modal-results">
          {query && (filteredMovies.length > 0 || filteredShows.length > 0) ? (
            <>
              {filteredMovies.length > 0 && (
                <div className="search-modal-section">
                  <h3 className="search-modal-section-title">
                    <Film size={16} /> Movies
                  </h3>
                  <div className="search-modal-items">
                    {filteredMovies.slice(0, 8).map((movie) => (
                      <button
                        key={movie.id}
                        className="search-modal-item"
                        onClick={() => handleMovieClick(movie)}
                      >
                        {movie.posterPath ? (
                          <img
                            src={movie.posterPath}
                            alt={movie.title}
                            className="search-modal-item-poster"
                          />
                        ) : (
                          <div className="search-modal-item-poster-placeholder">
                            <Film size={24} />
                          </div>
                        )}
                        <div className="search-modal-item-info">
                          <div className="search-modal-item-title">{movie.title}</div>
                          {movie.releaseYear && (
                            <div className="search-modal-item-meta">{movie.releaseYear}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredShows.length > 0 && (
                <div className="search-modal-section">
                  <h3 className="search-modal-section-title">
                    <Tv size={16} /> TV Shows
                  </h3>
                  <div className="search-modal-items">
                    {filteredShows.slice(0, 8).map((show) => (
                      <button
                        key={show.id}
                        className="search-modal-item"
                        onClick={() => handleShowClick(show)}
                      >
                        {show.posterPath ? (
                          <img
                            src={show.posterPath}
                            alt={show.title}
                            className="search-modal-item-poster"
                          />
                        ) : (
                          <div className="search-modal-item-poster-placeholder">
                            <Tv size={24} />
                          </div>
                        )}
                        <div className="search-modal-item-info">
                          <div className="search-modal-item-title">{show.title}</div>
                          {show.firstAirYear && (
                            <div className="search-modal-item-meta">{show.firstAirYear}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : query ? (
            <div className="search-modal-empty">No results found for "{query}"</div>
          ) : (
            <div className="search-modal-empty">
              Start typing to search your library...
            </div>
          )}
        </div>

        <div className="search-modal-footer">
          <kbd>Ctrl</kbd> + <kbd>K</kbd> to close
        </div>
      </div>
    </Modal>
  );
}
