import { Play } from 'lucide-react';
import type {
  MediaFile,
  Movie,
  MovieMetadataSearchResult,
  PlayMediaResult,
  ScanResult,
  TvMetadataSearchResult,
  TvShow
} from '@shared/ipc';
import type { ViewMode } from '../types';
import { formatBytes } from '../utils/format';
import { MovieTile, ShowTile } from './LibraryTile';
import { PlayerPanel } from './PlayerPanel';

export function LibraryView({
  view,
  movies,
  shows,
  selectedTitle,
  selectedMovie,
  selectedShow,
  selectedFiles,
  metadataQuery,
  metadataResults,
  busy,
  player,
  lastScan,
  onSelectMovie,
  onSelectShow,
  onMetadataQueryChange,
  onSearchMetadata,
  onApplyMetadata,
  onPlay,
  onOpenExternal
}: {
  view: Exclude<ViewMode, 'settings'>;
  movies: Movie[];
  shows: TvShow[];
  selectedTitle: string;
  selectedMovie: Movie | null;
  selectedShow: TvShow | null;
  selectedFiles: MediaFile[];
  metadataQuery: string;
  metadataResults: Array<MovieMetadataSearchResult | TvMetadataSearchResult>;
  busy: boolean;
  player: PlayMediaResult | null;
  lastScan: ScanResult | null;
  onSelectMovie(movie: Movie): void;
  onSelectShow(show: TvShow): void;
  onMetadataQueryChange(value: string): void;
  onSearchMetadata(): void;
  onApplyMetadata(result: MovieMetadataSearchResult | TvMetadataSearchResult): void;
  onPlay(file: MediaFile): void;
  onOpenExternal(mediaFileId: number): void;
}) {
  const visibleCount = view === 'movies' ? movies.length : shows.length;
  const selectedOverview = selectedMovie?.overview ?? selectedShow?.overview;
  const selectedYear = selectedMovie?.releaseYear ?? selectedShow?.firstAirYear;
  const selectedRating = selectedMovie?.rating ?? selectedShow?.rating;
  const selectedArtwork = selectedMovie?.posterPath ?? selectedShow?.posterPath;
  const selectedBackdrop = selectedMovie?.backdropPath ?? selectedShow?.backdropPath;
  const hasSelectedTitle = Boolean(selectedMovie || selectedShow);

  return (
    <div className="content-grid">
      <section className="library-list">
        <div className="hero-strip">
          {selectedBackdrop ? <img className="hero-backdrop-image" src={selectedBackdrop} alt="" /> : null}
          <div className="hero-copy">
            <div className="hero-poster">
              {selectedArtwork ? <img src={selectedArtwork} alt="" /> : <Play size={32} />}
            </div>
            <div>
              <span>{hasSelectedTitle ? 'Selected title' : 'Continue watching'}</span>
              <h2>{player?.title ?? selectedTitle}</h2>
              <p>
                {selectedFiles.length ? `${selectedFiles.length} local files available` : 'Select a title from your local library'}
              </p>
            </div>
          </div>
          <div className="hero-player">
            <PlayerPanel player={player} onOpenExternal={onOpenExternal} />
          </div>
        </div>

        <div className="filter-row">
          <button>All lists</button>
          <button>All genres</button>
          <button>Highest score</button>
          <button>All formats</button>
        </div>

        <div className="section-title">
          <h2>{view === 'movies' ? 'Current Movies' : 'Current TV Shows'}</h2>
          <span>{visibleCount} items</span>
        </div>

        <div className="poster-grid">
          {view === 'movies'
            ? movies.map((movie) => <MovieTile key={movie.id} movie={movie} onClick={() => onSelectMovie(movie)} />)
            : shows.map((show) => <ShowTile key={show.id} show={show} onClick={() => onSelectShow(show)} />)}
        </div>
      </section>

      <aside className="detail-panel">
        <div className="section-title">
          <h2>{selectedTitle}</h2>
          <span>{selectedFiles.length} files</span>
        </div>
        <div className="file-list">
          {selectedFiles.map((file) => (
            <button key={file.id} onClick={() => onPlay(file)}>
              <Play size={16} />
              <span>{file.fileName}</span>
              <small>{formatBytes(file.fileSize)}</small>
            </button>
          ))}
        </div>
        {hasSelectedTitle ? (
          <div className="metadata-panel">
            <div>
              <strong>Local metadata</strong>
              <p>{selectedOverview ?? 'No overview stored yet.'}</p>
              <span>
                {[selectedYear ?? 'Unknown year', selectedRating ? `${selectedRating.toFixed(1)} rating` : null]
                  .filter(Boolean)
                  .join(' / ')}
              </span>
            </div>
            <div className="metadata-search">
              <input
                value={metadataQuery}
                onChange={(event) => onMetadataQueryChange(event.target.value)}
                placeholder="Search TMDB metadata"
              />
              <button disabled={busy} onClick={onSearchMetadata}>
                Load
              </button>
            </div>
            <div className="metadata-results">
              {metadataResults.map((result) => (
                <button key={`${result.provider}-${result.providerId}`} disabled={busy} onClick={() => onApplyMetadata(result)}>
                  {result.posterUrl ? <img src={result.posterUrl} alt="" /> : <div className="metadata-poster-placeholder" />}
                  <span>
                    <strong>{result.title}</strong>
                    <small>{result.year ?? 'Unknown year'}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {lastScan ? (
          <div className="scan-recap">
            <strong>{lastScan.folder.name}</strong>
            <span>{lastScan.movieMatches} movie matches</span>
            <span>{lastScan.showMatches} show matches</span>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
