import { memo, useMemo, useState, useCallback } from 'react';
import { ArrowLeft, Heart, Play, Tv2, ListMusic } from 'lucide-react';
import type { Episode, MediaFile, MovieMetadataSearchResult, PlayMediaResult, Playlist, TvMetadataSearchResult, TvShow } from '@shared/ipc';
import { PlayerPanel } from '../player/PlayerPanel';
import { MetadataTools } from './MetadataTools';
import { groupEpisodesBySeason } from '../../utils/groupEpisodesBySeason';
import { PlaylistSelectorDialog } from '../playlist/PlaylistSelectorDialog';
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

  return (
    <section className="media-detail-page series-detail-page">
      {show.backdropPath ? <img className="detail-backdrop" src={show.backdropPath} alt={show.title} /> : null}
      <div className="detail-hero">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={17} />
          Back to TV shows
        </button>

        <div className="movie-detail-layout">
          <div className="detail-poster">
            {show.posterPath ? <img src={show.posterPath} alt={show.title} /> : <Tv2 size={38} />}
          </div>
          <div className="detail-copy">
            <div className="detail-title-row">
              <h2>{show.title}</h2>
              <Tooltip content={show.favorite ? 'Remove from favorites' : 'Add to favorites'}>
                <button
                  className={`detail-fav-btn${show.favorite ? ' active' : ''}`}
                  aria-label={show.favorite ? 'Remove from favorites' : 'Add to favorites'}
                  onClick={() => onToggleFavorite('show', show.id, !show.favorite)}
                >
                  <Heart size={18} fill={show.favorite ? 'currentColor' : 'none'} />
                </button>
              </Tooltip>
            </div>
            <div className="hero-chips">
              {meta.map((item) => (
                <span key={String(item)}>{item}</span>
              ))}
            </div>
            <p className="detail-overview">{show.overview ?? 'No series overview stored yet. Load TMDB metadata to enrich this show.'}</p>
            <div className="detail-actions">
              {files.length > 0 ? (
                <Button
                  variant="primary"
                  size="medium"
                  icon={<Play size={16} />}
                  onClick={() => onPlay(files[0])}
                  disabled={busy}
                >
                  {playingFile ? 'Playing' : 'Play Episode'}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="medium"
                  icon={<Play size={16} />}
                  disabled
                >
                  No Files Available
                </Button>
              )}
              <Tooltip content={playlists.length === 0 ? 'Create a playlist first' : 'Add to playlist'}>
                <Button
                  variant="secondary"
                  size="medium"
                  icon={<ListMusic size={16} />}
                  onClick={handleOpenPlaylistDialog}
                  disabled={busy || playlists.length === 0}
                >
                  Add to Playlist
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      <div className="series-detail-content">
        <section className="detail-card episodes-card">
          <div className="section-title">
            <h2>Episodes</h2>
            <span className="section-badge">{seasons.length ? `${seasons.length} season${seasons.length === 1 ? '' : 's'}` : 'No episodes'}</span>
          </div>
          {seasons.length ? (
            <div className="season-list">
              {seasons.map((season: { seasonNumber: number; episodes: Episode[] }) => (
                <section key={season.seasonNumber} className="season-section">
                  <h3>Season {season.seasonNumber}</h3>
                  <div className="episode-grid">
                    {season.episodes.map((episode: Episode) => {
                      const episodeFile = episodeFileMap.get(episode.id);
                      return (
                        <div key={episode.id} className="episode-card">
                          <div 
                            className="episode-thumbnail"
                            style={{
                              backgroundImage: episode.stillPath ? `url(${episode.stillPath})` : 'none'
                            }}
                          >
                            {episodeFile && (
                              <button
                                className="episode-play-overlay"
                                onClick={() => onPlay(episodeFile)}
                                title={`Play: ${episode.title || `Episode ${episode.episodeNumber}`}`}
                              >
                                <Play size={24} />
                              </button>
                            )}
                            <span className="episode-number">
                              {episode.episodeNumber}
                            </span>
                          </div>
                          <div className="episode-info">
                            <span className="episode-label">Episode {episode.episodeNumber}</span>
                            <strong>{episode.title ?? `Episode ${episode.episodeNumber}`}</strong>
                            <small>{episode.runtimeMinutes ? `${episode.runtimeMinutes}m` : ''}</small>
                          </div>
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

        <section className="detail-card player-card">
          <div className="section-title">
            <h2>Playback</h2>
            <span className="section-badge">{files.length} file{files.length === 1 ? '' : 's'}</span>
          </div>
          <PlayerPanel player={player} onOpenExternal={onOpenExternal} />
        </section>

        <section className="detail-card metadata-card">
          <MetadataTools
            label="Series metadata"
            overview={show.overview}
            meta={meta}
            metadataQuery={metadataQuery}
            metadataResults={metadataResults}
            busy={busy}
            onMetadataQueryChange={onMetadataQueryChange}
            onSearchMetadata={onSearchMetadata}
            onApplyMetadata={onApplyMetadata}
          />
        </section>
      </div>

      {showPlaylistDialog && (
        <PlaylistSelectorDialog
          playlists={playlists}
          onSelect={handleSelectPlaylist}
          onClose={handleClosePlaylistDialog}
        />
      )}
    </section>
  );
});
