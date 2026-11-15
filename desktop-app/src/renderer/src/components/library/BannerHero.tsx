import { memo, useState, useEffect } from 'react';
import { ReactNode } from 'react';
import { Play } from 'lucide-react';
import type { PlayMediaResult } from '@shared/ipc';
import { Tooltip } from '../common';

interface BackdropLayer {
  id: string;
  src: string;
  active: boolean;
}

const BannerBackdrop = memo(function BannerBackdrop({ src }: { src: string | null }) {
  const [layers, setLayers] = useState<BackdropLayer[]>(() =>
    src ? [{ id: `${src}-init`, src, active: true }] : []
  );

  useEffect(() => {
    if (!src) return;

    let cancelled = false;
    let rafId: number | null = null;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const startTransition = () => {
      if (cancelled) return;

      setLayers((prev) => {
        const current = prev[prev.length - 1];
        if (current && current.src === src) return prev;
        const base = prev.slice(-1).map((l) => ({ ...l, active: true }));
        return [...base, { id: `${src}-${Date.now()}`, src, active: false }];
      });

      rafId = requestAnimationFrame(() => {
        if (cancelled) return;
        setLayers((prev) =>
          prev.map((layer, index) =>
            index === prev.length - 1 ? { ...layer, active: true } : { ...layer, active: false }
          )
        );
      });

      timerId = setTimeout(() => {
        if (cancelled) return;
        setLayers((prev) => prev.slice(-1));
      }, 1200);
    };

    const img = new Image();
    img.src = src;
    if (img.complete) {
      startTransition();
    } else {
      img.onload = () => {
        if (!cancelled) startTransition();
      };
      img.onerror = () => {
        if (!cancelled) startTransition();
      };
    }

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (timerId) clearTimeout(timerId);
    };
  }, [src]);

  if (layers.length === 0) return null;

  return (
    <div className="hero-backdrop-fixed">
      {layers.map((layer) => (
        <img
          key={layer.id}
          src={layer.src}
          alt=""
          className={`hero-backdrop-img ${layer.active ? 'active' : ''}`}
        />
      ))}
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
      <BannerBackdrop src={backdropPath} />
      <div className="hero-copy">
        <div>
          <span>{label}</span>
          <h2 title={title}>{title}</h2>
          <p>{overview}</p>
          <div className="hero-chips">{badges}</div>
          {onPlay && (
            <Tooltip content="Play">
              <button className="hero-play-btn" onClick={onPlay} aria-label="Play">
                <Play size={16} fill="currentColor" />
              </button>
            </Tooltip>
          )}
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
