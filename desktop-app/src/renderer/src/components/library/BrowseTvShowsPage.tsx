import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Tv2, ChevronDown } from 'lucide-react';
import type { TvShow, PlayMediaResult } from '@shared/ipc';
import { ShowTile } from '../LibraryTile';
import { BannerHero, BannerIndicators } from './BannerHero';
import { EmptyLibraryState } from './EmptyLibraryState';
import { LibraryFilters } from './LibraryFilters';
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

  const PAGE_SIZE = 100;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [shows]);
  const visibleShows = useMemo(() => shows.slice(0, visibleCount), [shows, visibleCount]);
  const handleLoadMore = useCallback(() => setVisibleCount((c) => c + PAGE_SIZE), []);

  const showCount = shows.length;

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
              <span>{showCount} show{showCount !== 1 ? 's' : ''}</span>
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

        <LibraryFilters />
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
            {visibleCount < showCount && (
              <div className="load-more-row">
                <button className="load-more-btn" onClick={handleLoadMore}>
                  <ChevronDown size={16} />
                  Show more ({showCount - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyLibraryState
            icon={<Tv2 size={34} />}
            label="No TV shows yet"
            title="Scan a local folder to build your cinema library."
            description="Use Settings to add one or more folders. Sky Movie will import files, enrich metadata, and keep the library local-first."
          />
        )}
      </section>
    </div>
  );
});
