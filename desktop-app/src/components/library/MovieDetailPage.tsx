'use client';

import { memo, useMemo, useState, useCallback } from 'react';
import { Clapperboard, Heart, Play, ListMusic, Search } from 'lucide-react';
import type { MediaFile, Movie, MovieMetadataSearchResult, PlayMediaResult, Playlist, TvMetadataSearchResult } from '@shared/ipc';
import { PlaylistSelectorDialog } from '../playlist/PlaylistSelectorDialog';
import { MetadataSearchDialog } from './MetadataSearchDialog';
import { MediaOptionsMenu, DeleteFilesDialog } from './MediaOptionsMenu';
import { MediaRelationsAndRecommendations } from './MediaRelationsAndRecommendations';
import { PillButton, PillButtonGroup, PillChip } from '../common';
import { openExternalUrl } from '@/queries';

type MetadataResult = MovieMetadataSearchResult | TvMetadataSearchResult;


type MovieDetailPageProps =  {
  movie: Movie;
  files: MediaFile[];
  metadataQuery: string;
  metadataResults: MetadataResult[];
  busy: boolean;
  player: PlayMediaResult | null;
  playingFile: MediaFile | null | undefined;
  playlists: Playlist[];
  onBack(): void;
  onMetadataQueryChange(value: string): void;
  onSearchMetadata(): void;
  onApplyMetadata(result: MetadataResult): void;
  onPlay(file: MediaFile): void;
  onOpenExternal(mediaFileId: number): void;
  onDeleteFile(file: MediaFile): void;
  onShowInFolder(file: MediaFile): void;
  onAddToPlaylist(playlistId: number, mediaKind: 'movie' | 'show', itemId: number): void;
  onToggleFavorite(mediaKind: 'movie' | 'show', id: number, favorite: boolean): void;
}

