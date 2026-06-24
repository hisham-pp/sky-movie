import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LibraryView } from '../components/LibraryView';
import { useLibraryController } from '../hooks/useLibraryController';

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

  // Handle direct URL navigation (deep-link / page refresh).
  // Skip when the click handler already triggered selection for this item.
  useEffect(() => {
    if (selectedId && view === 'movies') {
      const movie = library.movies.find(m => m.id === selectedId);
      const handledByClick = clickSelectedRef.current?.view === 'movies' && clickSelectedRef.current?.id === selectedId;
      if (movie && !handledByClick) {
        library.selectMovie(movie);
      }
      clickSelectedRef.current = null;
    } else if (selectedId && view === 'shows') {
      const show = library.shows.find(s => s.id === selectedId);
      const handledByClick = clickSelectedRef.current?.view === 'shows' && clickSelectedRef.current?.id === selectedId;
      if (show && !handledByClick) {
        library.selectShow(show);
      }
      clickSelectedRef.current = null;
    } else if (selectedId && view === 'playlists') {
      const playlist = library.playlists.find(p => p.id === selectedId);
      if (playlist && library.selectedPlaylist?.id !== selectedId) {
        library.selectPlaylist(playlist);
      }
    }
  }, [selectedId, view, library]);

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
