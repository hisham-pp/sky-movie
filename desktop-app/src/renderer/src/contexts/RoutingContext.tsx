import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ViewMode } from '../types';

interface RoutingState {
  view: ViewMode;
  showDetailView: boolean;
  selectedMovieId: number | null;
  selectedShowId: number | null;
  selectedPlaylistId: number | null;
}

interface RoutingContextValue {
  state: RoutingState;
  setView: (view: ViewMode) => void;
  setShowDetailView: (show: boolean) => void;
  setSelectedMovieId: (id: number | null) => void;
  setSelectedShowId: (id: number | null) => void;
  setSelectedPlaylistId: (id: number | null) => void;
  backToLibrary: () => void;
}

const RoutingContext = createContext<RoutingContextValue | undefined>(undefined);

const getInitialRoutingState = (): RoutingState => {
  try {
    const savedView = localStorage.getItem('sky-movie-view');
    const savedDetailView = localStorage.getItem('sky-movie-detail-view');
    
    const view: ViewMode = (savedView && ['movies', 'shows', 'playlists', 'scan', 'settings'].includes(savedView)) 
      ? savedView as ViewMode 
      : 'movies';
    
    let showDetailView = false;
    let selectedMovieId: number | null = null;
    let selectedShowId: number | null = null;
    
    if (savedDetailView) {
      try {
        const parsed = JSON.parse(savedDetailView);
        showDetailView = parsed.showDetailView ?? false;
        selectedMovieId = parsed.selectedMovieId ?? null;
        selectedShowId = parsed.selectedShowId ?? null;
      } catch (error) {
        console.error('Failed to parse saved detail view state:', error);
      }
    }
    
    return { view, showDetailView, selectedMovieId, selectedShowId, selectedPlaylistId: null };
  } catch (error) {
    console.error('Failed to load persisted routing state:', error);
    return { view: 'movies', showDetailView: false, selectedMovieId: null, selectedShowId: null, selectedPlaylistId: null };
  }
};

export function RoutingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RoutingState>(getInitialRoutingState);

  const persistRoutingState = (newState: RoutingState) => {
    try {
      localStorage.setItem('sky-movie-view', newState.view);
      if (newState.showDetailView || newState.selectedMovieId || newState.selectedShowId) {
        localStorage.setItem('sky-movie-detail-view', JSON.stringify({
          showDetailView: newState.showDetailView,
          selectedMovieId: newState.selectedMovieId,
          selectedShowId: newState.selectedShowId,
        }));
      } else {
        localStorage.removeItem('sky-movie-detail-view');
      }
    } catch (error) {
      console.error('Failed to persist routing state:', error);
    }
  };

  const setView = (view: ViewMode) => {
    const newState = {
      ...state,
      view,
      showDetailView: false,
      selectedMovieId: null,
      selectedShowId: null,
      selectedPlaylistId: null,
    };
    setState(newState);
    persistRoutingState(newState);
  };

  const setShowDetailView = (showDetailView: boolean) => {
    const newState = { ...state, showDetailView };
    setState(newState);
    persistRoutingState(newState);
  };

  const setSelectedMovieId = (selectedMovieId: number | null) => {
    const newState = { ...state, selectedMovieId, selectedShowId: null, selectedPlaylistId: null };
    setState(newState);
    persistRoutingState(newState);
  };

  const setSelectedShowId = (selectedShowId: number | null) => {
    const newState = { ...state, selectedShowId, selectedMovieId: null, selectedPlaylistId: null };
    setState(newState);
    persistRoutingState(newState);
  };

  const setSelectedPlaylistId = (selectedPlaylistId: number | null) => {
    const newState = { ...state, selectedPlaylistId, selectedMovieId: null, selectedShowId: null };
    setState(newState);
    persistRoutingState(newState);
  };

  const backToLibrary = () => {
    const newState = {
      ...state,
      showDetailView: false,
      selectedMovieId: null,
      selectedShowId: null,
      selectedPlaylistId: null,
    };
    setState(newState);
    persistRoutingState(newState);
  };

  return (
    <RoutingContext.Provider
      value={{
        state,
        setView,
        setShowDetailView,
        setSelectedMovieId,
        setSelectedShowId,
        setSelectedPlaylistId,
        backToLibrary,
      }}
    >
      {children}
    </RoutingContext.Provider>
  );
}

export function useRouting() {
  const context = useContext(RoutingContext);
  if (!context) {
    throw new Error('useRouting must be used within RoutingProvider');
  }
  return context;
}
