import type { ReactNode } from 'react';
import { useState } from 'react';
import type {
  Episode,
  MediaFile,
  Movie,
  MovieMetadataSearchResult,
  PlayMediaResult,
  Playlist,
  PlaylistItem,
  ScanResult,
  TvMetadataSearchResult,
  TvShow
} from '@shared/ipc';
import type { ViewMode } from '../types';
import { BrowseMoviesPage } from './library/BrowseMoviesPage';
import { BrowseTvShowsPage } from './library/BrowseTvShowsPage';
import { BrowsePlaylistsPage } from './library/BrowsePlaylistsPage';
import { MovieDetailPage } from './library/MovieDetailPage';
import { SeriesDetailPage } from './library/SeriesDetailPage';
import { PlaylistDetailPage } from './playlist/PlaylistDetailPage';
import { CreatePlaylistModal } from './playlist/CreatePlaylistModal';
import { EditPlaylistModal } from './playlist/EditPlaylistModal';

type MetadataResult = MovieMetadataSearchResult | TvMetadataSearchResult;

export function LibraryView({
  view,
  showDetailView,
  movies,
  shows,
  selectedTitle,
  selectedMovie,
  selectedShow,
  selectedEpisodes,
  selectedFiles,
  metadataQuery,
  metadataResults,
  busy,
  player,
  lastScan,
  playlists,
  onSelectMovie,
  onSelectShow,
  onViewMovieDetails,
  onViewShowDetails,
  onBackToLibrary,
  onMetadataQueryChange,
  onSearchMetadata,
  onApplyMetadata,
  onPlay,
  onOpenExternal,
  onDeleteFile,
  onShowInFolder,
  onAddToPlaylist,
  selectedPlaylist,
  playlistItems,
  onSelectPlaylist,
  onCreatePlaylist,
  onUpdatePlaylist,
  onDeletePlaylist,
  onRemoveFromPlaylist
}: {
  view: Exclude<ViewMode, 'settings' | 'scan'>;
  showDetailView: boolean;
  movies: Movie[];
  shows: TvShow[];
  selectedTitle: string;
  selectedMovie: Movie | null;
  selectedShow: TvShow | null;
  selectedEpisodes: Episode[];
  selectedFiles: MediaFile[];
  metadataQuery: string;
  metadataResults: MetadataResult[];
  busy: boolean;
  player: PlayMediaResult | null;
  lastScan: ScanResult | null;
  playlists: Playlist[];
  onSelectMovie(movie: Movie): void;
  onSelectShow(show: TvShow): void;
  onViewMovieDetails(movie: Movie): void;
  onViewShowDetails(show: TvShow): void;
  onBackToLibrary(): void;
  onMetadataQueryChange(value: string): void;
  onSearchMetadata(): void;
  onApplyMetadata(result: MetadataResult): void;
  onPlay(file: MediaFile): void;
  onOpenExternal(mediaFileId: number): void;
  onDeleteFile(file: MediaFile): void;
  onShowInFolder(file: MediaFile): void;
  onAddToPlaylist(playlistId: number, mediaKind: 'movie' | 'show', itemId: number): void;
  selectedPlaylist: Playlist | null;
  playlistItems: PlaylistItem[];
  onSelectPlaylist(playlist: Playlist | null): void;
  onCreatePlaylist(name: string, description?: string): void;
  onUpdatePlaylist(id: number, name?: string, description?: string): void;
  onDeletePlaylist(id: number): void;
  onRemoveFromPlaylist(playlistId: number, itemId: number): void;
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  const playingFile = player ? selectedFiles.find((file) => file.id === player.mediaFileId) : null;

  if (showDetailView && view === 'movies' && selectedMovie) {
    return (
      <MovieDetailPage
        movie={selectedMovie}
        files={selectedFiles}
        metadataQuery={metadataQuery}
        metadataResults={metadataResults}
        busy={busy}
        player={player}
        playingFile={playingFile}
        playlists={playlists}
        onBack={onBackToLibrary}
        onMetadataQueryChange={onMetadataQueryChange}
        onSearchMetadata={onSearchMetadata}
        onApplyMetadata={onApplyMetadata}
        onPlay={onPlay}
        onOpenExternal={onOpenExternal}
        onDeleteFile={onDeleteFile}
        onShowInFolder={onShowInFolder}
        onAddToPlaylist={onAddToPlaylist}
      />
    );
  }

  if (showDetailView && view === 'shows' && selectedShow) {
    return (
      <SeriesDetailPage
        show={selectedShow}
        episodes={selectedEpisodes}
        files={selectedFiles}
        metadataQuery={metadataQuery}
        metadataResults={metadataResults}
        busy={busy}
        player={player}
        playingFile={playingFile}
        playlists={playlists}
        onBack={onBackToLibrary}
        onMetadataQueryChange={onMetadataQueryChange}
        onSearchMetadata={onSearchMetadata}
        onApplyMetadata={onApplyMetadata}
        onPlay={onPlay}
        onOpenExternal={onOpenExternal}
        onDeleteFile={onDeleteFile}
        onShowInFolder={onShowInFolder}
        onAddToPlaylist={onAddToPlaylist}
      />
    );
  }

  if (showDetailView && view === 'playlists' && selectedPlaylist) {
    return (
      <PlaylistDetailPage
        playlist={selectedPlaylist}
        items={playlistItems}
        busy={busy}
        onBack={() => {
          onSelectPlaylist(null);
          onBackToLibrary();
        }}
        onEdit={() => {
          setEditingPlaylist(selectedPlaylist);
          setShowEditModal(true);
        }}
        onDelete={() => onDeletePlaylist(selectedPlaylist.id)}
        onRemoveItem={(itemId: number) => onRemoveFromPlaylist(selectedPlaylist.id, itemId)}
        onSelectMovie={onSelectMovie}
        onSelectShow={onSelectShow}
      />
    );
  }

  return (
    <>
      {view === 'movies' && (
        <BrowseMoviesPage
          movies={movies}
          selectedMovie={selectedMovie}
          player={player}
          onSelectMovie={onSelectMovie}
          onViewMovieDetails={onViewMovieDetails}
          onOpenExternal={onOpenExternal}
        />
      )}

      {view === 'shows' && (
        <BrowseTvShowsPage
          shows={shows}
          selectedShow={selectedShow}
          player={player}
          onSelectShow={onSelectShow}
          onViewShowDetails={onViewShowDetails}
          onOpenExternal={onOpenExternal}
        />
      )}

      {view === 'playlists' && (
        <BrowsePlaylistsPage
          playlists={playlists}
          onSelectPlaylist={onSelectPlaylist}
          onCreatePlaylist={onCreatePlaylist}
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
          busy={busy}
        />
      )}

      {showCreateModal && (
        <CreatePlaylistModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(name, description) => {
            onCreatePlaylist(name, description);
            setShowCreateModal(false);
          }}
          busy={busy}
        />
      )}

      {showEditModal && editingPlaylist && (
        <EditPlaylistModal
          playlist={editingPlaylist}
          onClose={() => setShowEditModal(false)}
          onUpdate={(id, name, description) => {
            onUpdatePlaylist(id, name, description);
            setShowEditModal(false);
          }}
          busy={busy}
        />
      )}
    </>
  );
}
