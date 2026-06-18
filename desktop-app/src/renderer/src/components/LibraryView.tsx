import { Play } from 'lucide-react';
import type { MediaFile, Movie, PlayMediaResult, ScanResult, TvShow } from '@shared/ipc';
import type { ViewMode } from '../types';
import { formatBytes } from '../utils/format';
import { MovieTile, ShowTile } from './LibraryTile';
import { PlayerPanel } from './PlayerPanel';

export function LibraryView({
  view,
  movies,
  shows,
  selectedTitle,
  selectedFiles,
  player,
  lastScan,
  onSelectMovie,
  onSelectShow,
  onPlay
}: {
  view: Exclude<ViewMode, 'settings'>;
  movies: Movie[];
  shows: TvShow[];
  selectedTitle: string;
  selectedFiles: MediaFile[];
  player: PlayMediaResult | null;
  lastScan: ScanResult | null;
  onSelectMovie(movie: Movie): void;
  onSelectShow(show: TvShow): void;
  onPlay(file: MediaFile): void;
}) {
  const visibleCount = view === 'movies' ? movies.length : shows.length;

  return (
    <div className="content-grid">
      <section className="library-list">
        <div className="hero-strip">
          <div>
            <span>Continue watching</span>
            <h2>{player?.title ?? selectedTitle}</h2>
            <p>{selectedFiles.length ? `${selectedFiles.length} local files available` : 'Select a title from your local library'}</p>
          </div>
          <div className="hero-player">
            <PlayerPanel player={player} />
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
