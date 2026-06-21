import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clapperboard, FolderOpen, FolderSearch, Play, Star, Tv2, Trash2 } from 'lucide-react';
import type {
  Episode,
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
  onShowInFolder
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
}) {
  const playingFile = player ? selectedFiles.find((file) => file.id === player.mediaFileId) : null;
  const [showDetailView, setShowDetailView] = useState(false);

  if (view === 'movies' && selectedMovie && showDetailView) {
    return (
      <MovieDetailPage
        movie={selectedMovie}
        files={selectedFiles}
        metadataQuery={metadataQuery}
        metadataResults={metadataResults}
        busy={busy}
        player={player}
        playingFile={playingFile}
        onBack={() => {
          setShowDetailView(false);
          onBackToLibrary();
        }}
        onMetadataQueryChange={onMetadataQueryChange}
        onSearchMetadata={onSearchMetadata}
        onApplyMetadata={onApplyMetadata}
        onPlay={onPlay}
        onOpenExternal={onOpenExternal}
        onDeleteFile={onDeleteFile}
        onShowInFolder={onShowInFolder}
      />
    );
  }

  if (view === 'shows' && selectedShow && showDetailView) {
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
        onBack={() => {
          setShowDetailView(false);
          onBackToLibrary();
        }}
        onMetadataQueryChange={onMetadataQueryChange}
        onSearchMetadata={onSearchMetadata}
        onApplyMetadata={onApplyMetadata}
        onPlay={onPlay}
        onOpenExternal={onOpenExternal}
        onDeleteFile={onDeleteFile}
        onShowInFolder={onShowInFolder}
      />
    );
  }

  return (
    <BrowseLibraryPage
      view={view}
      movies={movies}
      shows={shows}
      selectedMovie={selectedMovie}
      selectedShow={selectedShow}
      selectedTitle={selectedTitle}
      player={player}
      lastScan={lastScan}
      onSelectMovie={onSelectMovie}
      onSelectShow={onSelectShow}
      onViewMovieDetails={(movie) => {
        onViewMovieDetails(movie);
        setShowDetailView(true);
      }}
      onViewShowDetails={(show) => {
        onViewShowDetails(show);
        setShowDetailView(true);
      }}
      onOpenExternal={onOpenExternal}
    />
  );
}

