import type { ReactNode } from 'react';
import { useState } from 'react';
import { ListMusic } from 'lucide-react';
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
import { MovieTile, ShowTile } from './LibraryTile';
import { BrowseLibraryPage } from './library/BrowseLibraryPage';
import { MovieDetailPage } from './library/MovieDetailPage';
import { SeriesDetailPage } from './library/SeriesDetailPage';
import { PlaylistDetailPage } from './playlist/PlaylistDetailPage';
import { CreatePlaylistModal } from './playlist/CreatePlaylistModal';
import { EditPlaylistModal } from './playlist/EditPlaylistModal';

type MetadataResult = MovieMetadataSearchResult | TvMetadataSearchResult;

export function LibraryView({
  view,
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
  const playingFile = player ? selectedFiles.find((file) => file.id === player.mediaFileId) : null;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  if (view === 'movies' && selectedMovie) {
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
        onBack={() => {
          onBackToLibrary();
        }}
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

  if (view === 'shows' && selectedShow) {
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
        onBack={() => {
          onBackToLibrary();
        }}
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

  if (view === 'playlists' && selectedPlaylist) {
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
          setEditName(selectedPlaylist.name);
          setEditDescription(selectedPlaylist.description || '');
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
      <BrowseLibraryPage
        view={view}
        movies={movies}
        shows={shows}
        playlists={playlists}
        selectedMovie={selectedMovie}
        selectedShow={selectedShow}
        selectedTitle={selectedTitle}
        player={player}
        lastScan={lastScan}
        onSelectMovie={onSelectMovie}
        onSelectShow={onSelectShow}
        onSelectPlaylist={onSelectPlaylist}
        onViewMovieDetails={onViewMovieDetails}
        onViewShowDetails={onViewShowDetails}
        onOpenExternal={onOpenExternal}
        onCreatePlaylist={onCreatePlaylist}
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        busy={busy}
      />
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
