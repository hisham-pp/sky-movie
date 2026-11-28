'use client';

import { memo, useCallback, useState, useEffect, useMemo } from 'react';
import { ListMusic, Plus, Search } from 'lucide-react';
import type { Playlist, PlayMediaResult } from '@shared/ipc';
import { BannerHero, BannerIndicators } from './BannerHero';
import { EmptyLibraryState } from './EmptyLibraryState';
import { SectionTitle } from './SectionTitle';
import { Button, PillChip } from '../common';
import { toDisplayImageUrl } from '../../utils/imageUrl';
import { useSessionScroll } from '../../hooks/useSessionState';

/**
 * Thumbnail that automatically switches/slides across posters in the playlist.
 */
const PlaylistThumbnailSlider = memo(function PlaylistThumbnailSlider({
  posters,
  name,
  playlistId
}: {
  posters?: string[];
  name: string;
  playlistId: number;
}) {
  const validPosters = useMemo(
    () => (posters || []).filter((p): p is string => Boolean(p && p.trim())),
    [posters]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);

  useEffect(() => {
    if (validPosters.length <= 1) return;

    // Stagger slide intervals slightly per playlist so cards don't switch simultaneously
    const intervalMs = 3200 + (Math.abs(playlistId) % 4) * 800;
    const timer = setInterval(() => {
      setCurrentIndex((curr) => {
        setPrevIndex(curr);
        return (curr + 1) % validPosters.length;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [validPosters.length, playlistId]);

  useEffect(() => {
    if (prevIndex === null) return;
    const timeout = setTimeout(() => {
      setPrevIndex(null);
    }, 750);
    return () => clearTimeout(timeout);
  }, [prevIndex]);

  if (validPosters.length === 0) {
    return (
      <div className="playlist-cover-art">
        <ListMusic size={38} />
      </div>
    );
  }

  const currentPoster = validPosters[currentIndex];
  const prevPoster = prevIndex !== null ? validPosters[prevIndex] : null;

  return (
    <div className="playlist-slider-wrapper">
      {prevPoster && (
        <img
          key={`prev-${prevIndex}`}
          src={toDisplayImageUrl(prevPoster) || ''}
          alt=""
          className="playlist-slider-img playlist-slider-leaving"
        />
      )}
      <img
        key={`curr-${currentIndex}`}
        src={toDisplayImageUrl(currentPoster) || ''}
        alt={name}
        className="playlist-slider-img playlist-slider-active"
        loading="lazy"
        decoding="async"
      />
      {validPosters.length > 1 && (
        <div className="playlist-slider-bars" aria-hidden="true">
          {validPosters.slice(0, 5).map((_, idx) => (
            <span
              key={idx}
              className={`playlist-slider-bar${idx === (currentIndex % Math.min(validPosters.length, 5)) ? ' active' : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export const BrowsePlaylistsPage = memo(function BrowsePlaylistsPage({
  playlists,
  selectedPlaylist,
  onSelectPlaylist,
  onCreatePlaylist: _onCreatePlaylist,
  showCreateModal: _showCreateModal,
  setShowCreateModal,
  busy,
  player = null,
  onOpenExternal = () => {}
}: {
  playlists: Playlist[];
  selectedPlaylist?: Playlist | null;
  onSelectPlaylist(playlist: Playlist | null): void;
  onCreatePlaylist(name: string, description?: string): void;
  showCreateModal: boolean;
  setShowCreateModal(show: boolean): void;
  busy: boolean;
  player?: PlayMediaResult | null;
  onOpenExternal?: (mediaFileId: number) => void;
}) {
  const [search, setSearch] = useState('');
  const scrollRef = useSessionScroll('playlists.scrollTop');
  const handleOpenCreate = useCallback(() => setShowCreateModal(true), [setShowCreateModal]);

  const filteredPlaylists = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return playlists;
    return playlists.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [playlists, search]);

  const playlistsWithArt = useMemo(
    () =>
      playlists.filter(
        (p) =>
          (p.backdrops && p.backdrops.length > 0) ||
          (p.posters && p.posters.length > 0)
      ),
    [playlists]
  );

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    if (!selectedPlaylist && playlistsWithArt.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % playlistsWithArt.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [selectedPlaylist, playlistsWithArt.length]);

  useEffect(() => {
    if (selectedPlaylist && playlistsWithArt.length > 0) {
      const idx = playlistsWithArt.findIndex((p) => p.id === selectedPlaylist.id);
      if (idx !== -1) setCurrentBannerIndex(idx);
    }
  }, [selectedPlaylist, playlistsWithArt]);

  const featuredPlaylist =
    selectedPlaylist ||
    playlistsWithArt[currentBannerIndex] ||
    playlists[0] ||
    null;

  const totalItems = useMemo(
    () => playlists.reduce((acc, p) => acc + (p.itemCount || 0), 0),
    [playlists]
  );

  const heroBackdrop =
    featuredPlaylist?.backdrops?.[0] || featuredPlaylist?.posters?.[0] || null;

  return (
    <div className="browse-grid">
      <section className="library-list" ref={scrollRef}>
        <BannerHero
          backdropPath={heroBackdrop}
          posterContent={
            featuredPlaylist?.posters?.[0] ? (
              <img
                src={toDisplayImageUrl(featuredPlaylist.posters[0]) || ''}
                alt={featuredPlaylist.name}
              />
            ) : (
              <ListMusic size={34} />
            )
          }
          label={featuredPlaylist ? 'Featured Collection' : 'Playlists'}
          title={featuredPlaylist?.name || 'Your Playlists'}
          overview={
            (featuredPlaylist?.description && featuredPlaylist.description !== featuredPlaylist.name
              ? featuredPlaylist.description
              : null) ||
            'Organize your favorite movies and TV shows into custom collections.'
          }
          badges={
            <>
              <PillChip position="first">
                {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
              </PillChip>
              <PillChip position={featuredPlaylist ? 'middle' : 'last'}>
                {totalItems} total items
              </PillChip>
              {featuredPlaylist && (
                <PillChip position="last">
                  {featuredPlaylist.itemCount} in collection
                </PillChip>
              )}
            </>
          }
          indicators={
            <BannerIndicators
              total={playlistsWithArt.length}
              current={currentBannerIndex}
              onSelect={setCurrentBannerIndex}
            />
          }
          actions={
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                size="medium"
                icon={<Plus size={16} />}
                onClick={handleOpenCreate}
                disabled={busy}
              >
                New Playlist
              </Button>
              {featuredPlaylist && (
                <Button
                  variant="secondary"
                  size="medium"
                  icon={<ListMusic size={16} />}
                  onClick={() => onSelectPlaylist(featuredPlaylist)}
                >
                  Open Collection
                </Button>
              )}
            </div>
          }
          player={player}
          onOpenExternal={onOpenExternal}
        />

        <div
          className="playlist-toolbar-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <SectionTitle title="Your Playlists" count={filteredPlaylists.length} />
          {playlists.length > 0 && (
            <div className="filter-search" style={{ margin: 0 }}>
              <Search size={14} className="filter-search-icon" />
              <input
                className="filter-search-input"
                type="text"
                placeholder="Search playlists…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ minWidth: '220px', borderRadius: '9999px' }}
              />
            </div>
          )}
        </div>

        {filteredPlaylists.length > 0 ? (
          <div className="poster-grid playlist-browse-poster-grid">
            {filteredPlaylists.map((playlist) => (
              <div
                key={playlist.id}
                className="tile playlist-tile"
                onClick={() => onSelectPlaylist(playlist)}
              >
                <div className="poster playlist-card-cover">
                  <PlaylistThumbnailSlider
                    posters={playlist.posters}
                    name={playlist.name}
                    playlistId={playlist.id}
                  />
                  <span className="tile-badge flex items-center gap-1.5">
                    <ListMusic size={11} />
                    <span>{playlist.itemCount} ITEM{playlist.itemCount !== 1 ? 'S' : ''}</span>
                  </span>
                  <span className="tile-overlay">
                    <div className="tile-meta">
                      <strong title={playlist.name}>{playlist.name}</strong>
                      <small>
                        {playlist.description && playlist.description !== playlist.name
                          ? playlist.description
                          : `${playlist.itemCount} item${playlist.itemCount !== 1 ? 's' : ''}`}
                      </small>
                    </div>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : playlists.length > 0 ? (
          <EmptyLibraryState
            icon={<Search size={34} />}
            label="No matching playlists"
            title={`No results for "${search}"`}
            description="Try searching with a different term."
          />
        ) : (
          <EmptyLibraryState
            icon={<ListMusic size={34} />}
            label="No playlists yet"
            title="Create your first playlist"
            description="Organize your favorite movies and TV shows into custom playlists."
          />
        )}
      </section>
    </div>
  );
});
