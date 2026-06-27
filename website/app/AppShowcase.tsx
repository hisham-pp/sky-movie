'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { ImageModal } from './ExpandableImage';

const TABS = [
  { id: 'movies',    label: 'Movies',      icon: 'movie'         },
  { id: 'shows',     label: 'TV Shows',    icon: 'live_tv'       },
  { id: 'detail',    label: 'Movie Detail',icon: 'info'          },
  { id: 'tvdetail',  label: 'Show Detail', icon: 'video_library' },
  { id: 'search',    label: 'Search',      icon: 'search'        },
  { id: 'downloads', label: 'Downloads',   icon: 'download'      },
] as const;
type TabId = typeof TABS[number]['id'];

const SCREENS: Record<TabId, { slides: { src: string; alt: string; caption: string }[] }> = {
  movies: {
    slides: [
      { src: '/screen-shots/library-movies-hero.png',   alt: 'Sky Movie — Movies library hero carousel',        caption: 'Hero carousel auto-plays backdrops with metadata overlay' },
      { src: '/screen-shots/library-movies-hero-2.png', alt: 'Sky Movie — Movies library with different hero',  caption: 'Instant backdrop switch as you browse the carousel' },
      { src: '/screen-shots/library-movies-grid.png',   alt: 'Sky Movie — Full movies grid view',               caption: '157 movies displayed in a clean poster grid' },
    ],
  },
  shows: {
    slides: [
      { src: '/screen-shots/library-shows-hero.png',   alt: 'Sky Movie — TV Shows library',                     caption: 'Full TV show support with season & episode management' },
      { src: '/screen-shots/library-shows-player.png', alt: 'Sky Movie — TV Shows with embedded player',        caption: 'Watch directly from the library with the built-in player' },
    ],
  },
  detail: {
    slides: [
      { src: '/screen-shots/movie-detail-player.png',   alt: 'Sky Movie — Movie detail with player',            caption: 'Movie detail view with embedded libmpv player' },
      { src: '/screen-shots/movie-detail-metadata.png', alt: 'Sky Movie — Movie detail with metadata sidebar',  caption: 'TMDB metadata sidebar with related titles' },
    ],
  },
  tvdetail: {
    slides: [
      { src: '/screen-shots/show-detail-episodes.png', alt: 'Sky Movie — Show detail with episode guide',       caption: 'Episode guide with season browser and series player' },
    ],
  },
  search: {
    slides: [
      { src: '/screen-shots/search-nav.png',     alt: 'Sky Movie search — navigation shortcuts',                caption: 'One keystroke (Ctrl+K) to navigate anywhere in the app' },
      { src: '/screen-shots/search-results.png', alt: 'Sky Movie search — movie results',                       caption: 'Instant fuzzy search across your entire library' },
    ],
  },
  downloads: {
    slides: [
      { src: '/screen-shots/torrent-search-results.png',  alt: 'Sky Movie — Torrent search results',       caption: 'Search torrents from YTS, TPB, EZTV and more in one place' },
      { src: '/screen-shots/torrent-search-query.png',    alt: 'Sky Movie — Torrent search with results',  caption: 'Quality badges, seeds/leechers and file size at a glance' },
      { src: '/screen-shots/torrent-downloading.png',     alt: 'Sky Movie — Active torrent download',      caption: 'Real-time download progress with pause, resume and delete' },
      { src: '/screen-shots/torrent-downloads-sidebar.png', alt: 'Sky Movie — Downloads sidebar',          caption: 'Downloads accessible from the sidebar alongside your library' },
      { src: '/screen-shots/torrent-settings.png',        alt: 'Sky Movie — Torrent settings',             caption: 'Full control: speed limits, queue, protocol and behaviour' },
    ],
  },
};

export function AppShowcase() {
  const [tab,   setTab]   = useState<TabId>('movies');
  const [slide, setSlide] = useState(0);
  const [modal, setModal] = useState(false);

  const screens   = SCREENS[tab];
  const safeSlide = Math.min(slide, screens.slides.length - 1);
  const current   = screens.slides[safeSlide];

  useEffect(() => { setSlide(0); }, [tab]);

  useEffect(() => {
    if (screens.slides.length < 2) return;
    const id = setInterval(() => setSlide(i => (i + 1) % screens.slides.length), 3500);
    return () => clearInterval(id);
  }, [tab, screens.slides.length]);

  const close = useCallback(() => setModal(false), []);

  return (
    <div className="relative max-w-5xl mx-auto">
      {/* Tab switcher — scrollable on mobile */}
      <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border whitespace-nowrap ${
              tab === t.id
                ? 'bg-primary/15 border-primary/40 text-primary'
                : 'bg-white/5 border-white/10 text-secondary hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Screenshot frame */}
      <div className="glass-panel p-2 rounded-[28px] shadow-2xl overflow-hidden border-white/10 relative">
        <Image
          key={current.src}
          src={current.src}
          alt={current.alt}
          width={1456}
          height={816}
          quality={90}
          priority={tab === 'movies' && safeSlide === 0}
          className="w-full h-auto block rounded-[20px] cursor-zoom-in"
          style={{ animation: 'showcaseFadeIn 0.35s ease' }}
          onClick={() => setModal(true)}
          draggable={false}
        />

        {/* Caption overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="inline-flex items-center gap-2 text-white/80 text-xs bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full whitespace-nowrap">
            <span className="material-symbols-outlined text-sm text-primary">info</span>
            {current.caption}
          </span>
        </div>

        {/* Slide dots */}
        {screens.slides.length > 1 && (
          <div className="absolute top-4 right-4 flex gap-1.5 pointer-events-auto">
            {screens.slides.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setSlide(i); }}
                style={{
                  width: safeSlide === i ? 20 : 6,
                  height: 6,
                  borderRadius: 9999,
                  background: safeSlide === i ? 'var(--primary, #89ceff)' : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {tab === 'search' && (
        <p className="text-center text-white/30 text-xs mt-4">
          Press <kbd className="bg-white/8 border border-white/10 rounded px-1.5 py-0.5 text-white/40 text-xs">Ctrl+K</kbd> anywhere in the app to open search
        </p>
      )}
      {tab === 'downloads' && (
        <p className="text-center text-white/30 text-xs mt-4">
          Files are automatically renamed to match your library naming convention on completion
        </p>
      )}

      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-2/3 h-20 bg-primary/10 blur-[80px] -z-10 pointer-events-none" />

      {modal && <ImageModal src={current.src} alt={current.alt} onClose={close} />}

      <style>{`
        @keyframes showcaseFadeIn {
          from { opacity: 0; transform: scale(0.995); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
