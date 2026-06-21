import { PlaylistView } from '../components/PlaylistView';
import { useLibraryController } from '../hooks/useLibraryController';

export function PlaylistsRoute() {
  const library = useLibraryController();
  
  return (
    <PlaylistView
      playlists={library.playlists}
      selectedPlaylist={library.selectedPlaylist}
      playlistItems={library.playlistItems}
      selectedTitle={library.selectedTitle}
      busy={library.busy}
      onSelectPlaylist={library.selectPlaylist}
      onCreatePlaylist={(name, description) => library.createPlaylist({ name, description })}
      onUpdatePlaylist={(id, name, description) => library.updatePlaylist({ id, name, description })}
      onDeletePlaylist={library.deletePlaylist}
      onRemoveFromPlaylist={(playlistId, itemId) => library.removeFromPlaylist({ playlistId, itemId })}
      onReorderPlaylistItem={(playlistId, itemId, newSortOrder) => library.reorderPlaylistItem(playlistId, itemId, newSortOrder)}
      onBackToLibrary={library.backToLibrary}
      onSelectMovie={library.selectMovie}
      onSelectShow={library.selectShow}
    />
  );
}
