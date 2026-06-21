import { ReactNode } from 'react';
import type { PlayMediaResult } from '@shared/ipc';
import { PlayerPanel } from '../PlayerPanel';

export function BannerHero({
  backdropPath,
  posterContent,
  title,
  overview,
  badges,
  indicators,
  player,
  onOpenExternal
}: {
  backdropPath: string | null;
  posterContent: ReactNode;
  title: string;
  overview: string | null;
  badges: ReactNode;
  indicators?: ReactNode;
  player: PlayMediaResult | null;
  onOpenExternal: (mediaFileId: number) => void;
}) {
  return (
    <div className="hero-strip browse-hero">
      {backdropPath && <img className="hero-backdrop-image" src={backdropPath} alt="" />}
      <div className="hero-copy">
        <div className="hero-poster">{posterContent}</div>
        <div>
          <span>Browse library</span>
          <h2 title={title}>{title}</h2>
          <p>{overview}</p>
          <div className="hero-chips">{badges}</div>
          {indicators}
        </div>
      </div>
      <div className="hero-player">
        <PlayerPanel player={player} onOpenExternal={onOpenExternal} />
      </div>
    </div>
  );
}

export function BannerIndicators({
  total,
  current,
  onSelect
}: {
  total: number;
  current: number;
  onSelect: (index: number) => void;
}) {
  if (total <= 1) return null;

  return (
    <div className="banner-indicators">
      {Array.from({ length: total }, (_, index) => (
        <button
          key={index}
          className={`banner-dot ${index === current ? 'active' : ''}`}
          onClick={() => onSelect(index)}
          aria-label={`View item ${index + 1}`}
        />
      ))}
    </div>
  );
}
