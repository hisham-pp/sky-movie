'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { ImageModal } from './ExpandableImage';

const TABS = [
  { id: 'movies',    label: 'Movies',      icon: 'movie'         },
  { id: 'shows',     label: 'TV Shows',    icon: 'live_tv'       },
  { id: 'playlists', label: 'Playlists',   icon: 'playlist_play' },
  { id: 'search',    label: 'Search',      icon: 'search'        },
  { id: 'shortcuts', label: 'Shortcuts',   icon: 'keyboard'      },
  { id: 'downloads', label: 'Downloads',   icon: 'download'      },
] as const;
type TabId = typeof TABS[number]['id'];

const SLIDE_MS = 3500;

const SCREENS: Record<TabId, { slides: { src: string; alt: string; caption: string }[] }> = {
  movies: {
    slides: [
      { src: '/screen-shots/movies-hero-carousel.png',     alt: 'Sky Movie — Movies library hero carousel',           caption: 'Hero carousel auto-plays backdrops with metadata overlay' },
      { src: '/screen-shots/movies-floating-player.png',   alt: 'Sky Movie — Movies library with floating player',    caption: 'Keep watching in a floating player while you browse' },
      { src: '/screen-shots/movies-favorites-filter.png',  alt: 'Sky Movie — Movies filtered to favorites',           caption: 'One click to see just your favorites' },
      { src: '/screen-shots/movies-sort-options.png',      alt: 'Sky Movie — Movie sorting options',                  caption: 'Sort your library by title, year or rating' },
      { src: '/screen-shots/movies-year-filter.png',       alt: 'Sky Movie — Movies filtered by year',                caption: 'Filter by release year to find titles fast' },
      { src: '/screen-shots/movie-detail-playback.png',    alt: 'Sky Movie — Movie detail with embedded player',      caption: 'Movie detail view with embedded playback and file actions' },
      { src: '/screen-shots/movie-detail-tmdb-results.png', alt: 'Sky Movie — Movie detail with TMDB metadata search', caption: 'Fix metadata in place with TMDB search results' },
    ],
  },
  shows: {
    slides: [
      { src: '/screen-shots/tv-shows-hero-carousel.png',      alt: 'Sky Movie — TV Shows library hero carousel',      caption: 'Full TV show support with season & episode management' },
      { src: '/screen-shots/tv-shows-floating-player.png',    alt: 'Sky Movie — TV Shows with floating player',       caption: 'Keep watching in a floating player while you browse' },
      { src: '/screen-shots/tv-shows-year-filter.png',        alt: 'Sky Movie — TV Shows filtered by year',           caption: 'Filter shows by first-aired year' },
      { src: '/screen-shots/tv-shows-rating-filter.png',      alt: 'Sky Movie — TV Shows filtered by rating',         caption: 'Surface only the highest-rated shows' },
      { src: '/screen-shots/show-detail-episode-guide.png',   alt: 'Sky Movie — Show detail with episode guide',      caption: 'Episode guide with season browser and series player' },
      { src: '/screen-shots/show-detail-local-files.png',     alt: 'Sky Movie — Show detail with local files',        caption: 'Every episode file tracked, playable and managed in place' },
    ],
  },
  playlists: {
    slides: [
      { src: '/screen-shots/playlists-overview.png',       alt: 'Sky Movie — Playlists overview',                    caption: 'Organize movies and shows into custom collections' },
      { src: '/screen-shots/playlist-create-modal.png',    alt: 'Sky Movie — Create new playlist dialog',            caption: 'Create a playlist with a name and description in seconds' },
      { src: '/screen-shots/playlist-detail-list.png',     alt: 'Sky Movie — Playlist detail in list view',          caption: 'Play all, add items, edit or delete — right from the playlist' },
      { src: '/screen-shots/playlist-detail-grid.png',     alt: 'Sky Movie — Playlist detail in grid view',          caption: 'Switch between list and poster grid views' },
      { src: '/screen-shots/playlist-add-items.png',       alt: 'Sky Movie — Add library items to a playlist',       caption: 'Browse your whole library and add titles with one click' },
      { src: '/screen-shots/playlist-add-from-detail.png', alt: 'Sky Movie — Add to playlist from a movie page',     caption: 'Add any title to a playlist straight from its detail page' },
    ],
  },
  search: {
    slides: [
      { src: '/screen-shots/search-nav.png',     alt: 'Sky Movie search — navigation shortcuts',                caption: 'One keystroke (Ctrl+K) to navigate anywhere in the app' },
      { src: '/screen-shots/search-results.png', alt: 'Sky Movie search — movie results',                       caption: 'Instant fuzzy search across your entire library' },
    ],
  },
  shortcuts: {
    slides: [
      { src: '/screen-shots/keyboard-shortcuts-overlay.png', alt: 'Sky Movie — Keyboard shortcuts overlay "Ctrl+/"', caption: 'Full keyboard control: navigation, library and player shortcuts' },
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

  // Auto-play: advance through the current tab's slides, then move on to the
  // next tab so every category gets its turn. Manual tab/dot clicks reset the
  // timer via the deps; the zoom modal pauses it.
  useEffect(() => {
    if (modal) return;
    const id = setTimeout(() => {
      if (safeSlide + 1 < screens.slides.length) {
        setSlide(safeSlide + 1);
      } else {
        const idx = TABS.findIndex(t => t.id === tab);
        setTab(TABS[(idx + 1) % TABS.length].id);
      }
    }, SLIDE_MS);
    return () => clearTimeout(id);
  }, [tab, safeSlide, screens.slides.length, modal]);

  const close = useCallback(() => setModal(false), []);

  return (
    <div className="relative max-w-5xl mx-auto">
      {/* Tab switcher — one connected pill; the active tab carries a progress
          line synced to the auto-advance timer */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-1 p-1.5 rounded-[24px] bg-white/5 border border-white/10 flex-wrap justify-center">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative overflow-hidden inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.id
                  ? 'bg-primary/15 text-primary'
                  : 'text-secondary hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-base">{t.icon}</span>
              {t.label}
              {tab === t.id && (
                <span
                  key={`${tab}-${safeSlide}`}
                  className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full origin-left bg-primary/70"
                  style={{
                    animation: `tabProgress ${SLIDE_MS}ms linear forwards`,
                    animationPlayState: modal ? 'paused' : 'running',
                  }}
                />
              )}
            </button>
          ))}
        </div>
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
          style={{ animation: 'showcaseSlideIn 0.45s cubic-bezier(0.22, 1, 0.36, 1)' }}
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
      {tab === 'shortcuts' && (
        <p className="text-center text-white/30 text-xs mt-4">
          Press <kbd className="bg-white/8 border border-white/10 rounded px-1.5 py-0.5 text-white/40 text-xs">Ctrl+/</kbd> anywhere in the app to see every shortcut
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
        @keyframes showcaseSlideIn {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes tabProgress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
