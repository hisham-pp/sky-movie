import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Tv2, ChevronDown } from 'lucide-react';
import type { TvShow, PlayMediaResult } from '@shared/ipc';
import { usePagedList } from '../../hooks/usePagedList';
import { ShowTile } from './LibraryTile';
import { BannerHero, BannerIndicators } from './BannerHero';
import { EmptyLibraryState } from './EmptyLibraryState';
import { LibraryFilters, type SortBy } from './LibraryFilters';
import { SectionTitle } from './SectionTitle';

export const BrowseTvShowsPage = memo(function BrowseTvShowsPage({
  shows,
  selectedShow,
  player,
  onSelectShow,
  onViewShowDetails,
  onOpenExternal
}: {
  shows: TvShow[];
  selectedShow: TvShow | null;
  player: PlayMediaResult | null;
  onSelectShow(show: TvShow): void;
  onViewShowDetails(show: TvShow): void;
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
    for (const s of shows) if (s.firstAirYear) set.add(s.firstAirYear);
    return Array.from(set).sort((a, b) => b - a);
  }, [shows]);

  const filteredShows = useMemo(() => {
    let list = shows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) => s.title.toLowerCase().includes(q));
    }
    if (selectedYear !== null) list = list.filter((s) => s.firstAirYear === selectedYear);
    if (minRating !== null) list = list.filter((s) => s.rating !== null && s.rating >= minRating);
    if (favoritesOnly) list = list.filter((s) => s.favorite);
    if (sortBy === 'title') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === 'year') list = [...list].sort((a, b) => (b.firstAirYear ?? 0) - (a.firstAirYear ?? 0));
    else if (sortBy === 'rating') list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return list;
  }, [shows, search, selectedYear, minRating, favoritesOnly, sortBy]);

  const showsWithBackdrop = useMemo(() => shows.filter((s) => s.backdropPath), [shows]);
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
  } = usePagedList(filteredShows);

  const showCount = filteredShows.length;

  return (
    <div className="browse-grid">
      <section className="library-list">
        <BannerHero
          backdropPath={bannerShow?.backdropPath || null}
          posterContent={
            bannerShow?.posterPath ? (
              <img src={bannerShow.posterPath} alt={bannerShow.title} />
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
                {bannerShow.firstAirYear && <span>{bannerShow.firstAirYear}</span>}
                {bannerShow.rating && <span>★ {bannerShow.rating.toFixed(1)}</span>}
              </>
            ) : (
              <span>{shows.length} show{shows.length !== 1 ? 's' : ''}</span>
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
                  onClick={() => onSelectShow(show)}
                  onViewDetails={() => onViewShowDetails(show)}
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
