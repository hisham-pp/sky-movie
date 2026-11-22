'use client';

import { memo } from 'react';
import { Film, Heart, Tv, Info, Youtube, Library } from 'lucide-react';
import type { Movie, TvShow } from '@shared/ipc';
import { Tooltip } from '../common';
import { toDisplayImageUrl } from '../../utils/imageUrl';

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
  onSelect,
  onViewDetailsItem,
  onToggleFavoriteItem,
  isSelected
}: {
  movie: Movie;
  onClick?(): void;
  onViewDetails?(): void;
  onToggleFavorite?(): void;
  onSelect?(movie: Movie): void;
  onViewDetailsItem?(movie: Movie): void;
  onToggleFavoriteItem?(mediaKind: 'movie', id: number, nextFavorite: boolean): void;
  isSelected?: boolean;
}) {
  const handleClick = () => {
    if (onSelect) onSelect(movie);
    else onClick?.();
  };

  const handleDetails = () => {
    if (onViewDetailsItem) onViewDetailsItem(movie);
    else onViewDetails?.();
  };

  const handleFavorite = () => {
    if (onToggleFavoriteItem) onToggleFavoriteItem('movie', movie.id, !movie.favorite);
    else onToggleFavorite?.();
  };

  const posterDisplayUrl = toDisplayImageUrl(movie.posterPath);

  return (
    <div className={`tile ${isSelected ? 'tile-selected' : ''}`} onClick={handleClick}>
      <div className="poster">
        {posterDisplayUrl ? (
          <img src={posterDisplayUrl} alt="" loading="lazy" decoding="async" />
        ) : (
          <Film size={34} />
        )}
        {movie.source === 'youtube' ? (
          <span className="tile-badge tile-badge--icon-only bg-red-600 border border-red-500/50" title="YouTube">
            <Youtube size={12} />
          </span>
        ) : (
          <span className="tile-badge tile-badge--icon-only" title="In Library">
            <Library size={12} />
          </span>
        )}
        <FavoriteButton favorite={movie.favorite} onToggle={handleFavorite} />
        <span className="tile-overlay">
          <div className="tile-meta">
            <strong title={movie.title}>{movie.title}</strong>
            <small>{movie.releaseYear ?? 'Unknown year'}</small>
          </div>
          <Tooltip content="View details">
            <button
              className="details-button"
              aria-label="View details"
              onClick={(e) => {
                e.stopPropagation();
                handleDetails();
              }}
            >
              <Info size={15} />
            </button>
          </Tooltip>
        </span>
      </div>
    </div>
  );
});

export const ShowTile = memo(function ShowTile({
  show,
  onClick,
  onViewDetails,
  onToggleFavorite,
  onSelect,
  onViewDetailsItem,
  onToggleFavoriteItem,
  isSelected
}: {
  show: TvShow;
  onClick?(): void;
  onViewDetails?(): void;
  onToggleFavorite?(): void;
  onSelect?(show: TvShow): void;
  onViewDetailsItem?(show: TvShow): void;
  onToggleFavoriteItem?(mediaKind: 'show', id: number, nextFavorite: boolean): void;
  isSelected?: boolean;
}) {
  const handleClick = () => {
    if (onSelect) onSelect(show);
    else onClick?.();
  };

  const handleDetails = () => {
    if (onViewDetailsItem) onViewDetailsItem(show);
    else onViewDetails?.();
  };

  const handleFavorite = () => {
    if (onToggleFavoriteItem) onToggleFavoriteItem('show', show.id, !show.favorite);
    else onToggleFavorite?.();
  };

  const posterDisplayUrl = toDisplayImageUrl(show.posterPath);

  return (
    <div className={`tile ${isSelected ? 'tile-selected' : ''}`} onClick={handleClick}>
      <div className="poster show-poster">
        {posterDisplayUrl ? (
          <img src={posterDisplayUrl} alt="" loading="lazy" decoding="async" />
        ) : (
          <Tv size={34} />
        )}
        <span className="tile-badge tile-badge--icon-only" title="TV Series">
          <Tv size={12} />
        </span>
        <FavoriteButton favorite={show.favorite} onToggle={handleFavorite} />
        <span className="tile-overlay">
          <div className="tile-meta">
            <strong title={show.title}>{show.title}</strong>
            <small>{show.firstAirYear ?? 'Unknown year'}</small>
          </div>
          <Tooltip content="View details">
            <button
              className="details-button"
              aria-label="View details"
              onClick={(e) => {
                e.stopPropagation();
                handleDetails();
              }}
            >
              <Info size={15} />
            </button>
          </Tooltip>
        </span>
      </div>
    </div>
  );
});
