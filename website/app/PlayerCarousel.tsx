'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ImageModal } from './ExpandableImage';

interface Slide {
  src: string;
  alt: string;
  label: string;
  caption: string;
  features: { icon: string; label: string }[];
}

const SLIDES: Slide[] = [
  {
    src: '/screen-shots/player-default.png',
    alt: 'Sky Movie default player with full controls',
    label: 'Default Skin',
    caption: 'Classic controls — seek bar, volume, audio & subtitle tracks, fullscreen',
    features: [
      { icon: 'play_circle',    label: 'Play / Pause' },
      { icon: 'volume_up',      label: 'Volume Boost' },
      { icon: 'closed_caption', label: 'Subtitles' },
      { icon: 'speed',          label: 'Playback Speed' },
      { icon: 'fullscreen',     label: 'Fullscreen' },
    ],
  },
  {
    src: '/screen-shots/default-player-minimized.png',
    alt: 'Sky Movie player minimal seek bar OSD',
    label: 'Minimal OSD',
    caption: 'Seek without showing controls — thin progress bar + time OSD stays out of the way',
    features: [
      { icon: 'bar_chart',   label: 'Progress Bar' },
      { icon: 'timer',       label: 'Time OSD' },
      { icon: 'hide_source', label: 'Auto-hide UI' },
    ],
  },
  {
    src: '/screen-shots/yt-player.png',
    alt: 'Sky Movie YouTube-style player skin',
    label: 'YouTube Skin',
    caption: 'Glass pill controls · nested settings · everything in two taps',
    features: [
      { icon: 'bedtime',        label: 'Sleep Timer' },
      { icon: 'speed',          label: 'Playback Speed' },
      { icon: 'closed_caption', label: 'Subtitle Tracks' },
      { icon: 'graphic_eq',     label: 'Stable Volume' },
      { icon: 'mic',            label: 'Voice Boost' },
      { icon: 'volume_up',      label: 'Audio Tracks' },
    ],
  },
];

export function PlayerCarousel() {
  const [active,  setActive]  = useState(0);
  const [hovered, setHovered] = useState(false);
  const [modal,   setModal]   = useState(false);

  const prev  = () => setActive(i => (i - 1 + SLIDES.length) % SLIDES.length);
  const next  = () => setActive(i => (i + 1) % SLIDES.length);
  const close = useCallback(() => setModal(false), []);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [modal, close]);

  const slide = SLIDES[active];

  return (
    <div className="relative max-w-5xl mx-auto mb-24 select-none">

      {/* Main image frame */}
      <div
        className="relative glass-panel rounded-2xl overflow-hidden shadow-2xl border-white/10"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Image
          src={slide.src}
          alt={slide.alt}
          width={1456}
          height={816}
          quality={90}
          priority={active === 0}
          className="w-full h-auto block cursor-zoom-in"
          onClick={() => setModal(true)}
          draggable={false}
        />

        {/* Feature chips overlay on hover */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-end pb-8 px-6 transition-opacity duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)',
          }}
        >
          <p className="text-white/70 text-xs mb-3 text-center">{slide.caption}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {slide.features.map(f => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 text-white text-xs bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full"
              >
                <span className="material-symbols-outlined text-sm" style={{ color: 'var(--tw-text-opacity, 1)' }}>
                  {f.icon}
                </span>
                {f.label}
              </span>
            ))}
          </div>
        </div>

        {/* Prev / Next arrow buttons */}
        <button
          onClick={e => { e.stopPropagation(); prev(); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white hover:bg-black/60 transition-all"
          aria-label="Previous"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        <button
          onClick={e => { e.stopPropagation(); next(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white hover:bg-black/60 transition-all"
          aria-label="Next"
        >
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>

        {/* Skin label badge */}
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-white text-xs bg-black/50 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-full">
          <span className="material-symbols-outlined text-sm text-primary">style</span>
          {slide.label}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {SLIDES.map((s, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={s.label}
            className="transition-all duration-200"
            style={{
              width: active === i ? 24 : 8,
              height: 8,
              borderRadius: 9999,
              background: active === i ? 'var(--primary, #89ceff)' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>

      {/* Glow */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-2/3 h-16 bg-primary/15 blur-[60px] -z-10 pointer-events-none" />

      {/* Full-size modal */}
      {modal && <ImageModal src={slide.src} alt={slide.alt} onClose={close} />}
    </div>
  );
}
