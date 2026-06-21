import { LibraryView } from '../components/LibraryView';

interface LibraryRouteProps {
  view: 'movies' | 'shows';
  movies: any[];
  shows: any[];
  selectedTitle: string;
  selectedMovie: any;
  selectedShow: any;
  selectedEpisodes: any[];
  selectedFiles: any[];
  metadataQuery: string;
  metadataResults: any[];
  busy: boolean;
  player: any;
  lastScan: any;
  playlists: any[];
  showDetailView: boolean;
  setShowDetailView: (show: boolean) => void;
  onSelectMovie: (movie: any) => Promise<void>;
  onSelectShow: (show: any) => Promise<void>;
  onViewMovieDetails: (movie: any) => Promise<void>;
  onViewShowDetails: (show: any) => Promise<void>;
  onBackToLibrary: () => void;
  onMetadataQueryChange: (query: string) => void;
  onSearchMetadata: () => Promise<void>;
  onApplyMetadata: (result: any) => Promise<void>;
  onPlay: (file: any) => Promise<void>;
  onOpenExternal: (mediaFileId: number) => Promise<void>;
  onDeleteFile: (file: any) => Promise<void>;
  onShowInFolder: (file: any) => Promise<void>;
  onAddToPlaylist: (playlistId: number, mediaKind: string, itemId: number) => Promise<void>;
}

export function LibraryRoute(props: LibraryRouteProps) {
  return (
    <LibraryView
      view={props.view}
      movies={props.movies}
      shows={props.shows}
      selectedTitle={props.selectedTitle}
      selectedMovie={props.selectedMovie}
      selectedShow={props.selectedShow}
      selectedEpisodes={props.selectedEpisodes}
      selectedFiles={props.selectedFiles}
      metadataQuery={props.metadataQuery}
      metadataResults={props.metadataResults}
      busy={props.busy}
      player={props.player}
      lastScan={props.lastScan}
      playlists={props.playlists}
      showDetailView={props.showDetailView}
      setShowDetailView={props.setShowDetailView}
      onSelectMovie={props.onSelectMovie}
      onSelectShow={props.onSelectShow}
      onViewMovieDetails={props.onViewMovieDetails}
      onViewShowDetails={props.onViewShowDetails}
      onBackToLibrary={props.onBackToLibrary}
      onMetadataQueryChange={props.onMetadataQueryChange}
      onSearchMetadata={props.onSearchMetadata}
      onApplyMetadata={props.onApplyMetadata}
      onPlay={props.onPlay}
      onOpenExternal={props.onOpenExternal}
      onDeleteFile={props.onDeleteFile}
      onShowInFolder={props.onShowInFolder}
      onAddToPlaylist={props.onAddToPlaylist}
    />
  );
}
