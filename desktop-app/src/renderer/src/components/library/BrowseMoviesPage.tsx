import { useState, useEffect, useMemo } from 'react';
import { Clapperboard } from 'lucide-react';
import type { Movie, PlayMediaResult } from '@shared/ipc';
import { MovieTile } from '../LibraryTile';
import { BannerHero, BannerIndicators } from './BannerHero';
import { EmptyLibraryState } from './EmptyLibraryState';
import { LibraryFilters } from './LibraryFilters';
import { SectionTitle } from './SectionTitle';

export function BrowseMoviesPage({
  movies,
  selectedMovie,
  player,
  onSelectMovie,
  onViewMovieDetails,
  onOpenExternal
}: {
  movies: Movie[];
  selectedMovie: Movie | null;
  player: PlayMediaResult | null;
  onSelectMovie(movie: Movie): void;
  onViewMovieDetails(movie: Movie): void;
  onOpenExternal(mediaFileId: number): void;
}) {
  const moviesWithBackdrop = useMemo(() => movies.filter((m) => m.backdropPath), [movies]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Auto-rotate banner only when nothing is selected
  useEffect(() => {
    if (!selectedMovie && moviesWithBackdrop.length > 0) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % moviesWithBackdrop.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedMovie, moviesWithBackdrop.length]);

  // Update banner index when movie is selected
  useEffect(() => {
    if (selectedMovie && moviesWithBackdrop.length > 0) {
      const index = moviesWithBackdrop.findIndex((m) => m.id === selectedMovie.id);
      if (index !== -1) {
        setCurrentBannerIndex(index);
      }
    }
  }, [selectedMovie, moviesWithBackdrop]);

  const bannerMovie = selectedMovie || moviesWithBackdrop[currentBannerIndex];

  return (
    <div className="browse-grid">
      <section className="library-list">
        <BannerHero
          backdropPath={bannerMovie?.backdropPath || null}
          posterContent={
            bannerMovie?.posterPath ? (
              <img src={bannerMovie.posterPath} alt={bannerMovie.title} />
            ) : (
              <Clapperboard size={34} />
            )
          }
          label={bannerMovie ? 'Now Playing' : 'Browse library'}
          title={bannerMovie?.title || 'Movie Library'}
          overview={
            bannerMovie?.overview ||
            'Browse local films, open a movie page, and play files from your private collection.'
          }
          badges={
            bannerMovie ? (
              <>
                {bannerMovie.releaseYear && <span>{bannerMovie.releaseYear}</span>}
                {bannerMovie.rating && <span>★ {bannerMovie.rating.toFixed(1)}</span>}
              </>
            ) : (
              <span>{movies.length} movie{movies.length !== 1 ? 's' : ''}</span>
            )
          }
          indicators={
            <BannerIndicators
              total={moviesWithBackdrop.length}
              current={currentBannerIndex}
              onSelect={setCurrentBannerIndex}
            />
          }
          onPlay={bannerMovie ? () => onSelectMovie(bannerMovie) : undefined}
          player={player}
          onOpenExternal={onOpenExternal}
        />

        <LibraryFilters />
        <SectionTitle title="Current Movies" count={movies.length} />

        {movies.length > 0 ? (
          <div className="poster-grid">
            {movies.map((movie) => (
              <MovieTile
                key={movie.id}
                movie={movie}
                onClick={() => onSelectMovie(movie)}
                onViewDetails={() => onViewMovieDetails(movie)}
                isSelected={selectedMovie?.id === movie.id}
              />
            ))}
          </div>
        ) : (
          <EmptyLibraryState
            icon={<Clapperboard size={34} />}
            label="No movies yet"
            title="Scan a local folder to build your cinema library."
            description="Use Settings to add one or more folders. Sky Movie will import files, enrich metadata, and keep the library local-first."
          />
        )}
      </section>
    </div>
  );
}
