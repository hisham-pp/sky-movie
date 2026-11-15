import { useEffect, useCallback } from 'react';
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
  const libraryRef = useLatest(library);

  useEffect(() => {
    const lib = libraryRef.current;
    const targetId = selectedId;

    if (typeof targetId !== 'number') {
      if (view === 'movies' && lib.selectedMovie) {
        lib.backToLibrary();
      } else if (view === 'shows' && lib.selectedShow) {
        lib.backToLibrary();
      } else if (view === 'playlists' && lib.selectedPlaylist) {
        void lib.selectPlaylist(null);
      }
      return;
    }

    let isCurrent = true;

    async function syncDetailSelection(id: number) {
      if (view === 'movies') {
        if (lib.selectedMovie?.id === id) return;
        const ok = await lib.selectMovieById(id, undefined, false);
        if (!ok && isCurrent) {
          navigate('/movies', { replace: true });
        }
      } else if (view === 'shows') {
        if (lib.selectedShow?.id === id) return;
        const ok = await lib.selectShowById(id, undefined, false);
        if (!ok && isCurrent) {
          navigate('/shows', { replace: true });
        }
      } else if (view === 'playlists') {
        if (lib.selectedPlaylist?.id === id) return;
        const ok = await lib.selectPlaylistById(id);
        if (!ok && isCurrent) {
          navigate('/playlists', { replace: true });
        }
      }
    }

    void syncDetailSelection(targetId);

    return () => {
      isCurrent = false;
    };
  }, [selectedId, view, libraryRef, navigate]);

  const handleViewMovieDetails = useCallback(async (movie: any) => {
    await library.selectMovie(movie, undefined, false);
    navigate(`/movies/${movie.id}`);
  }, [library, navigate]);

  const handleViewShowDetails = useCallback(async (show: any) => {
    await library.selectShow(show, undefined, false);
    navigate(`/shows/${show.id}`);
  }, [library, navigate]);

  const handleBackToLibrary = useCallback(() => {
    library.backToLibrary();
    const basePath = view === 'movies' ? '/movies' : view === 'shows' ? '/shows' : '/playlists';
    navigate(basePath);
  }, [library, view, navigate]);

  const handleSelectPlaylist = useCallback(async (playlist: any) => {
    if (playlist) {
      await library.selectPlaylist(playlist);
      navigate(`/playlists/${playlist.id}`);
    } else {
      await library.selectPlaylist(null);
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
