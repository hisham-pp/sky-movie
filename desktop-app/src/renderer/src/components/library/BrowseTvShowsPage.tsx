import { useState, useEffect } from 'react';
import { Tv2 } from 'lucide-react';
import type { TvShow, PlayMediaResult } from '@shared/ipc';
import { ShowTile } from '../LibraryTile';
import { BannerHero, BannerIndicators } from './BannerHero';
import { EmptyLibraryState } from './EmptyLibraryState';
import { LibraryFilters } from './LibraryFilters';
import { SectionTitle } from './SectionTitle';

export function BrowseTvShowsPage({
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
  const showsWithBackdrop = shows.filter((s) => s.backdropPath);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Auto-rotate banner only when nothing is selected
  useEffect(() => {
    if (!selectedShow && showsWithBackdrop.length > 0) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % showsWithBackdrop.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedShow, showsWithBackdrop.length]);

  // Update banner index when show is selected
  useEffect(() => {
    if (selectedShow && showsWithBackdrop.length > 0) {
      const index = showsWithBackdrop.findIndex((s) => s.id === selectedShow.id);
      if (index !== -1) {
        setCurrentBannerIndex(index);
      }
    }
  }, [selectedShow, showsWithBackdrop]);

  const bannerShow = selectedShow || showsWithBackdrop[currentBannerIndex];

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
          player={player}
          onOpenExternal={onOpenExternal}
        />

        <LibraryFilters />
        <SectionTitle title="Current TV Shows" count={shows.length} />

        {shows.length > 0 ? (
          <div className="poster-grid">
            {shows.map((show) => (
              <ShowTile
                key={show.id}
                show={show}
                onClick={() => onSelectShow(show)}
                onViewDetails={() => onViewShowDetails(show)}
                isSelected={selectedShow?.id === show.id}
              />
            ))}
          </div>
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
}