export const MovieDetailPage = memo(function MovieDetailPage({
  movie,
  files,
  metadataQuery,
  metadataResults,
  busy,
  player,
  playingFile,
  playlists,
  onBack,
  onMetadataQueryChange,
  onSearchMetadata,
  onApplyMetadata,
  onPlay,
  onOpenExternal,
  onDeleteFile,
  onShowInFolder,
  onAddToPlaylist,
  onToggleFavorite
}:MovieDetailPageProps) {
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const meta = useMemo(() => [
    movie.releaseYear ? `${movie.releaseYear}` : 'Unknown year',
    movie.runtimeMinutes ? `${movie.runtimeMinutes} min` : null,
    movie.rating ? `${movie.rating.toFixed(1)} rating` : null,
  ].filter(Boolean), [movie.releaseYear, movie.runtimeMinutes, movie.rating]);

  const handleOpenPlaylistDialog = useCallback(() => setShowPlaylistDialog(true), []);
  const handleClosePlaylistDialog = useCallback(() => setShowPlaylistDialog(false), []);
  const handleSelectPlaylist = useCallback((playlistId: number) => {
    onAddToPlaylist(playlistId, 'movie', movie.id);
    setShowPlaylistDialog(false);
  }, [onAddToPlaylist, movie.id]);

  const handleOpenMetadataDialog = useCallback(() => setShowMetadataDialog(true), []);
  const handleCloseMetadataDialog = useCallback(() => setShowMetadataDialog(false), []);

  const handleOpenDeleteDialog = useCallback(() => setShowDeleteDialog(true), []);
  const handleCloseDeleteDialog = useCallback(() => setShowDeleteDialog(false), []);

  const handleDeleteFiles = useCallback((filesToDelete: MediaFile[]) => {
    filesToDelete.forEach(file => onDeleteFile(file));
  }, [onDeleteFile]);

  const handleConfirmDelete = useCallback((filesToDelete: MediaFile[]) => {
    handleDeleteFiles(filesToDelete);
    setShowDeleteDialog(false);
  }, [handleDeleteFiles]);

  const handleSearchGoogle = useCallback(() => {
    const query = `${movie.title} ${movie.releaseYear || ''} movie`;
    void openExternalUrl(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
  }, [movie.title, movie.releaseYear]);

  return (
    <section className="media-detail-page movie-detail-page">
      {movie.backdropPath ? <img className="detail-backdrop" src={movie.backdropPath} alt="" /> : null}

      <div className="detail-hero">

        <div className="movie-detail-layout">
          <div className="detail-poster-section">
            <div className="detail-poster">
              {movie.posterPath ? <img src={movie.posterPath} alt={movie.title} /> : <Clapperboard size={38} />}
            </div>
            <PillButtonGroup className="detail-actions" aria-label="Movie actions">
              {files.length > 0 ? (
                <PillButton
                  position="first"
                  variant="primary"
                  tooltip={playingFile ? 'Playing' : 'Play'}
                  aria-label="Play"
                  icon={<Play size={15} fill="currentColor" />}
                  onClick={() => onPlay(files[0])}
                  disabled={busy}
                />
              ) : (
                <PillButton
                  position="first"
                  variant="primary"
                  tooltip="No files available"
                  aria-label="Play"
                  icon={<Play size={15} fill="currentColor" />}
                  disabled
                />
              )}
              <PillButton
                position="middle"
                tooltip={playlists.length === 0 ? 'Create a playlist first' : 'Add to playlist'}
                aria-label="Add to playlist"
                icon={<ListMusic size={15} />}
                onClick={handleOpenPlaylistDialog}
                disabled={busy || playlists.length === 0}
              />
              <PillButton
                position="middle"
                tooltip={movie.favorite ? 'Remove from favorites' : 'Add to favorites'}
                aria-label={movie.favorite ? 'Remove from favorites' : 'Add to favorites'}
                icon={<Heart size={15} fill={movie.favorite ? 'currentColor' : 'none'} />}
                onClick={() => onToggleFavorite('movie', movie.id, !movie.favorite)}
                disabled={busy}
                className={movie.favorite ? 'favorite-active' : ''}
              />
              <PillButton
                position="middle"
                tooltip="Search metadata"
                aria-label="Search metadata"
                icon={<Search size={15} />}
                onClick={handleOpenMetadataDialog}
                disabled={busy}
              />
              <MediaOptionsMenu
                files={files}
                onShowInFolder={onShowInFolder}
                onDeleteSomeFiles={handleOpenDeleteDialog}
                onSearchGoogle={handleSearchGoogle}
                position="last"
              />
            </PillButtonGroup>
          </div>
          <div className="detail-copy">
            <h2>{movie.title}</h2>

            <PillButtonGroup className="hero-chips" aria-label="Movie metadata">
              {meta.map((item, idx) => {
                const pos =
                  meta.length === 1
                    ? 'single'
                    : idx === 0
                    ? 'first'
                    : idx === meta.length - 1
                    ? 'last'
                    : 'middle';
                return (
                  <PillChip
                    key={String(item)}
                    position={pos}
                    variant={idx === 0 ? 'primary' : 'default'}
                  >
                    {item}
                  </PillChip>
                );
              })}
            </PillButtonGroup>
            <p className="detail-overview">{movie.overview ?? 'No overview stored yet. Load TMDB metadata to enrich this movie.'}</p>
          </div>
        </div>
      </div>

      <div className="movie-detail-content">
        {/* Player section removed - using floating player instead */}
        
        {files.length > 0 && (
          <section className="files-section">
            <div className="movie-files-grid">
              {files.map((file) => (
                <div key={file.id} className="movie-file-card">
                  <div 
                    className="movie-file-thumbnail"
                    style={{
                      backgroundImage: movie.backdropPath ? `url(${movie.backdropPath})` : 'none'
                    }}
                  >
                    <button
                      className="movie-file-play-overlay"
                      onClick={() => onPlay(file)}
                      title={`Play: ${file.fileName}`}
                    >
                      <Play size={32} />
                    </button>
                  </div>
                  <div className="movie-file-info">
                    <strong>{file.fileName}</strong>
                    <small>{file.fileSize ? `${(file.fileSize / (1024 * 1024 * 1024)).toFixed(2)} GB` : ''}</small>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <MediaRelationsAndRecommendations
          mediaKind="movie"
          id={movie.id}
          title={movie.title}
          releaseYear={movie.releaseYear}
        />
      </div>

      {showPlaylistDialog && (
        <PlaylistSelectorDialog
          playlists={playlists}
          onSelect={handleSelectPlaylist}
          onClose={handleClosePlaylistDialog}
        />
      )}

      {showMetadataDialog && (
        <MetadataSearchDialog
          title={movie.title}
          metadataQuery={metadataQuery}
          metadataResults={metadataResults}
          busy={busy}
          onMetadataQueryChange={onMetadataQueryChange}
          onSearchMetadata={onSearchMetadata}
          onApplyMetadata={onApplyMetadata}
          onClose={handleCloseMetadataDialog}
        />
      )}

      {showDeleteDialog && (
        <DeleteFilesDialog
          files={files}
          onCancel={handleCloseDeleteDialog}
          onConfirm={handleConfirmDelete}
        />
      )}
    </section>
  );
});
