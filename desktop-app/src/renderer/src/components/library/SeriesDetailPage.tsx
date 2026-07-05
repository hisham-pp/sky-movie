import { memo, useMemo, useState, useCallback } from 'react';
import { ArrowLeft, Calendar, Heart, Play, Star, Tv2, FolderSearch, ListMusic } from 'lucide-react';
import type { Episode, MediaFile, MovieMetadataSearchResult, PlayMediaResult, Playlist, TvMetadataSearchResult, TvShow } from '@shared/ipc';
import { PlayerPanel } from '../player/PlayerPanel';
import { FileList } from './FileList';
import { MetadataTools } from './MetadataTools';
import { DetailStat } from './DetailStat';
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
      {show.backdropPath ? <img className="detail-backdrop" src={show.backdropPath} alt="" /> : null}
      <div className="series-hero">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={17} />
          Back to TV shows
        </button>
        <div className="series-title-row">
          <div>
            <span className="detail-kicker">Series detail</span>
            <div className="detail-title-row">
              <h2>{show.title}</h2>
              <Tooltip content={show.favorite ? 'Remove from favorites' : 'Add to favorites'}>
                <button
                  className={`detail-fav-btn${show.favorite ? ' active' : ''}`}
                  aria-label={show.favorite ? 'Remove from favorites' : 'Add to favorites'}
                  onClick={() => onToggleFavorite('show', show.id, !show.favorite)}
                >
                  <Heart size={17} fill={show.favorite ? 'currentColor' : 'none'} />
                </button>
              </Tooltip>
            </div>
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
        <Tooltip content={playlists.length === 0 ? 'Create a playlist first' : 'Add to playlist'}>
          <Button
            variant="secondary"
            size="medium"
            icon={<ListMusic />}
            onClick={handleOpenPlaylistDialog}
            disabled={busy || playlists.length === 0}
          >
            Add to Playlist
          </Button>
        </Tooltip>
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
                {seasons.map((season: { seasonNumber: number; episodes: Episode[] }) => (
                  <section key={season.seasonNumber} className="season-card">
                    <h3>Season {season.seasonNumber}</h3>
                    <div className="episode-list">
                      {season.episodes.map((episode: Episode) => {
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
            meta={meta}
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
          onSelect={handleSelectPlaylist}
          onClose={handleClosePlaylistDialog}
        />
      )}
    </section>
  );
});
