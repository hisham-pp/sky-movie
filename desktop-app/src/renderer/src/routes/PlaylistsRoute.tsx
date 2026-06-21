import { PlaylistView } from '../components/PlaylistView';

interface PlaylistsRouteProps {
  playlists: any[];
  selectedPlaylist: any;
  playlistItems: any[];
  selectedTitle: string;
  busy: boolean;
  onSelectPlaylist: (playlist: any) => Promise<void>;
  onCreatePlaylist: (name: string, description: string) => Promise<void>;
  onUpdatePlaylist: (id: number, name: string, description: string) => Promise<void>;
  onDeletePlaylist: (id: number) => Promise<void>;
  onRemoveFromPlaylist: (playlistId: number, itemId: number) => Promise<void>;
  onReorderPlaylistItem: (playlistId: number, itemId: number, newSortOrder: number) => Promise<void>;
  onBackToLibrary: () => void;
  onSelectMovie: (movie: any) => Promise<void>;
  onSelectShow: (show: any) => Promise<void>;
}

export function PlaylistsRoute(props: PlaylistsRouteProps) {
  return (
    <PlaylistView
      playlists={props.playlists}
      selectedPlaylist={props.selectedPlaylist}
      playlistItems={props.playlistItems}
      selectedTitle={props.selectedTitle}
      busy={props.busy}
      onSelectPlaylist={props.onSelectPlaylist}
      onCreatePlaylist={props.onCreatePlaylist}
      onUpdatePlaylist={props.onUpdatePlaylist}
      onDeletePlaylist={props.onDeletePlaylist}
      onRemoveFromPlaylist={props.onRemoveFromPlaylist}
      onReorderPlaylistItem={props.onReorderPlaylistItem}
      onBackToLibrary={props.onBackToLibrary}
      onSelectMovie={props.onSelectMovie}
      onSelectShow={props.onSelectShow}
    />
  );
}
