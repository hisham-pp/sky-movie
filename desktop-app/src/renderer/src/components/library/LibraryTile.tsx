import { memo } from 'react';
import { Film, Heart, Tv, Info } from 'lucide-react';
import type { Movie, TvShow } from '@shared/ipc';
import { Tooltip } from '../common';

function FavoriteButton({ favorite, onToggle }: { favorite: boolean; onToggle(): void }) {
  const label = favorite ? 'Remove from favorites' : 'Add to favorites';
  return (
    <Tooltip content={label}>
      <button
        className={`tile-fav-btn${favorite ? ' active' : ''}`}
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <Heart size={15} fill={favorite ? 'currentColor' : 'none'} />
      </button>
    </Tooltip>
  );
}

export const MovieTile = memo(function MovieTile({
  movie,
  onClick,
  onViewDetails,
  onToggleFavorite,
  isSelected
}: {
  movie: Movie;
  onClick(): void;
  onViewDetails(): void;
  onToggleFavorite(): void;
  isSelected?: boolean;
}) {
  return (
    <div className={`tile ${isSelected ? 'tile-selected' : ''}`} onClick={onClick}>
      <div className="poster">
        {movie.posterPath ? <img src={movie.posterPath} alt="" loading="lazy" decoding="async" /> : <Film size={34} />}
        <span className="tile-badge">LOCAL</span>
        <FavoriteButton favorite={movie.favorite} onToggle={onToggleFavorite} />
        <span className="tile-overlay">
          <strong>{movie.title}</strong>
          <small>{movie.releaseYear ?? 'Unknown year'}</small>
          <Tooltip content="View details">
            <button
              className="details-button"
              aria-label="View details"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
            >
              <Info size={15} />
            </button>
          </Tooltip>
        </span>
      </div>
      <strong>{movie.title}</strong>
      <span>{movie.releaseYear ?? 'Unknown year'}</span>
    </div>
  );
});

export const ShowTile = memo(function ShowTile({
  show,
  onClick,
  onViewDetails,
  onToggleFavorite,
  isSelected
}: {
  show: TvShow;
  onClick(): void;
  onViewDetails(): void;
  onToggleFavorite(): void;
  isSelected?: boolean;
}) {
  return (
    <div className={`tile ${isSelected ? 'tile-selected' : ''}`} onClick={onClick}>
      <div className="poster show-poster">
        {show.posterPath ? <img src={show.posterPath} alt="" loading="lazy" decoding="async" /> : <Tv size={34} />}
        <span className="tile-badge">TV</span>
        <FavoriteButton favorite={show.favorite} onToggle={onToggleFavorite} />
        <span className="tile-overlay">
          <strong>{show.title}</strong>
          <small>{show.firstAirYear ?? 'Unknown year'}</small>
          <Tooltip content="View details">
            <button
              className="details-button"
              aria-label="View details"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
            >
              <Info size={15} />
            </button>
          </Tooltip>
        </span>
      </div>
      <strong>{show.title}</strong>
      <span>{show.firstAirYear ?? 'Unknown year'}</span>
    </div>
  );
});
