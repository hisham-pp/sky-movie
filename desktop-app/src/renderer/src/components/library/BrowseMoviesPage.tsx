import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Clapperboard, ChevronDown } from 'lucide-react';
import type { Movie, PlayMediaResult } from '@shared/ipc';
import { MovieTile } from '../LibraryTile';
import { BannerHero, BannerIndicators } from './BannerHero';
import { EmptyLibraryState } from './EmptyLibraryState';
import { LibraryFilters, type SortBy } from './LibraryFilters';
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
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('default');

  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedYear(null);
    setMinRating(null);
    setFavoritesOnly(false);
    setSortBy('default');
  }, []);

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const m of movies) if (m.releaseYear) set.add(m.releaseYear);
    return Array.from(set).sort((a, b) => b - a);
  }, [movies]);

  const filteredMovies = useMemo(() => {
    let list = movies;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((m) => m.title.toLowerCase().includes(q));
    }
    if (selectedYear !== null) list = list.filter((m) => m.releaseYear === selectedYear);
    if (minRating !== null) list = list.filter((m) => m.rating !== null && m.rating >= minRating);
    if (favoritesOnly) list = list.filter((m) => m.favorite);
    if (sortBy === 'title') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === 'year') list = [...list].sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0));
    else if (sortBy === 'rating') list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return list;
  }, [movies, search, selectedYear, minRating, favoritesOnly, sortBy]);

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
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [filteredMovies]);
  const visibleMovies = useMemo(() => filteredMovies.slice(0, visibleCount), [filteredMovies, visibleCount]);
  const handleLoadMore = useCallback(() => setVisibleCount((c) => c + PAGE_SIZE), []);

  const movieCount = filteredMovies.length;

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
          onPlay={bannerMovie ? handleBannerPlay : undefined}
          player={player}
          onOpenExternal={onOpenExternal}
        />

        <LibraryFilters
          search={search}
          onSearchChange={setSearch}
          years={years}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          minRating={minRating}
          onRatingChange={setMinRating}
          favoritesOnly={favoritesOnly}
          onFavoritesChange={setFavoritesOnly}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onClear={clearFilters}
        />
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
            label={movies.length > 0 ? 'No matches' : 'No movies yet'}
            title={movies.length > 0 ? 'Try adjusting your filters.' : 'Scan a local folder to build your cinema library.'}
            description={movies.length > 0 ? '' : 'Use Settings to add one or more folders. Sky Movie will import files, enrich metadata, and keep the library local-first.'}
          />
        )}
      </section>
    </div>
  );
});
