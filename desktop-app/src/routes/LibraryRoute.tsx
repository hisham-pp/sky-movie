'use client';

import { useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LibraryView } from '@/components/library/LibraryView';
import { useLibraryControllerContext as useLibraryController } from '@/hooks/LibraryControllerContext';
import { useLatest } from '@/hooks/useLatest';

interface LibraryRouteProps {
  view?: 'movies' | 'shows' | 'playlists';
}

export function LibraryRoute(props: LibraryRouteProps) {
  const library = useLibraryController();
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const view = props.view || 'movies';
  const selectedId = rawId ? parseInt(String(rawId), 10) : undefined;
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
          router.replace('/movies');
        }
      } else if (view === 'shows') {
        if (lib.selectedShow?.id === id) return;
        const ok = await lib.selectShowById(id, undefined, false);
        if (!ok && isCurrent) {
          router.replace('/shows');
        }
      } else if (view === 'playlists') {
        if (lib.selectedPlaylist?.id === id) return;
        const ok = await lib.selectPlaylistById(id);
        if (!ok && isCurrent) {
          router.replace('/playlists');
        }
      }
    }

    void syncDetailSelection(targetId);

    return () => {
      isCurrent = false;
    };
  }, [selectedId, view, libraryRef, router]);

  const handleViewMovieDetails = useCallback(async (movie: any) => {
    await library.selectMovie(movie, undefined, false);
    router.push(`/movies/${movie.id}`);
  }, [library, router]);

  const handleViewShowDetails = useCallback(async (show: any) => {
    await library.selectShow(show, undefined, false);
    router.push(`/shows/${show.id}`);
  }, [library, router]);

  const handleBackToLibrary = useCallback(() => {
    library.backToLibrary();
    const basePath = view === 'movies' ? '/movies' : view === 'shows' ? '/shows' : '/playlists';
    router.push(basePath);
  }, [library, view, router]);

  const handleSelectPlaylist = useCallback(async (playlist: any) => {
    if (playlist) {
      await library.selectPlaylist(playlist);
      router.push(`/playlists/${playlist.id}`);
    } else {
      await library.selectPlaylist(null);
      router.push('/playlists');
    }
  }, [library, router]);

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
