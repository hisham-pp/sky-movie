import { useEffect, useRef } from 'react';
import type { ViewMode } from '../types';

interface KeyboardShortcutHandlers {
  onSearchToggle: () => void;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  onHome: () => void;
  onSettings: () => void;
  onScan: () => void;
  onPlaylists: () => void;
  onShows?: () => void;
}

interface NavigationState {
  view: ViewMode;
  selectedMovie: any;
  selectedShow: any;
  selectedPlaylist: any;
}

export function useGlobalKeyboardShortcuts(
  handlers: KeyboardShortcutHandlers,
  navigationState: NavigationState
) {
  const handlersRef = useRef(handlers);
  const stateRef = useRef(navigationState);

  // Update refs when handlers or state change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    stateRef.current = navigationState;
  }, [navigationState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = stateRef.current;
      const currentHandlers = handlersRef.current;

      // Search: Ctrl/Cmd + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        currentHandlers.onSearchToggle();
        return;
      }

      // Back navigation: Alt + Left Arrow (Windows/Linux) or Cmd + [ (Mac)
      if ((e.altKey && e.key === 'ArrowLeft') || (e.metaKey && e.key === '[')) {
        e.preventDefault();
        currentHandlers.onBack();
        return;
      }

      // Forward navigation: Alt + Right Arrow (Windows/Linux) or Cmd + ] (Mac)
      if ((e.altKey && e.key === 'ArrowRight') || (e.metaKey && e.key === ']')) {
        e.preventDefault();
        currentHandlers.onForward();
        return;
      }

      // Refresh: F5 or Ctrl/Cmd + R
      if (e.key === 'F5' || ((e.metaKey || e.ctrlKey) && e.key === 'r')) {
        e.preventDefault();
        currentHandlers.onRefresh();
        return;
      }

      // Home: Alt + Home (Windows/Linux) or Cmd + Shift + H (Mac)
      if ((e.altKey && e.key === 'Home') || (e.metaKey && e.shiftKey && e.key === 'h')) {
        e.preventDefault();
        currentHandlers.onHome();
        return;
      }

      // Settings: Ctrl/Cmd + ,
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        currentHandlers.onSettings();
        return;
      }

      // Scan: Ctrl/Cmd + Shift + S
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 's') {
        e.preventDefault();
        currentHandlers.onScan();
        return;
      }

      // Playlists: Ctrl/Cmd + P
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        currentHandlers.onPlaylists();
        return;
      }

      // Movies: Ctrl/Cmd + 1
      if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        currentHandlers.onHome();
        return;
      }

      // Shows: Ctrl/Cmd + 2
      if ((e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        if (currentHandlers.onShows) {
          currentHandlers.onShows();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty dependency array - this runs once and stays global
}
