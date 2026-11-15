import { memo, useCallback } from 'react';
import { ListMusic, Plus } from 'lucide-react';
import type { Playlist } from '@shared/ipc';
import { EmptyLibraryState } from './EmptyLibraryState';
import { SectionTitle } from './SectionTitle';
import { Button } from '../common';

export const BrowsePlaylistsPage = memo(function BrowsePlaylistsPage({
  playlists,
  onSelectPlaylist,
  onCreatePlaylist: _onCreatePlaylist,
  showCreateModal: _showCreateModal,
  setShowCreateModal,
  busy
}: {
  playlists: Playlist[];
  onSelectPlaylist(playlist: Playlist | null): void;
  onCreatePlaylist(name: string, description?: string): void;
  showCreateModal: boolean;
  setShowCreateModal(show: boolean): void;
  busy: boolean;
}) {
  const handleOpenCreate = useCallback(() => setShowCreateModal(true), [setShowCreateModal]);

  return (
    <div className="browse-grid">
      <section className="library-list">
        <div className="playlist-browse-header">
          <div className="playlist-browse-header-icon">
            <ListMusic size={28} />
          </div>
          <div className="playlist-browse-header-text">
            <span className="playlist-browse-kicker">Collection</span>
            <h1>Playlists</h1>
            <p>Organize your favorite movies and TV shows into custom collections.</p>
          </div>
          <Button
            variant="primary"
            size="medium"
            icon={<Plus size={16} />}
            onClick={handleOpenCreate}
            disabled={busy}
          >
            New Playlist
          </Button>
        </div>

        <SectionTitle title="Your Playlists" count={playlists.length} />

        {playlists.length > 0 ? (
          <div className="poster-grid playlist-browse-poster-grid">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="tile playlist-tile"
                onClick={() => onSelectPlaylist(playlist)}
              >
                <div className="poster playlist-card-cover">
                  <div className="playlist-cover-art">
                    <ListMusic size={38} />
                  </div>
                  <span className="tile-badge">
                    {playlist.itemCount} ITEM{playlist.itemCount !== 1 ? 'S' : ''}
                  </span>
                  <span className="tile-overlay">
                    <strong>{playlist.name}</strong>
                    <small>{playlist.description || `${playlist.itemCount} items`}</small>
                  </span>
                </div>
                <strong>{playlist.name}</strong>
                <span>{playlist.itemCount} item{playlist.itemCount !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
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
