import { Film, Star, Tv } from 'lucide-react';
import type { Movie, TvShow } from '@shared/ipc';

export function MovieTile({ movie, onClick }: { movie: Movie; onClick(): void }) {
  return (
    <button className="tile" onClick={onClick}>
      <div className="poster">
        {movie.posterPath ? <img src={movie.posterPath} alt="" /> : <Film size={34} />}
        <span className="tile-badge">Local</span>
      </div>
      <strong>{movie.title}</strong>
      <span>{movie.releaseYear ?? 'Unknown year'}</span>
      {movie.favorite ? <Star className="favorite" size={16} /> : null}
    </button>
  );
}

export function ShowTile({ show, onClick }: { show: TvShow; onClick(): void }) {
  return (
    <button className="tile" onClick={onClick}>
      <div className="poster show-poster">
        {show.posterPath ? <img src={show.posterPath} alt="" /> : <Tv size={34} />}
        <span className="tile-badge">TV</span>
      </div>
      <strong>{show.title}</strong>
      <span>{show.firstAirYear ?? 'Unknown year'}</span>
      {show.favorite ? <Star className="favorite" size={16} /> : null}
    </button>
  );
}
