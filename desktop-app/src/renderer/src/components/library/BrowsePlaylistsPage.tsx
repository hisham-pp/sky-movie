import { ListMusic, Plus } from 'lucide-react';
import type { Playlist } from '@shared/ipc';
import { EmptyLibraryState } from './EmptyLibraryState';
import { SectionTitle } from './SectionTitle';

export function BrowsePlaylistsPage({
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
  return (
    <div className="browse-grid">
      <section className="library-list">
        {/* Page header */}
        <div className="playlist-browse-header">
          <div className="playlist-browse-header-icon">
            <ListMusic size={28} />
          </div>
          <div className="playlist-browse-header-text">
            <span className="playlist-browse-kicker">Library</span>
            <h1>Playlists</h1>
            <p>Organize your favorite movies and TV shows into custom collections.</p>
          </div>
          <button
            className="playlist-browse-create-btn"
            onClick={() => setShowCreateModal(true)}
            disabled={busy}
          >
            <Plus size={16} />
            New Playlist
          </button>
        </div>

        <SectionTitle title="Your Playlists" count={playlists.length} />

        {playlists.length > 0 ? (
          <div className="playlist-browse-grid">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                className="playlist-browse-card"
                onClick={() => onSelectPlaylist(playlist)}
              >
                <div className="playlist-browse-card-icon">
                  <ListMusic size={28} />
                </div>
                <div className="playlist-browse-card-body">
                  <strong>{playlist.name}</strong>
                  {playlist.description && <p>{playlist.description}</p>}
                  <span>{playlist.itemCount} item{playlist.itemCount !== 1 ? 's' : ''}</span>
                </div>
              </button>
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
