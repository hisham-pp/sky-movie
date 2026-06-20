import { Film, Star, Tv, Info } from 'lucide-react';
import type { Movie, TvShow } from '@shared/ipc';

export function MovieTile({ 
  movie, 
  onClick, 
  onViewDetails,
  isSelected 
}: { 
  movie: Movie; 
  onClick(): void;
  onViewDetails(): void;
  isSelected?: boolean;
}) {
  return (
    <div className={`tile ${isSelected ? 'tile-selected' : ''}`} onClick={onClick}>
      <div className="poster">
        {movie.posterPath ? <img src={movie.posterPath} alt="" /> : <Film size={34} />}
        <span className="tile-badge">LOCAL</span>
        <span className="tile-overlay">
          <strong>{movie.title}</strong>
          <small>{movie.releaseYear ?? 'Unknown year'}</small>
          <button 
            className="details-button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
          >
            <Info size={16} />
            View Details
          </button>
        </span>
      </div>
      <strong>{movie.title}</strong>
      <span>{movie.releaseYear ?? 'Unknown year'}</span>
      {movie.favorite ? <Star className="favorite" size={16} /> : null}
    </div>
  );
}

export function ShowTile({ 
  show, 
  onClick,
  onViewDetails,
  isSelected 
}: { 
  show: TvShow; 
  onClick(): void;
  onViewDetails(): void;
  isSelected?: boolean;
}) {
  return (
    <div className={`tile ${isSelected ? 'tile-selected' : ''}`} onClick={onClick}>
      <div className="poster show-poster">
        {show.posterPath ? <img src={show.posterPath} alt="" /> : <Tv size={34} />}
        <span className="tile-badge">TV</span>
        <span className="tile-overlay">
          <strong>{show.title}</strong>
          <small>{show.firstAirYear ?? 'Unknown year'}</small>
          <button 
            className="details-button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
          >
            <Info size={16} />
            View Details
          </button>
        </span>
      </div>
      <strong>{show.title}</strong>
      <span>{show.firstAirYear ?? 'Unknown year'}</span>
      {show.favorite ? <Star className="favorite" size={16} /> : null}
    </div>
  );
}
