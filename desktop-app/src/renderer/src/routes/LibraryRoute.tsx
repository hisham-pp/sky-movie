import { useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LibraryView } from '../components/library/LibraryView';
import { useLibraryControllerContext as useLibraryController } from '../hooks/LibraryControllerContext';
import { useLatest } from '../hooks/useLatest';

interface LibraryRouteProps {
  view?: 'movies' | 'shows' | 'playlists';
}

export function LibraryRoute(props: LibraryRouteProps) {
  const library = useLibraryController();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const view = props.view || 'movies';
  const selectedId = params.id ? parseInt(params.id, 10) : undefined;
  const showDetailView = !!selectedId;
  const clickSelectedRef = useRef<{ view: string; id: number } | null>(null);
  const libraryRef = useLatest(library);

  useEffect(() => {
    const lib = libraryRef.current;
    if (selectedId && view === 'movies') {
      const movie = lib.movies.find(m => m.id === selectedId);
      const handledByClick = clickSelectedRef.current?.view === 'movies' && clickSelectedRef.current?.id === selectedId;
      const alreadySelected = lib.selectedMovie?.id === selectedId;
      if (movie && !handledByClick && !alreadySelected) lib.selectMovie(movie);
      clickSelectedRef.current = null;
    } else if (selectedId && view === 'shows') {
      const show = lib.shows.find(s => s.id === selectedId);
      const handledByClick = clickSelectedRef.current?.view === 'shows' && clickSelectedRef.current?.id === selectedId;
      const alreadySelected = lib.selectedShow?.id === selectedId;
      if (show && !handledByClick && !alreadySelected) lib.selectShow(show);
      clickSelectedRef.current = null;
    } else if (selectedId && view === 'playlists') {
      const playlist = lib.playlists.find(p => p.id === selectedId);
      if (playlist && lib.selectedPlaylist?.id !== selectedId) lib.selectPlaylist(playlist);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, view]);

  const handleViewMovieDetails = useCallback(async (movie: any) => {
    clickSelectedRef.current = { view: 'movies', id: movie.id };
    await library.selectMovie(movie);
    navigate(`/movies/${movie.id}`);
  }, [library, navigate]);

  const handleViewShowDetails = useCallback(async (show: any) => {
    clickSelectedRef.current = { view: 'shows', id: show.id };
    await library.selectShow(show);
    navigate(`/shows/${show.id}`);
  }, [library, navigate]);

  const handleBackToLibrary = useCallback(() => {
    library.backToLibrary();
    const basePath = view === 'movies' ? '/' : view === 'shows' ? '/shows' : '/playlists';
    navigate(basePath);
  }, [library, view, navigate]);

  const handleSelectPlaylist = useCallback(async (playlist: any) => {
    if (playlist) {
      await library.selectPlaylist(playlist);
      navigate(`/playlists/${playlist.id}`);
    } else {
      navigate('/playlists');
    }
  }, [library, navigate]);

  const handleAddToPlaylist = useCallback(
    (playlistId: number, mediaKind: string, itemId: number) =>
      library.addToPlaylist({ playlistId, mediaKind: mediaKind as any, movieId: mediaKind === 'movie' ? itemId : undefined, showId: mediaKind === 'show' ? itemId : undefined }),
    [library],
  );

  const handleRemoveFromPlaylist = useCallback(
    (playlistId: number, itemId: number) => library.removeFromPlaylist({ playlistId, itemId }),
    [library],
  );

  const handlePlayAllPlaylist = useCallback(
    () => { void library.playPlaylist(library.playlistItems); },
    [library],
  );

  return (
    <LibraryView
      view={view}
      showDetailView={showDetailView}
      movies={library.movies}
      shows={library.shows}
      selectedTitle={library.selectedTitle}
      selectedMovie={library.selectedMovie}
      selectedShow={library.selectedShow}
      selectedEpisodes={library.selectedEpisodes}
      selectedFiles={library.selectedFiles}
      metadataQuery={library.metadataQuery}
      metadataResults={library.metadataResults}
      busy={library.busy}
      player={library.player}
      lastScan={library.lastScan}
      playlists={library.playlists}
      onSelectMovie={library.selectMovie}
      onSelectShow={library.selectShow}
      onViewMovieDetails={handleViewMovieDetails}
      onViewShowDetails={handleViewShowDetails}
      onBackToLibrary={handleBackToLibrary}
      onMetadataQueryChange={library.setMetadataQuery}
      onSearchMetadata={library.searchSelectedMetadata}
      onApplyMetadata={library.applySelectedMetadata}
      onPlay={library.play}
      onOpenExternal={library.openExternal}
      onDeleteFile={library.deleteFile}
      onShowInFolder={library.showItemInFolder}
      onAddToPlaylist={handleAddToPlaylist}
      selectedPlaylist={library.selectedPlaylist}
      playlistItems={library.playlistItems}
      onSelectPlaylist={handleSelectPlaylist}
      onCreatePlaylist={(name, description) => library.createPlaylist({ name, description })}
      onUpdatePlaylist={(id, name, description) => library.updatePlaylist({ id, name, description })}
      onDeletePlaylist={library.deletePlaylist}
      onRemoveFromPlaylist={handleRemoveFromPlaylist}
      onReorderPlaylistItem={library.reorderPlaylistItem}
      onPlayAllPlaylist={handlePlayAllPlaylist}
      onToggleFavorite={library.toggleFavorite}
    />
  );
}
