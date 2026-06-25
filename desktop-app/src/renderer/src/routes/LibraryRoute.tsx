import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LibraryView } from '../components/LibraryView';
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
  // Track IDs that were already selected via click handler so the URL-sync
  // effect doesn't fire a second playMedia call for the same item.
  const clickSelectedRef = useRef<{ view: string; id: number } | null>(null);
  // Always-fresh ref so the effect below never depends on library directly
  const libraryRef = useLatest(library);

  // Handle direct URL navigation (deep-link / page refresh).
  // Skip when the click handler already triggered selection for this item.
  // NOTE: library is intentionally excluded from deps — we read it via
  // libraryRef so the effect only fires when selectedId or view changes,
  // not on every render (which would cause an infinite re-render loop).
  useEffect(() => {
    const lib = libraryRef.current;
    if (selectedId && view === 'movies') {
      const movie = lib.movies.find(m => m.id === selectedId);
      const handledByClick = clickSelectedRef.current?.view === 'movies' && clickSelectedRef.current?.id === selectedId;
      if (movie && !handledByClick) {
        lib.selectMovie(movie);
      }
      clickSelectedRef.current = null;
    } else if (selectedId && view === 'shows') {
      const show = lib.shows.find(s => s.id === selectedId);
      const handledByClick = clickSelectedRef.current?.view === 'shows' && clickSelectedRef.current?.id === selectedId;
      if (show && !handledByClick) {
        lib.selectShow(show);
      }
      clickSelectedRef.current = null;
    } else if (selectedId && view === 'playlists') {
      const playlist = lib.playlists.find(p => p.id === selectedId);
      if (playlist && lib.selectedPlaylist?.id !== selectedId) {
        lib.selectPlaylist(playlist);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, view]);

  const handleViewMovieDetails = async (movie: any) => {
    clickSelectedRef.current = { view: 'movies', id: movie.id };
    await library.selectMovie(movie);
    navigate(`/movies/${movie.id}`);
  };

  const handleViewShowDetails = async (show: any) => {
    clickSelectedRef.current = { view: 'shows', id: show.id };
    await library.selectShow(show);
    navigate(`/shows/${show.id}`);
  };

  const handleBackToLibrary = () => {
    library.backToLibrary();
    const basePath = view === 'movies' ? '/' : view === 'shows' ? '/shows' : '/playlists';
    navigate(basePath);
  };

  const handleSelectPlaylist = async (playlist: any) => {
    if (playlist) {
      await library.selectPlaylist(playlist);
      navigate(`/playlists/${playlist.id}`);
    } else {
      navigate('/playlists');
    }
  };

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
      onAddToPlaylist={(playlistId, mediaKind, itemId) => library.addToPlaylist({ playlistId, mediaKind: mediaKind as any, movieId: mediaKind === 'movie' ? itemId : undefined, showId: mediaKind === 'show' ? itemId : undefined })}
      selectedPlaylist={library.selectedPlaylist}
      playlistItems={library.playlistItems}
      onSelectPlaylist={handleSelectPlaylist}
      onCreatePlaylist={(name, description) => library.createPlaylist({ name, description })}
      onUpdatePlaylist={(id, name, description) => library.updatePlaylist({ id, name, description })}
      onDeletePlaylist={library.deletePlaylist}
      onRemoveFromPlaylist={(playlistId, itemId) => library.removeFromPlaylist({ playlistId, itemId })}
      onReorderPlaylistItem={library.reorderPlaylistItem}
    />
  );
}
