import { memo } from 'react';
import { ReactNode } from 'react';
import { Play } from 'lucide-react';
import type { PlayMediaResult } from '@shared/ipc';
import { PlayerPanel } from '../PlayerPanel';

export const BannerHero = memo(function BannerHero({
  backdropPath,
  posterContent,
  label,
  title,
  overview,
  badges,
  indicators,
  actions,
  onPlay,
  player,
  onOpenExternal
}: {
  backdropPath: string | null;
  posterContent: ReactNode;
  label: string;
  title: string;
  overview: string | null;
  badges: ReactNode;
  indicators?: ReactNode;
  actions?: ReactNode;
  onPlay?: () => void;
  player: PlayMediaResult | null;
  onOpenExternal: (mediaFileId: number) => void;
}) {
  return (
    <div className="hero-strip browse-hero">
      {backdropPath && (
        <div className="hero-backdrop-fixed">
          <img src={backdropPath} alt="" />
        </div>
      )}
      <div className="hero-copy">
        <div>
          <span>{label}</span>
          <h2 title={title}>{title}</h2>
          <p>{overview}</p>
          <div className="hero-chips">{badges}</div>
          {onPlay && (
            <button className="hero-play-btn" onClick={onPlay} title="Play">
              <Play size={16} fill="currentColor" />
            </button>
          )}
          {actions}
        </div>
      </div>
      {indicators}
      {player && (
        <div className="hero-player">
          <PlayerPanel player={player} onOpenExternal={onOpenExternal} />
        </div>
      )}
    </div>
  );
});

const MAX_DOTS = 30;

export const BannerIndicators = memo(function BannerIndicators({
  total,
  current,
  onSelect
}: {
  total: number;
  current: number;
  onSelect: (index: number) => void;
}) {
  if (total <= 1) return null;

  // When there are more items than MAX_DOTS, show a sliding window of dots
  // centred around the current index.
  let start = 0;
  let end = total;
  if (total > MAX_DOTS) {
    const half = Math.floor(MAX_DOTS / 2);
    start = Math.max(0, current - half);
    end = start + MAX_DOTS;
    if (end > total) {
      end = total;
      start = total - MAX_DOTS;
    }
  }

  return (
    <div className="banner-indicators">
      {Array.from({ length: end - start }, (_, i) => {
        const index = start + i;
        return (
          <button
            key={index}
            className={`banner-dot ${index === current ? 'active' : ''}`}
            onClick={() => onSelect(index)}
            aria-label={`View item ${index + 1}`}
          />
        );
      })}
    </div>
  );
});
