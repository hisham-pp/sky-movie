import { useState } from 'react';
import { ArrowLeft, Clapperboard, Play, ListMusic } from 'lucide-react';
import type { Episode, MediaFile, Movie, MovieMetadataSearchResult, PlayMediaResult, Playlist, TvMetadataSearchResult } from '@shared/ipc';
import { PlayerPanel } from '../PlayerPanel';
import { FileList } from './FileList';
import { MetadataTools } from './MetadataTools';
import { PlaylistSelectorDialog } from '../playlist/PlaylistSelectorDialog';

type MetadataResult = MovieMetadataSearchResult | TvMetadataSearchResult;

export function MovieDetailPage({
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
  onAddToPlaylist
}: {
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
}) {
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const meta = [
    movie.releaseYear ? `${movie.releaseYear}` : 'Unknown year',
    movie.runtimeMinutes ? `${movie.runtimeMinutes} min` : null,
    movie.rating ? `${movie.rating.toFixed(1)} rating` : null,
    `${files.length} local file${files.length === 1 ? '' : 's'}`
  ].filter(Boolean);

  return (
    <section className="media-detail-page movie-detail-page">
      {movie.backdropPath ? <img className="detail-backdrop" src={movie.backdropPath} alt="" /> : null}
      <div className="detail-hero">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={17} />
          Back to movies
        </button>

        <div className="movie-detail-layout">
          <div className="detail-poster">
            {movie.posterPath ? <img src={movie.posterPath} alt="" /> : <Clapperboard size={38} />}
          </div>
          <div className="detail-copy">
            <span className="detail-kicker">Movie detail</span>
            <h2>{movie.title}</h2>
            <div className="hero-chips">
              {meta.map((item) => (
                <span key={String(item)}>{item}</span>
              ))}
            </div>
            <p>{movie.overview ?? 'No overview stored yet. Load TMDB metadata to enrich this movie.'}</p>
            {playingFile ? (
              <div className="hero-now-playing" title={playingFile.fileName}>
                <Play size={14} />
                <span>{playingFile.fileName}</span>
              </div>
            ) : null}
            <button
              className="add-to-playlist-button"
              onClick={() => setShowPlaylistDialog(true)}
              disabled={busy || playlists.length === 0}
              title={playlists.length === 0 ? 'Create a playlist first' : 'Add to playlist'}
            >
              <ListMusic size={16} />
              Add to Playlist
            </button>
          </div>
        </div>
      </div>

      <div className="movie-detail-grid">
        <div className="detail-main-stack">
          <section className="detail-card player-card">
            <div className="section-title">
              <h2>Playback</h2>
              <span>{files.length} files</span>
            </div>
            <PlayerPanel player={player} onOpenExternal={onOpenExternal} />
          </section>
          <FileList files={files} emptyLabel="No local movie files found for this title." onPlay={onPlay} onDelete={onDeleteFile} onShowInFolder={onShowInFolder} />
        </div>

        <aside className="detail-side-stack">
          <MetadataTools
            label="Movie metadata"
            overview={movie.overview}
            meta={[movie.releaseYear ?? 'Unknown year', movie.rating ? `${movie.rating.toFixed(1)} rating` : null]}
            metadataQuery={metadataQuery}
            metadataResults={metadataResults}
            busy={busy}
            onMetadataQueryChange={onMetadataQueryChange}
            onSearchMetadata={onSearchMetadata}
            onApplyMetadata={onApplyMetadata}
          />
        </aside>
      </div>

      {showPlaylistDialog && (
        <PlaylistSelectorDialog
          playlists={playlists}
          onSelect={(playlistId) => {
            onAddToPlaylist(playlistId, 'movie', movie.id);
            setShowPlaylistDialog(false);
          }}
          onClose={() => setShowPlaylistDialog(false)}
        />
      )}
    </section>
  );
}
