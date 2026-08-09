import { memo, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, Heart, Play, Tv2, ListMusic, Search } from 'lucide-react';
import type { Episode, MediaFile, MovieMetadataSearchResult, PlayMediaResult, Playlist, TvMetadataSearchResult, TvShow } from '@shared/ipc';
import { groupEpisodesBySeason } from '../../utils/groupEpisodesBySeason';
import { PlaylistSelectorDialog } from '../playlist/PlaylistSelectorDialog';
import { MetadataSearchDialog } from './MetadataSearchDialog';
import { MediaOptionsMenu } from './MediaOptionsMenu';
import { Button, Tooltip } from '../common';

type MetadataResult = MovieMetadataSearchResult | TvMetadataSearchResult;

export const SeriesDetailPage = memo(function SeriesDetailPage({
  show,
  episodes,
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
}: {
  show: TvShow;
  episodes: Episode[];
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
}) {
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const episodeGridRef = useRef<HTMLDivElement>(null);

  const seasons = useMemo(() => groupEpisodesBySeason(episodes), [episodes]);

  const episodeFileMap = useMemo(() => {
    const map = new Map<number, MediaFile>();
    files.forEach((file) => {
      const match = file.fileName.toLowerCase().match(/s(\d+)e(\d+)|(\d+)x(\d+)/i);
      if (match) {
        const seasonNum = parseInt(match[1] || match[3], 10);
        const episodeNum = parseInt(match[2] || match[4], 10);
        const episode = episodes.find((ep) => ep.seasonNumber === seasonNum && ep.episodeNumber === episodeNum);
        if (episode) map.set(episode.id, file);
      }
    });
    return map;
  }, [files, episodes]);

  // Calculate number of pages based on visible episodes
  const itemsPerPage = 4;
  const totalPages = Math.ceil(episodes.length / itemsPerPage);

  // Handle scroll to update current page indicator
  useEffect(() => {
    const grid = episodeGridRef.current;
    if (!grid) return;

    const handleScroll = () => {
      const scrollLeft = grid.scrollLeft;
      const itemWidth = 300 + 16; // card width + gap
      const page = Math.round(scrollLeft / (itemWidth * itemsPerPage));
      setCurrentPage(page);
    };

    grid.addEventListener('scroll', handleScroll);
    return () => grid.removeEventListener('scroll', handleScroll);
  }, [itemsPerPage]);

  const scrollToPage = useCallback((page: number) => {
    const grid = episodeGridRef.current;
    if (!grid) return;
    const itemWidth = 300 + 16;
    grid.scrollTo({
      left: page * itemWidth * itemsPerPage,
      behavior: 'smooth'
    });
    setCurrentPage(page);
  }, [itemsPerPage]);

  const meta = useMemo(
    () => [show.firstAirYear ?? 'Unknown year', show.rating ? `${show.rating.toFixed(1)} rating` : null],
    [show.firstAirYear, show.rating],
  );

  const handleOpenPlaylistDialog = useCallback(() => setShowPlaylistDialog(true), []);
  const handleClosePlaylistDialog = useCallback(() => setShowPlaylistDialog(false), []);
  const handleSelectPlaylist = useCallback((playlistId: number) => {
    onAddToPlaylist(playlistId, 'show', show.id);
    setShowPlaylistDialog(false);
  }, [onAddToPlaylist, show.id]);

  const handleOpenMetadataDialog = useCallback(() => setShowMetadataDialog(true), []);
  const handleCloseMetadataDialog = useCallback(() => setShowMetadataDialog(false), []);

  const handleDeleteFiles = useCallback((filesToDelete: MediaFile[]) => {
    filesToDelete.forEach(file => onDeleteFile(file));
  }, [onDeleteFile]);

  return (
    <section className="media-detail-page series-detail-page">
      {show.backdropPath ? <img className="detail-backdrop" src={show.backdropPath} alt={show.title} /> : null}
      <div className="detail-hero">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={17} />
          Back to TV shows
        </button>

        <div className="movie-detail-layout">
          <div className="detail-poster-section">
            <div className="detail-poster">
              {show.posterPath ? <img src={show.posterPath} alt={show.title} /> : <Tv2 size={38} />}
            </div>
            <div className="detail-actions">
              {files.length > 0 ? (
                <Button
                  variant="primary"
                  size="small"
                  icon={<Play size={14} />}
                  onClick={() => onPlay(files[0])}
                  disabled={busy}
                />
              ) : (
                <Button
                  variant="primary"
                  size="small"
                  icon={<Play size={14} />}
                  disabled
                />
              )}
              <Tooltip content={playlists.length === 0 ? 'Create a playlist first' : 'Add to playlist'}>
                <Button
                  variant="secondary"
                  size="small"
                  icon={<ListMusic size={14} />}
                  onClick={handleOpenPlaylistDialog}
                  disabled={busy || playlists.length === 0}
                />
              </Tooltip>
              <Tooltip content={show.favorite ? 'Remove from favorites' : 'Add to favorites'}>
                <Button
                  variant="secondary"
                  size="small"
                  icon={<Heart size={14} fill={show.favorite ? 'currentColor' : 'none'} />}
                  onClick={() => onToggleFavorite('show', show.id, !show.favorite)}
                  disabled={busy}
                  className={show.favorite ? 'favorite-active' : ''}
                />
              </Tooltip>
              <Tooltip content="Search metadata">
                <Button
                  variant="secondary"
                  size="small"
                  icon={<Search size={14} />}
                  onClick={handleOpenMetadataDialog}
                  disabled={busy}
                />
              </Tooltip>
              <MediaOptionsMenu
                files={files}
                onDeleteFiles={handleDeleteFiles}
                onShowInFolder={onShowInFolder}
              />
            </div>
          </div>
          <div className="detail-copy">
            <h2>{show.title}</h2>
            <div className="hero-chips">
              {meta.map((item) => (
                <span key={String(item)}>{item}</span>
              ))}
            </div>
            <p className="detail-subtitle">{episodes.length} episode{episodes.length === 1 ? '' : 's'}</p>
            <p className="detail-overview">{show.overview ?? 'No series overview stored yet. Load TMDB metadata to enrich this show.'}</p>
          </div>
        </div>
      </div>

      <div className="series-detail-content">
        {/* Player section removed - using floating player instead */}

        <section className="episodes-section">
          <div className="section-title">
            <h2>Episodes</h2>
            {totalPages > 1 && (
              <div className="episode-scroll-indicators">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={`episode-scroll-dot ${i === currentPage ? 'active' : ''}`}
                    onClick={() => scrollToPage(i)}
                    aria-label={`Go to page ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
          {episodes.length > 0 ? (
            <div className="episode-grid" ref={episodeGridRef}>
              {episodes.map((episode: Episode) => {
                const episodeFile = episodeFileMap.get(episode.id);
                const thumbnailUrl = episode.stillPath || show.backdropPath || null;
                return (
                  <div key={episode.id} className="episode-card">
                    <div 
                      className="episode-thumbnail"
                      style={{
                        backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : 'none'
                      }}
                    >
                      {episodeFile && (
                        <button
                          className="episode-play-overlay"
                          onClick={() => onPlay(episodeFile)}
                          title={`Play: ${episode.title || `S${episode.seasonNumber}E${episode.episodeNumber}`}`}
                        >
                          <Play size={24} />
                        </button>
                      )}
                      <span className="episode-number">
                        S{episode.seasonNumber}E{episode.episodeNumber}
                      </span>
                    </div>
                    <div className="episode-info">
                      <span className="episode-label">Season {episode.seasonNumber} · Episode {episode.episodeNumber}</span>
                      <strong>{episode.title ?? `Episode ${episode.episodeNumber}`}</strong>
                      <small>{episode.runtimeMinutes ? `${episode.runtimeMinutes}m` : ''}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="detail-empty">
              <Tv2 size={22} />
              <span>No episode records yet. Apply metadata or rescan the show folder.</span>
            </div>
          )}
        </section>
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
          title={show.title}
          metadataQuery={metadataQuery}
          metadataResults={metadataResults}
          busy={busy}
          onMetadataQueryChange={onMetadataQueryChange}
          onSearchMetadata={onSearchMetadata}
          onApplyMetadata={onApplyMetadata}
          onClose={handleCloseMetadataDialog}
        />
      )}
    </section>
  );
});
