import { useEffect } from 'react';
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

  // Handle URL parameter changes to select movie/show
  useEffect(() => {
    if (selectedId && view === 'movies') {
      const movie = library.movies.find(m => m.id === selectedId);
      if (movie && library.selectedMovie?.id !== selectedId) {
        library.selectMovie(movie);
      }
    } else if (selectedId && view === 'shows') {
      const show = library.shows.find(s => s.id === selectedId);
      if (show && library.selectedShow?.id !== selectedId) {
        library.selectShow(show);
      }
    }
  }, [selectedId, view, library]);

  const handleViewMovieDetails = async (movie: any) => {
    await library.selectMovie(movie);
    navigate(`/movies/${movie.id}`);
  };

  const handleViewShowDetails = async (show: any) => {
    await library.selectShow(show);
    navigate(`/shows/${show.id}`);
  };

  const handleBackToLibrary = () => {
    library.backToLibrary();
    navigate(view === 'movies' ? '/' : '/shows');
  };

  const showDetailView = !!selectedId;

  return (
    <LibraryView
      view={view}
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
      onSelectPlaylist={library.selectPlaylist}
      onCreatePlaylist={(name, description) => library.createPlaylist({ name, description })}
      onUpdatePlaylist={(id, name, description) => library.updatePlaylist({ id, name, description })}
      onDeletePlaylist={library.deletePlaylist}
      onRemoveFromPlaylist={(playlistId, itemId) => library.removeFromPlaylist({ playlistId, itemId })}
    />
  );
}
