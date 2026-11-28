'use client';

import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Tv2, ChevronDown } from 'lucide-react';
import type { TvShow, PlayMediaResult } from '@shared/ipc';
import { usePagedList } from '../../hooks/usePagedList';
import { useSessionState, useSessionScroll } from '../../hooks/useSessionState';
import { ShowTile } from './LibraryTile';
import { BannerHero, BannerIndicators } from './BannerHero';
import { EmptyLibraryState } from './EmptyLibraryState';
import { LibraryFilters, type SortBy } from './LibraryFilters';
import { SectionTitle } from './SectionTitle';
import { PillChip } from '../common';
import { toDisplayImageUrl } from '../../utils/imageUrl';

export const BrowseTvShowsPage = memo(function BrowseTvShowsPage({
  shows,
  selectedShow,
  player,
  onSelectShow,
  onViewShowDetails,
  onOpenExternal,
  onToggleFavorite
}: {
  shows: TvShow[];
  selectedShow: TvShow | null;
  player: PlayMediaResult | null;
  onSelectShow(show: TvShow): void;
  onViewShowDetails(show: TvShow): void;
  onOpenExternal(mediaFileId: number): void;
  onToggleFavorite(mediaKind: 'movie' | 'show', id: number, favorite: boolean): void;
}) {
  // Session-scoped so the page comes back exactly as left after visiting a
  // detail page or another route (#43).
  const [search, setSearch] = useSessionState('shows.search', '');
  const [selectedYear, setSelectedYear] = useSessionState<number | null>('shows.year', null);
  const [minRating, setMinRating] = useSessionState<number | null>('shows.minRating', null);
  const [favoritesOnly, setFavoritesOnly] = useSessionState('shows.favoritesOnly', false);
  const [sortBy, setSortBy] = useSessionState<SortBy>('shows.sortBy', 'default');
  const scrollRef = useSessionScroll('shows.scrollTop');

  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedYear(null);
    setMinRating(null);
    setFavoritesOnly(false);
    setSortBy('default');
  }, []);

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const s of shows) if (s.firstAirYear) set.add(s.firstAirYear);
    return Array.from(set).sort((a, b) => b - a);
  }, [shows]);

  const filteredShows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const hasSearch = q.length > 0;

    const list = shows.filter((s) => {
      if (hasSearch && !s.title.toLowerCase().includes(q)) return false;
      if (selectedYear !== null && s.firstAirYear !== selectedYear) return false;
      if (minRating !== null && (s.rating === null || s.rating < minRating)) return false;
      if (favoritesOnly && !s.favorite) return false;
      return true;
    });

    if (sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'year') {
      list.sort((a, b) => (b.firstAirYear ?? 0) - (a.firstAirYear ?? 0));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return list;
  }, [shows, search, selectedYear, minRating, favoritesOnly, sortBy]);

  const showsWithBackdrop = useMemo(
    () => shows.filter((s) => s.backdropPath || s.posterPath),
    [shows]
  );
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    if (!selectedShow && showsWithBackdrop.length > 0) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % showsWithBackdrop.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedShow, showsWithBackdrop.length]);

  useEffect(() => {
    if (selectedShow && showsWithBackdrop.length > 0) {
      const index = showsWithBackdrop.findIndex((s) => s.id === selectedShow.id);
      if (index !== -1) setCurrentBannerIndex(index);
    }
  }, [selectedShow, showsWithBackdrop]);

  const bannerShow = selectedShow || showsWithBackdrop[currentBannerIndex];

  const handleBannerPlay = useCallback(
    () => bannerShow && onSelectShow(bannerShow),
    [bannerShow, onSelectShow],
  );

  const {
    visibleItems: visibleShows,
    hasMore,
    remaining,
    loadMore,
    sentinelRef
  } = usePagedList(filteredShows, 'shows.visibleCount');

  const showCount = filteredShows.length;

  return (
    <div className="browse-grid">
      <section className="library-list" ref={scrollRef}>
        <BannerHero
          backdropPath={bannerShow?.backdropPath || bannerShow?.posterPath || null}
          posterContent={
            bannerShow?.posterPath ? (
              <img src={toDisplayImageUrl(bannerShow.posterPath) || ''} alt={bannerShow.title} />
            ) : (
              <Tv2 size={34} />
            )
          }
          label={bannerShow ? 'Now Playing' : 'Browse library'}
          title={bannerShow?.title || 'Series Library'}
          overview={
            bannerShow?.overview ||
            'Browse local TV shows, open a series page, and review seasons, episodes, and files.'
          }
          badges={
            bannerShow ? (
              <>
                {bannerShow.firstAirYear && (
                  <PillChip position={bannerShow.rating ? 'middle' : 'last'}>
                    {bannerShow.firstAirYear}
                  </PillChip>
                )}
                {bannerShow.rating && (
                  <PillChip position="last">
                    ★ {bannerShow.rating.toFixed(1)}
                  </PillChip>
                )}
              </>
            ) : (
              <PillChip position="single" variant="primary">
                {shows.length} show{shows.length !== 1 ? 's' : ''}
              </PillChip>
            )
          }
          indicators={
            <BannerIndicators
              total={showsWithBackdrop.length}
              current={currentBannerIndex}
              onSelect={setCurrentBannerIndex}
            />
          }
          onPlay={bannerShow ? handleBannerPlay : undefined}
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
        <SectionTitle title="Current TV Shows" count={showCount} />

        {showCount > 0 ? (
          <>
            <div className="poster-grid">
              {visibleShows.map((show) => (
                <ShowTile
                  key={show.id}
                  show={show}
                  onSelect={onSelectShow}
                  onViewDetailsItem={onViewShowDetails}
                  onToggleFavoriteItem={onToggleFavorite}
                  isSelected={selectedShow?.id === show.id}
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
            icon={<Tv2 size={34} />}
            label={shows.length > 0 ? 'No matches' : 'No TV shows yet'}
            title={shows.length > 0 ? 'Try adjusting your filters.' : 'Scan a local folder to build your cinema library.'}
            description={shows.length > 0 ? '' : 'Use Settings to add one or more folders. Sky Movie will import files, enrich metadata, and keep the library local-first.'}
          />
        )}
      </section>
    </div>
  );
});
