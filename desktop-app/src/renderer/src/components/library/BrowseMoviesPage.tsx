import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Clapperboard, ChevronDown } from 'lucide-react';
import type { Movie, PlayMediaResult } from '@shared/ipc';
import { MovieTile } from '../LibraryTile';
import { BannerHero, BannerIndicators } from './BannerHero';
import { EmptyLibraryState } from './EmptyLibraryState';
import { LibraryFilters } from './LibraryFilters';
import { SectionTitle } from './SectionTitle';

export const BrowseMoviesPage = memo(function BrowseMoviesPage({
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

  useEffect(() => {
    if (!selectedMovie && moviesWithBackdrop.length > 0) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % moviesWithBackdrop.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedMovie, moviesWithBackdrop.length]);

  useEffect(() => {
    if (selectedMovie && moviesWithBackdrop.length > 0) {
      const index = moviesWithBackdrop.findIndex((m) => m.id === selectedMovie.id);
      if (index !== -1) setCurrentBannerIndex(index);
    }
  }, [selectedMovie, moviesWithBackdrop]);

  const bannerMovie = selectedMovie || moviesWithBackdrop[currentBannerIndex];

  const handleBannerPlay = useCallback(
    () => bannerMovie && onSelectMovie(bannerMovie),
    [bannerMovie, onSelectMovie],
  );

  const PAGE_SIZE = 100;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [movies]);
  const visibleMovies = useMemo(() => movies.slice(0, visibleCount), [movies, visibleCount]);
  const handleLoadMore = useCallback(() => setVisibleCount((c) => c + PAGE_SIZE), []);

  const movieCount = movies.length;

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
              <span>{movieCount} movie{movieCount !== 1 ? 's' : ''}</span>
            )
          }
          indicators={
            <BannerIndicators
              total={moviesWithBackdrop.length}
              current={currentBannerIndex}
              onSelect={setCurrentBannerIndex}
            />
          }
          onPlay={bannerMovie ? handleBannerPlay : undefined}
          player={player}
          onOpenExternal={onOpenExternal}
        />

        <LibraryFilters />
        <SectionTitle title="Current Movies" count={movieCount} />

        {movieCount > 0 ? (
          <>
            <div className="poster-grid">
              {visibleMovies.map((movie) => (
                <MovieTile
                  key={movie.id}
                  movie={movie}
                  onClick={() => onSelectMovie(movie)}
                  onViewDetails={() => onViewMovieDetails(movie)}
                  isSelected={selectedMovie?.id === movie.id}
                />
              ))}
            </div>
            {visibleCount < movieCount && (
              <div className="load-more-row">
                <button className="load-more-btn" onClick={handleLoadMore}>
                  <ChevronDown size={16} />
                  Show more ({movieCount - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
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
});
