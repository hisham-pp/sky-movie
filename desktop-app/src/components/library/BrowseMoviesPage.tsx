'use client';

import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Clapperboard, ChevronDown } from 'lucide-react';
import type { Movie, PlayMediaResult } from '@shared/ipc';
import { usePagedList } from '../../hooks/usePagedList';
import { useSessionState, useSessionScroll } from '../../hooks/useSessionState';
import { MovieTile } from './LibraryTile';
import { BannerHero, BannerIndicators } from './BannerHero';
import { EmptyLibraryState } from './EmptyLibraryState';
import { LibraryFilters, type SortBy } from './LibraryFilters';
import { SectionTitle } from './SectionTitle';
import { toDisplayImageUrl } from '../../utils/imageUrl';

export const BrowseMoviesPage = memo(function BrowseMoviesPage({
  movies,
  selectedMovie,
  player,
  onSelectMovie,
  onViewMovieDetails,
  onOpenExternal,
  onToggleFavorite
}: {
  movies: Movie[];
  selectedMovie: Movie | null;
  player: PlayMediaResult | null;
  onSelectMovie(movie: Movie): void;
  onViewMovieDetails(movie: Movie): void;
  onOpenExternal(mediaFileId: number): void;
  onToggleFavorite(mediaKind: 'movie' | 'show', id: number, favorite: boolean): void;
}) {
  // Session-scoped so the page comes back exactly as left after visiting a
  // detail page or another route (#43).
  const [search, setSearch] = useSessionState('movies.search', '');
  const [selectedYear, setSelectedYear] = useSessionState<number | null>('movies.year', null);
  const [minRating, setMinRating] = useSessionState<number | null>('movies.minRating', null);
  const [favoritesOnly, setFavoritesOnly] = useSessionState('movies.favoritesOnly', false);
  const [sortBy, setSortBy] = useSessionState<SortBy>('movies.sortBy', 'default');
  const scrollRef = useSessionScroll('movies.scrollTop');

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
    const q = search.trim().toLowerCase();
    const hasSearch = q.length > 0;

    const list = movies.filter((m) => {
      if (hasSearch && !m.title.toLowerCase().includes(q)) return false;
      if (selectedYear !== null && m.releaseYear !== selectedYear) return false;
      if (minRating !== null && (m.rating === null || m.rating < minRating)) return false;
      if (favoritesOnly && !m.favorite) return false;
      return true;
    });

    if (sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'year') {
      list.sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return list;
  }, [movies, search, selectedYear, minRating, favoritesOnly, sortBy]);

  const moviesWithBackdrop = useMemo(
    () => movies.filter((m) => m.backdropPath || m.posterPath),
    [movies]
  );
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

  const {
    visibleItems: visibleMovies,
    hasMore,
    remaining,
    loadMore,
    sentinelRef
  } = usePagedList(filteredMovies, 'movies.visibleCount');

  const movieCount = filteredMovies.length;

  return (
    <div className="browse-grid">
      <section className="library-list" ref={scrollRef}>
        <BannerHero
          backdropPath={bannerMovie?.backdropPath || bannerMovie?.posterPath || null}
          posterContent={
            bannerMovie?.posterPath ? (
              <img src={toDisplayImageUrl(bannerMovie.posterPath) || ''} alt={bannerMovie.title} />
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
                  onSelect={onSelectMovie}
                  onViewDetailsItem={onViewMovieDetails}
                  onToggleFavoriteItem={onToggleFavorite}
                  isSelected={selectedMovie?.id === movie.id}
                />
              ))}
            </div>
            {hasMore && (
              <div className="load-more-row" ref={sentinelRef}>
                <button className="load-more-btn" onClick={loadMore}>
                  <ChevronDown size={16} />
                  Show more ({remaining} remaining)
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
