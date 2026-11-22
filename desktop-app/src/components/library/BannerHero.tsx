'use client';

import { memo, useState, useEffect } from 'react';
import { ReactNode } from 'react';
import { Play } from 'lucide-react';
import type { PlayMediaResult } from '@shared/ipc';
import { PillButton, PillButtonGroup } from '../common';
import { toDisplayImageUrl } from '../../utils/imageUrl';

const BannerBackdrop = memo(function BannerBackdrop({ src }: { src: string | null }) {
  const displaySrc = toDisplayImageUrl(src);
  const [current, setCurrent] = useState<string | null>(displaySrc);
  const [prev, setPrev] = useState<string | null>(null);

  useEffect(() => {
    if (displaySrc === current) return;
    setPrev(current);
    setCurrent(displaySrc);
    if (!displaySrc) return;

    const timer = setTimeout(() => {
      setPrev(null);
    }, 480);
    return () => clearTimeout(timer);
  }, [displaySrc, current]);

  if (!current && !prev) return null;

  return (
    <div className="hero-backdrop-fixed" aria-hidden="true">
      {prev && (
        <img
          key={prev}
          src={prev}
          alt=""
          className="hero-backdrop-img fading-out"
        />
      )}
      {current && (
        <img
          key={current}
          src={current}
          alt=""
          className="hero-backdrop-img fading-in"
        />
      )}
    </div>
  );
});

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
      <svg
        style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
        aria-hidden="true"
        focusable="false"
      >
        <filter id="banner-sharpen" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="blurred" />
          <feComposite in="SourceGraphic" in2="blurred" operator="arithmetic" k1="0" k2="1.45" k3="-0.45" k4="0" />
        </filter>
      </svg>
      <BannerBackdrop src={backdropPath} />
      <div className="hero-copy">
        <div>
          <span>{label}</span>
          <h2 title={title}>{title}</h2>
          <p>{overview}</p>
          <PillButtonGroup className="hero-chips" aria-label="Featured media">
            {onPlay && (
              <PillButton
                position="first"
                variant="primary"
                tooltip="Play"
                aria-label="Play"
                icon={<Play size={15} fill="currentColor" />}
                onClick={onPlay}
              />
            )}
            {badges}
          </PillButtonGroup>
          {actions}
        </div>
      </div>
      {indicators}
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
