import { useState, useEffect } from 'react';
import { Clapperboard, Tv2, ListMusic, Plus } from 'lucide-react';
import type { Movie, TvShow, Playlist, ScanResult, PlayMediaResult } from '@shared/ipc';
import type { ViewMode } from '../../types';
import { MovieTile, ShowTile } from '../LibraryTile';
import { PlayerPanel } from '../PlayerPanel';

export function BrowseLibraryPage({
  view,
  movies,
  shows,
  playlists,
  selectedMovie,
  selectedShow,
  selectedTitle,
  player,
  lastScan,
  onSelectMovie,
  onSelectShow,
  onSelectPlaylist,
  onViewMovieDetails,
  onViewShowDetails,
  onOpenExternal,
  onCreatePlaylist,
  showCreateModal,
  setShowCreateModal,
  busy
}: {
  view: Exclude<ViewMode, 'settings' | 'scan'>;
  movies: Movie[];
  shows: TvShow[];
  playlists: Playlist[];
  selectedMovie: Movie | null;
  selectedShow: TvShow | null;
  selectedTitle: string;
  player: PlayMediaResult | null;
  lastScan: ScanResult | null;
  onSelectMovie(movie: Movie): void;
  onSelectShow(show: TvShow): void;
  onSelectPlaylist(playlist: Playlist | null): void;
  onViewMovieDetails(movie: Movie): void;
  onViewShowDetails(show: TvShow): void;
  onOpenExternal(mediaFileId: number): void;
  onCreatePlaylist(name: string, description?: string): void;
  showCreateModal: boolean;
  setShowCreateModal(show: boolean): void;
  busy: boolean;
}) {
  const visibleCount = view === 'movies' ? movies.length : view === 'shows' ? shows.length : playlists.length;
  const heroTitle = view === 'movies' ? 'Movie Library' : view === 'shows' ? 'Series Library' : 'Playlist Library';
  const heroCopy =
    view === 'movies'
      ? 'Browse local films, open a movie page, and play files from your private collection.'
      : view === 'shows'
      ? 'Browse local TV shows, open a series page, and review seasons, episodes, and files.'
      : 'Create and manage your custom playlists with movies and TV shows.';

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const items = view === 'movies' ? movies : view === 'shows' ? shows : playlists;
  const itemsWithBackdrop = items.filter((item) => 
    view === 'movies' ? (item as Movie).backdropPath : view === 'shows' ? (item as TvShow).backdropPath : false
  );

  useEffect(() => {
    if (itemsWithBackdrop.length > 0) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % itemsWithBackdrop.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [itemsWithBackdrop.length]);

  const currentBannerItem = itemsWithBackdrop[currentBannerIndex];
  const currentBannerPath = currentBannerItem
    ? (view === 'movies' ? (currentBannerItem as Movie).backdropPath : view === 'shows' ? (currentBannerItem as TvShow).backdropPath : null)
    : null;

  return (
    <div className="browse-grid">
      <section className="library-list">
        {currentBannerItem && (
          <div className="hero-strip browse-hero">
            {currentBannerPath && <img className="hero-backdrop-image" src={currentBannerPath} alt="" />}
            <div className="hero-copy">
              <div className="hero-poster">
                {view === 'movies' ? <Clapperboard size={34} /> : view === 'shows' ? <Tv2 size={34} /> : <ListMusic size={34} />}
              </div>
              <div>
                <span>{player ? 'Now playing' : 'Browse library'}</span>
                <h2 title={heroTitle}>{heroTitle}</h2>
                <p>{heroCopy}</p>
                <div className="hero-chips">
                  <span>{visibleCount} {view === 'playlists' ? 'playlist' : view === 'movies' ? 'movie' : 'show'}{visibleCount !== 1 ? 's' : ''}</span>
                </div>
                {view === 'playlists' && (
                  <button
                    className="create-playlist-button"
                    onClick={() => {
                      setShowCreateModal(true);
                    }}
                    disabled={busy}
                  >
                    <Plus size={16} />
                    Create Playlist
                  </button>
                )}
              </div>
            </div>
            <div className="hero-player">
              <PlayerPanel player={player} onOpenExternal={onOpenExternal} />
            </div>
          </div>
        )}

        {!currentBannerItem && (
          <div className="hero-strip browse-hero">
            <div className="hero-copy">
              <div className="hero-poster">
                {view === 'movies' ? <Clapperboard size={34} /> : view === 'shows' ? <Tv2 size={34} /> : <ListMusic size={34} />}
              </div>
              <div>
                <span>{player ? 'Now playing' : 'Browse library'}</span>
                <h2 title={heroTitle}>{heroTitle}</h2>
                <p>{heroCopy}</p>
                <div className="hero-chips">
                  <span>{visibleCount} {view === 'playlists' ? 'playlist' : view === 'movies' ? 'movie' : 'show'}{visibleCount !== 1 ? 's' : ''}</span>
                </div>
                {view === 'playlists' && (
                  <button
                    className="create-playlist-button"
                    onClick={() => {
                      setShowCreateModal(true);
                    }}
                    disabled={busy}
                  >
                    <Plus size={16} />
                    Create Playlist
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="filter-row">
          <button>All lists</button>
          <button>All genres</button>
          <button>Highest score</button>
          <button>All formats</button>
        </div>

        <div className="section-title">
          <h2>{view === 'movies' ? 'Current Movies' : view === 'shows' ? 'Current TV Shows' : 'Your Playlists'}</h2>
          <span>{visibleCount} items</span>
        </div>

        {visibleCount ? (
          <div className="poster-grid">
            {view === 'movies'
              ? movies.map((movie) => (
                  <MovieTile 
                    key={movie.id} 
                    movie={movie} 
                    onClick={() => onSelectMovie(movie)} 
                    onViewDetails={() => onViewMovieDetails(movie)}
                    isSelected={selectedMovie?.id === movie.id}
                  />
                ))
              : view === 'shows'
              ? shows.map((show) => (
                  <ShowTile 
                    key={show.id} 
                    show={show} 
                    onClick={() => onSelectShow(show)} 
                    onViewDetails={() => onViewShowDetails(show)}
                    isSelected={selectedShow?.id === show.id}
                  />
                ))
              : playlists.map((playlist) => (
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
                      <span>{playlist.itemCount} item{playlist.itemCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                ))
            }
          </div>
        ) : (
          <div className="library-empty-state">
            <div className="empty-orbit" aria-hidden="true">
              {view === 'playlists' ? <ListMusic size={34} /> : <Clapperboard size={34} />}
            </div>
            <span>{view === 'playlists' ? 'No playlists yet' : view === 'movies' ? 'No movies yet' : 'No TV shows yet'}</span>
            <h3>{view === 'playlists' ? 'Create your first playlist' : 'Scan a local folder to build your cinema library.'}</h3>
            <p>{view === 'playlists' ? 'Organize your favorite movies and TV shows into custom playlists.' : 'Use Settings to add one or more folders. Sky Movie will import files, enrich metadata, and keep the library local-first.'}</p>
          </div>
        )}

        {selectedTitle !== 'No media selected' ? <span className="sr-only">{selectedTitle}</span> : null}
      </section>
    </div>
  );
}