function BrowseLibraryPage({
  view,
  movies,
  shows,
  selectedMovie,
  selectedShow,
  selectedTitle,
  player,
  lastScan,
  onSelectMovie,
  onSelectShow,
  onViewMovieDetails,
  onViewShowDetails,
  onOpenExternal
}: {
  view: Exclude<ViewMode, 'settings' | 'scan'>;
  movies: Movie[];
  shows: TvShow[];
  selectedMovie: Movie | null;
  selectedShow: TvShow | null;
  selectedTitle: string;
  player: PlayMediaResult | null;
  lastScan: ScanResult | null;
  onSelectMovie(movie: Movie): void;
  onSelectShow(show: TvShow): void;
  onViewMovieDetails(movie: Movie): void;
  onViewShowDetails(show: TvShow): void;
  onOpenExternal(mediaFileId: number): void;
}) {
  const visibleCount = view === 'movies' ? movies.length : shows.length;
  const heroTitle = view === 'movies' ? 'Movie Library' : 'Series Library';
  const heroCopy =
    view === 'movies'
      ? 'Browse local films, open a movie page, and play files from your private collection.'
      : 'Browse local TV shows, open a series page, and review seasons, episodes, and files.';

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const items = view === 'movies' ? movies : shows;
  const itemsWithBackdrop = items.filter((item) => 
    view === 'movies' ? (item as Movie).backdropPath : (item as TvShow).backdropPath
  );

  useEffect(() => {
    if (itemsWithBackdrop.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % itemsWithBackdrop.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [itemsWithBackdrop.length]);

  const playingItem = view === 'movies' ? selectedMovie : selectedShow;
  const currentBannerItem = (player && playingItem ? playingItem : itemsWithBackdrop[currentBannerIndex]) as Movie | TvShow | undefined;

  return (
    <div className="browse-grid">
      <section className="library-list">
        {currentBannerItem && (
          <div className="rotating-banner">
            {currentBannerItem.backdropPath ? (
              <img 
                src={currentBannerItem.backdropPath} 
                alt="" 
                className="banner-backdrop"
              />
            ) : (
              <div className="banner-backdrop-placeholder" />
            )}
            <div className={`banner-overlay ${player ? 'playing-banner-overlay' : ''}`}>
              {player ? (
                <div className="banner-grid">
                  <div className="banner-content">
                    <span className="now-playing-badge">NOW PLAYING</span>
                    <h2>{currentBannerItem.title}</h2>
                    <p>{currentBannerItem.overview}</p>
                    <div className="banner-meta">
                      <span>
                        {view === 'movies' 
                          ? (currentBannerItem as Movie).releaseYear ?? 'Unknown year'
                          : (currentBannerItem as TvShow).firstAirYear ?? 'Unknown year'
                        }
                      </span>
                      {currentBannerItem.rating && (
                        <span>
                          <Star size={14} /> {currentBannerItem.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="banner-player">
                    <PlayerPanel player={player} onOpenExternal={onOpenExternal} />
                  </div>
                </div>
              ) : (
                <>
                  <div className="banner-content">
                    <h2>{currentBannerItem.title}</h2>
                    <p>{currentBannerItem.overview}</p>
                    <div className="banner-meta">
                      <span>
                        {view === 'movies' 
                          ? (currentBannerItem as Movie).releaseYear ?? 'Unknown year'
                          : (currentBannerItem as TvShow).firstAirYear ?? 'Unknown year'
                        }
                      </span>
                      {currentBannerItem.rating && (
                        <span>
                          <Star size={14} /> {currentBannerItem.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  {itemsWithBackdrop.length > 1 && (
                    <div className="banner-indicators">
                      {itemsWithBackdrop.map((_, index) => (
                        <button
                          key={index}
                          className={`banner-dot ${index === currentBannerIndex ? 'active' : ''}`}
                          onClick={() => setCurrentBannerIndex(index)}
                          aria-label={`Go to slide ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {!currentBannerItem && (
          <div className="hero-strip browse-hero">
            <div className="hero-copy">
              <div className="hero-poster">
                {view === 'movies' ? <Clapperboard size={34} /> : <Tv2 size={34} />}
              </div>
              <div>
                <span>{player ? 'Now playing' : 'Browse library'}</span>
                <h2 title={heroTitle}>{heroTitle}</h2>
                <p>{heroCopy}</p>
                <div className="hero-chips">
                  <span>{view === 'movies' ? 'Movies' : 'TV Shows'}</span>
                  <span>{visibleCount} items</span>
                  {lastScan ? <span>{lastScan.folder.name}</span> : null}
                </div>
              </div>
            </div>
            <div className="hero-player">
              <PlayerPanel player={player} onOpenExternal={onOpenExternal} />
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
          <h2>{view === 'movies' ? 'Current Movies' : 'Current TV Shows'}</h2>
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
              : shows.map((show) => (
                  <ShowTile 
                    key={show.id} 
                    show={show} 
                    onClick={() => onSelectShow(show)} 
                    onViewDetails={() => onViewShowDetails(show)}
                    isSelected={selectedShow?.id === show.id}
                  />
                ))}
          </div>
        ) : (
          <div className="library-empty-state">
            <div className="empty-orbit" aria-hidden="true">
              <Clapperboard size={34} />
            </div>
            <span>{view === 'movies' ? 'No movies yet' : 'No TV shows yet'}</span>
            <h3>Scan a local folder to build your cinema library.</h3>
            <p>Use Settings to add one or more folders. Sky Movie will import files, enrich metadata, and keep the library local-first.</p>
          </div>
        )}

        {selectedTitle !== 'No media selected' ? <span className="sr-only">{selectedTitle}</span> : null}
      </section>
    </div>
  );
}

function MovieDetailPage({
  movie,
  files,
  metadataQuery,
  metadataResults,
  busy,
  player,
  playingFile,
  onBack,
  onMetadataQueryChange,
  onSearchMetadata,
  onApplyMetadata,
  onPlay,
  onOpenExternal,
  onDeleteFile,
  onShowInFolder
}: {
  movie: Movie;
  files: MediaFile[];
  metadataQuery: string;
  metadataResults: MetadataResult[];
  busy: boolean;
  player: PlayMediaResult | null;
  playingFile: MediaFile | null | undefined;
  onBack(): void;
  onMetadataQueryChange(value: string): void;
  onSearchMetadata(): void;
  onApplyMetadata(result: MetadataResult): void;
  onPlay(file: MediaFile): void;
  onOpenExternal(mediaFileId: number): void;
  onDeleteFile(file: MediaFile): void;
  onShowInFolder(file: MediaFile): void;
}) {
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
    </section>
  );
}

function SeriesDetailPage({
  show,
  episodes,
  files,
  metadataQuery,
  metadataResults,
  busy,
  player,
  playingFile,
  onBack,
  onMetadataQueryChange,
  onSearchMetadata,
  onApplyMetadata,
  onPlay,
  onOpenExternal,
  onDeleteFile,
  onShowInFolder
}: {
  show: TvShow;
  episodes: Episode[];
  files: MediaFile[];
  metadataQuery: string;
  metadataResults: MetadataResult[];
  busy: boolean;
  player: PlayMediaResult | null;
  playingFile: MediaFile | null | undefined;
  onBack(): void;
  onMetadataQueryChange(value: string): void;
  onSearchMetadata(): void;
  onApplyMetadata(result: MetadataResult): void;
  onPlay(file: MediaFile): void;
  onOpenExternal(mediaFileId: number): void;
  onDeleteFile(file: MediaFile): void;
  onShowInFolder(file: MediaFile): void;
}) {
  const seasons = groupEpisodesBySeason(episodes);
  
  // Map files to episodes based on filename patterns
  const episodeFileMap = new Map<number, MediaFile>();
  files.forEach((file) => {
    const fileName = file.fileName.toLowerCase();
    // Match patterns like S01E01, s01e01, 1x01, etc.
    const match = fileName.match(/s(\d+)e(\d+)|(\d+)x(\d+)/i);
    if (match) {
      const seasonNum = parseInt(match[1] || match[3], 10);
      const episodeNum = parseInt(match[2] || match[4], 10);
      
      const episode = episodes.find(
        (ep) => ep.seasonNumber === seasonNum && ep.episodeNumber === episodeNum
      );
      
      if (episode) {
        episodeFileMap.set(episode.id, file);
      }
    }
  });

  return (
    <section className="media-detail-page series-detail-page">
      {show.backdropPath ? <img className="detail-backdrop" src={show.backdropPath} alt="" /> : null}
      <div className="series-hero">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={17} />
          Back to TV shows
        </button>
        <div className="series-title-row">
          <div>
            <span className="detail-kicker">Series detail</span>
            <h2>{show.title}</h2>
            <p>{show.overview ?? 'No series overview stored yet. Load TMDB metadata to enrich this show.'}</p>
          </div>
          <div className="series-poster">
            {show.posterPath ? <img src={show.posterPath} alt="" /> : <Tv2 size={38} />}
          </div>
        </div>
        <div className="series-stats">
          <DetailStat icon={<Calendar size={18} />} label="First aired" value={show.firstAirYear ?? 'Unknown'} />
          <DetailStat icon={<Tv2 size={18} />} label="Episodes" value={episodes.length || 'Unknown'} />
          <DetailStat icon={<Star size={18} />} label="Rating" value={show.rating ? show.rating.toFixed(1) : 'Unrated'} />
          <DetailStat icon={<FolderSearch size={18} />} label="Files" value={files.length} />
        </div>
        {playingFile ? (
          <div className="hero-now-playing" title={playingFile.fileName}>
            <Play size={14} />
            <span>{playingFile.fileName}</span>
          </div>
        ) : null}
      </div>

      <div className="series-detail-grid">
        <div className="detail-main-stack">
          <section className="detail-card">
            <div className="section-title">
              <h2>Episode Guide</h2>
              <span>{seasons.length ? `${seasons.length} seasons` : 'No episodes'}</span>
            </div>
            {seasons.length ? (
              <div className="season-list">
                {seasons.map((season) => (
                  <section key={season.seasonNumber} className="season-card">
                    <h3>Season {season.seasonNumber}</h3>
                    <div className="episode-list">
                      {season.episodes.map((episode) => {
                        const episodeFile = episodeFileMap.get(episode.id);
                        return (
                          <div key={episode.id} className="episode-row">
                            <span>
                              S{String(episode.seasonNumber).padStart(2, '0')}E{String(episode.episodeNumber).padStart(2, '0')}
                            </span>
                            <strong>{episode.title ?? `Episode ${episode.episodeNumber}`}</strong>
                            <small>{episode.runtimeMinutes ? `${episode.runtimeMinutes} min` : episode.airDate ?? 'No runtime'}</small>
                            {episodeFile && (
                              <button 
                                className="episode-play-button" 
                                onClick={() => onPlay(episodeFile)}
                                title={`Play: ${episodeFile.fileName}`}
                              >
                                <Play size={14} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="detail-empty">
                <Tv2 size={22} />
                <span>No episode records yet. Apply metadata or rescan the show folder.</span>
              </div>
            )}
          </section>

          <FileList files={files} emptyLabel="No local series files found for this show." onPlay={onPlay} onDelete={onDeleteFile} onShowInFolder={onShowInFolder} />
        </div>

        <aside className="detail-side-stack">
          <section className="detail-card player-card">
            <div className="section-title">
              <h2>Series Player</h2>
              <span>{files.length} files</span>
            </div>
            <PlayerPanel player={player} onOpenExternal={onOpenExternal} />
          </section>
          <MetadataTools
            label="Series metadata"
            overview={show.overview}
            meta={[show.firstAirYear ?? 'Unknown year', show.rating ? `${show.rating.toFixed(1)} rating` : null]}
            metadataQuery={metadataQuery}
            metadataResults={metadataResults}
            busy={busy}
            onMetadataQueryChange={onMetadataQueryChange}
            onSearchMetadata={onSearchMetadata}
            onApplyMetadata={onApplyMetadata}
          />
        </aside>
      </div>
    </section>
  );
}

function FileList({
  files,
  emptyLabel,
  onPlay,
  onDelete,
  onShowInFolder
}: {
  files: MediaFile[];
  emptyLabel: string;
  onPlay(file: MediaFile): void;
  onDelete(file: MediaFile): void;
  onShowInFolder(file: MediaFile): void;
}) {
  return (
    <section className="detail-card">
      <div className="section-title">
        <h2>Local Files</h2>
        <span>{files.length} files</span>
      </div>
      <div className="file-list">
        {files.map((file) => (
          <div key={file.id} className="file-row">
            <button title={file.fileName} onClick={() => onPlay(file)} className="file-play-button">
              <Play size={16} />
              <span>{file.fileName}</span>
              <small>{formatBytes(file.fileSize)}</small>
            </button>
            <div className="file-actions">
              <button 
                title="Show in file manager" 
                onClick={() => onShowInFolder(file)}
                className="file-action-button"
              >
                <FolderOpen size={16} />
              </button>
              <button 
                title="Delete file" 
                onClick={() => onDelete(file)}
                className="file-action-button file-delete-button"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {!files.length ? (
          <div className="detail-empty">
            <FolderSearch size={22} />
            <span>{emptyLabel}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function MetadataTools({
  label,
  overview,
  meta,
  metadataQuery,
  metadataResults,
  busy,
  onMetadataQueryChange,
  onSearchMetadata,
  onApplyMetadata
}: {
  label: string;
  overview: string | null;
  meta: Array<string | number | null>;
  metadataQuery: string;
  metadataResults: MetadataResult[];
  busy: boolean;
  onMetadataQueryChange(value: string): void;
  onSearchMetadata(): void;
  onApplyMetadata(result: MetadataResult): void;
}) {
  return (
    <section className="detail-card metadata-panel">
      <div>
        <strong>
          <Star size={15} />
          {label}
        </strong>
        <p>{overview ?? 'No overview stored yet.'}</p>
        <span>{meta.filter(Boolean).join(' / ')}</span>
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
    </section>
  );
}

function DetailStat({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="detail-stat">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function groupEpisodesBySeason(episodes: Episode[]) {
  const seasonMap = new Map<number, Episode[]>();
  for (const episode of episodes) {
    const seasonEpisodes = seasonMap.get(episode.seasonNumber) ?? [];
    seasonEpisodes.push(episode);
    seasonMap.set(episode.seasonNumber, seasonEpisodes);
  }

  return [...seasonMap.entries()]
    .sort(([left], [right]) => left - right)
    .map(([seasonNumber, seasonEpisodes]) => ({
      seasonNumber,
      episodes: seasonEpisodes.sort((left, right) => left.episodeNumber - right.episodeNumber)
    }));
}
