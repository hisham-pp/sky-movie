import { ListMusic, Plus } from 'lucide-react';
import type { Playlist } from '@shared/ipc';
import { EmptyLibraryState } from './EmptyLibraryState';
import { LibraryFilters } from './LibraryFilters';
import { SectionTitle } from './SectionTitle';

export function BrowsePlaylistsPage({
  playlists,
  onSelectPlaylist,
  onCreatePlaylist,
  showCreateModal,
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
  return (
    <div className="browse-grid">
      <section className="library-list">
        <div className="hero-strip browse-hero">
          <div className="hero-copy">
            <div className="hero-poster">
              <ListMusic size={34} />
            </div>
            <div>
              <span>Browse library</span>
              <h2>Playlist Library</h2>
              <p>Create and manage your custom playlists with movies and TV shows.</p>
              <div className="hero-chips">
                <span>
                  {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="hero-actions">
                <button
                  className="create-playlist-button"
                  onClick={() => setShowCreateModal(true)}
                  disabled={busy}
                >
                  <Plus size={16} />
                  Create Playlist
                </button>
              </div>
            </div>
          </div>
        </div>

        <LibraryFilters />
        <SectionTitle title="Your Playlists" count={playlists.length} />

        {playlists.length > 0 ? (
          <div className="poster-grid">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="playlist-card"
                onClick={() => onSelectPlaylist(playlist)}
              >
                <div className="playlist-icon">
                  <ListMusic size={32} />
                </div>
                <div className="playlist-info">
                  <h3>{playlist.name}</h3>
                  <p>{playlist.description || 'No description'}</p>
                  <span>
                    {playlist.itemCount} item{playlist.itemCount !== 1 ? 's' : ''}
                  </span>
                </div>
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
}
