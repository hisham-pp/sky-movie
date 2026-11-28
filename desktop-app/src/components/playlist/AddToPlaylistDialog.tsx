'use client';

import { memo, useMemo, useState, useCallback } from 'react';
import { Film, Tv, Plus, Layers, Search } from 'lucide-react';
import type { Playlist, PlaylistItem, Movie, TvShow } from '@shared/ipc';
import { Modal, PillTabs, type PillTab } from '../common';
import { toDisplayImageUrl } from '../../utils/imageUrl';

interface AddToPlaylistDialogProps {
  playlist: Playlist;
  movies: Movie[];
  shows: TvShow[];
  existingItems: PlaylistItem[];
  busy: boolean;
  onAdd(mediaKind: 'movie' | 'show', itemId: number): void;
  onClose(): void;
}

type TabKey = 'all' | 'movies' | 'shows';

type AvailableItem =
  | { kind: 'movie'; data: Movie; sortTitle: string }
  | { kind: 'show'; data: TvShow; sortTitle: string };

export const AddToPlaylistDialog = memo(function AddToPlaylistDialog({
  playlist,
  movies,
  shows,
  existingItems,
  busy,
  onAdd,
  onClose
}: AddToPlaylistDialogProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const existingMovieIds = useMemo(
    () => new Set(existingItems.filter((i) => i.mediaKind === 'movie').map((i) => i.movieId)),
    [existingItems],
  );
  const existingShowIds = useMemo(
    () => new Set(existingItems.filter((i) => i.mediaKind === 'show').map((i) => i.showId)),
    [existingItems],
  );

  const q = searchQuery.toLowerCase().trim();

  const filteredMovies = useMemo(
    () => movies.filter((m) => !existingMovieIds.has(m.id) && (q === '' || m.title.toLowerCase().includes(q))),
    [movies, existingMovieIds, q],
  );

  const filteredShows = useMemo(
    () => shows.filter((s) => !existingShowIds.has(s.id) && (q === '' || s.title.toLowerCase().includes(q))),
    [shows, existingShowIds, q],
  );

  const filteredAll = useMemo<AvailableItem[]>(() => {
    const list: AvailableItem[] = [
      ...filteredMovies.map((m): AvailableItem => ({ kind: 'movie', data: m, sortTitle: m.title })),
      ...filteredShows.map((s): AvailableItem => ({ kind: 'show', data: s, sortTitle: s.title }))
    ];
    return list.sort((a, b) => a.sortTitle.localeCompare(b.sortTitle));
  }, [filteredMovies, filteredShows]);

  const tabs: PillTab<TabKey>[] = useMemo(
    () => [
      {
        id: 'all',
        label: `All (${filteredAll.length})`,
        icon: <Layers size={14} />,
      },
      {
        id: 'movies',
        label: `Movies (${filteredMovies.length})`,
        icon: <Film size={14} />,
      },
      {
        id: 'shows',
        label: `TV Shows (${filteredShows.length})`,
        icon: <Tv size={14} />,
      },
    ],
    [filteredAll.length, filteredMovies.length, filteredShows.length],
  );

  const itemsToRender = useMemo<AvailableItem[]>(() => {
    if (activeTab === 'movies') {
      return filteredMovies.map((m) => ({ kind: 'movie', data: m, sortTitle: m.title }));
    }
    if (activeTab === 'shows') {
      return filteredShows.map((s) => ({ kind: 'show', data: s, sortTitle: s.title }));
    }
    return filteredAll;
  }, [activeTab, filteredMovies, filteredShows, filteredAll]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <Modal isOpen={true} onClose={onClose} title={`Add to ${playlist.name}`} maxWidth="large">
      <div className="add-to-playlist-tabs-wrapper">
        <PillTabs<TabKey>
          tabs={tabs}
          value={activeTab}
          onChange={setActiveTab}
          size="medium"
          ariaLabel="Filter media type"
        />
      </div>

      <div className="add-to-playlist-search">
        <input
          type="text"
          placeholder={
            activeTab === 'all'
              ? 'Search all available titles…'
              : activeTab === 'movies'
                ? 'Search movies…'
                : 'Search TV shows…'
          }
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className="add-to-playlist-list">
        {itemsToRender.length > 0 ? (
          itemsToRender.map((item) => {
            const isMovie = item.kind === 'movie';
            const poster = toDisplayImageUrl(item.data.posterPath);
            const year = isMovie
              ? (item.data as Movie).releaseYear
              : (item.data as TvShow).firstAirYear;
            const kindLabel = isMovie ? 'Movie' : 'TV Show';

            return (
              <button
                key={`${item.kind}-${item.data.id}`}
                className="add-to-playlist-item"
                onClick={() => onAdd(item.kind, item.data.id)}
                disabled={busy}
              >
                <div className="add-to-playlist-item-poster">
                  {poster ? (
                    <img src={poster} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <div className="add-to-playlist-item-poster-placeholder">
                      {isMovie ? <Film size={20} /> : <Tv size={20} />}
                    </div>
                  )}
                </div>
                <div className="add-to-playlist-item-info">
                  <strong>{item.data.title}</strong>
                  <small>{year ? `${year} • ${kindLabel}` : kindLabel}</small>
                </div>
                <Plus size={16} />
              </button>
            );
          })
        ) : (
          <div className="add-to-playlist-empty">
            {q ? (
              <>
                <Search size={32} />
                <span>No matching titles</span>
                <p>No results found for &ldquo;{searchQuery}&rdquo;</p>
              </>
            ) : activeTab === 'movies' ? (
              <>
                <Film size={32} />
                <span>No movies available</span>
                <p>All movies are already in this playlist or your library is empty</p>
              </>
            ) : activeTab === 'shows' ? (
              <>
                <Tv size={32} />
                <span>No TV shows available</span>
                <p>All shows are already in this playlist or your library is empty</p>
              </>
            ) : (
              <>
                <Layers size={32} />
                <span>No titles available</span>
                <p>All titles in your library are already in this playlist</p>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
});
