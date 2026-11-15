import { memo, useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Star, ChevronLeft, ChevronRight, Check, Search } from 'lucide-react';
import type {
  MediaRelationItem,
  MediaRecommendationItem,
  MediaRelationsAndRecommendationsResult
} from '@shared/ipc';
import { getMediaRelationsAndRecommendations } from '@renderer/queries';
import { Tooltip } from '../common';

interface MediaRelationsAndRecommendationsProps {
  mediaKind: 'movie' | 'show';
  id: number;
  title: string;
  releaseYear?: number | null;
}

export const MediaRelationsAndRecommendations = memo(function MediaRelationsAndRecommendations({
  mediaKind,
  id,
  title,
  releaseYear
}: MediaRelationsAndRecommendationsProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<MediaRelationsAndRecommendationsResult | null>(null);
  const [loading, setLoading] = useState(false);

  const recScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getMediaRelationsAndRecommendations({
      mediaKind,
      id,
      title,
      year: releaseYear
    })
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load relations/recommendations:', err);
        if (!cancelled) {
          setData({ relations: [], recommendations: [] });
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mediaKind, id, title, releaseYear]);

  const updateScrollState = useCallback(() => {
    const el = recScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = recScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [data?.recommendations, updateScrollState]);

  const scrollRecommendations = (direction: 'left' | 'right') => {
    const el = recScrollRef.current;
    if (!el) return;
    const scrollAmount = (el.clientWidth * 0.75) * (direction === 'left' ? -1 : 1);
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleItemClick = (item: MediaRelationItem | MediaRecommendationItem) => {
    if (item.inLibrary && item.libraryItemId) {
      if (item.mediaKind === 'movie') {
        navigate(`/movies/${item.libraryItemId}`);
      } else {
        navigate(`/shows/${item.libraryItemId}`);
      }
    } else {
      // Deep link to torrent search tab with this title
      navigate(`/torrents?tab=search&q=${encodeURIComponent(item.title)}`);
    }
  };

  const hasRelations = Boolean(data && data.relations && data.relations.length > 0);
  const hasRecommendations = Boolean(data && data.recommendations && data.recommendations.length > 0);

  if (!hasRelations && !hasRecommendations && !loading) {
    return null;
  }

  return (
    <div className="media-relations-and-recommendations-wrapper">
      {/* ── Relations Section ────────────────────────────────────────────── */}
      {hasRelations && (
        <section className="relations-section">
          <div className="section-title">
            <h2>Relations</h2>
          </div>

          <div className="media-cards-scroll-container">
            {data!.relations.map((item) => (
              <Tooltip
                key={item.id}
                content={
                  item.inLibrary
                    ? `Open ${item.title} (In Library)`
                    : `Search download for "${item.title}"`
                }
              >
                <button
                  type="button"
                  className="media-relation-card"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="media-card-poster-wrap">
                    {item.posterPath ? (
                      <img
                        className="media-card-poster"
                        src={item.posterPath}
                        alt={item.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="media-card-poster-fallback">
                        <Film size={28} />
                      </div>
                    )}

                    {/* Top Right Relation Type Badge */}
                    <span className={`relation-type-badge ${item.relationType}`}>
                      {item.relationLabel}
                    </span>

                    {/* Top Left Library Status Badge */}
                    {item.inLibrary ? (
                      <span className="in-library-badge" title="Already in your library">
                        <Check size={10} className="inline mr-0.5" />
                        In Library
                      </span>
                    ) : (
                      <span className="search-library-badge" title="Find download">
                        <Search size={10} className="inline mr-0.5" />
                        Get
                      </span>
                    )}

                    {/* Bottom Left: Episodes Count */}
                    {item.episodesCount != null && item.episodesCount > 0 && (
                      <span className="card-bottom-left-badge">
                        {item.episodesCount > 1
                          ? `${item.episodesCount}/${item.episodesCount}`
                          : `${item.episodesCount} ep`}
                      </span>
                    )}

                    {/* Bottom Right: Rating */}
                    {item.rating != null && (
                      <span className="card-bottom-right-badge">
                        <Star size={11} fill="currentColor" />
                        {item.rating}
                      </span>
                    )}
                  </div>

                  <span className="media-card-title">{item.title}</span>
                  <span className="media-card-subtitle">
                    {item.seasonLabel || (item.releaseYear ? String(item.releaseYear) : '')}
                  </span>
                </button>
              </Tooltip>
            ))}
          </div>
        </section>
      )}

      {/* ── Recommendations Section ───────────────────────────────────────── */}
      {hasRecommendations && (
        <section className="recommendations-section">
          <div className="section-title">
            <h2>Recommendations</h2>
            <div className="recommendations-scroll-arrows">
              <button
                type="button"
                className={`rec-scroll-arrow-btn ${!canScrollLeft ? 'disabled' : ''}`}
                onClick={() => scrollRecommendations('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className={`rec-scroll-arrow-btn ${!canScrollRight ? 'disabled' : ''}`}
                onClick={() => scrollRecommendations('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="media-cards-scroll-container" ref={recScrollRef}>
            {data!.recommendations.map((item) => (
              <Tooltip
                key={item.id}
                content={
                  item.inLibrary
                    ? `Open ${item.title} (In Library)`
                    : `Search download for "${item.title}"`
                }
              >
                <button
                  type="button"
                  className="media-recommendation-card"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="media-card-poster-wrap">
                    {item.posterPath ? (
                      <img
                        className="media-card-poster"
                        src={item.posterPath}
                        alt={item.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="media-card-poster-fallback">
                        <Film size={28} />
                      </div>
                    )}

                    {/* Top Left Library Status Badge */}
                    {item.inLibrary ? (
                      <span className="in-library-badge" title="Already in your library">
                        <Check size={10} className="inline mr-0.5" />
                        In Library
                      </span>
                    ) : (
                      <span className="search-library-badge" title="Find download">
                        <Search size={10} className="inline mr-0.5" />
                        Get
                      </span>
                    )}

                    {/* Bottom Right: Rating */}
                    {item.rating != null && (
                      <span className="card-bottom-right-badge">
                        <Star size={11} fill="currentColor" />
                        {item.rating}
                      </span>
                    )}
                  </div>

                  <span className="media-card-title">{item.title}</span>
                  <span className="media-card-subtitle">
                    {item.releaseYear ? `${item.releaseYear}` : ''}
                  </span>
                </button>
              </Tooltip>
            ))}
          </div>
        </section>
      )}
    </div>
  );
});
