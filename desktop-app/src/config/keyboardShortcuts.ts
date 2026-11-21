// Centralized keyboard shortcut registry.
// The help overlay renders whatever is listed here — add new shortcuts to
// this file (alongside their real handler) and the overlay stays current.

export interface ShortcutEntry {
  /** One key combination, e.g. ['Ctrl', 'K'] */
  keys: string[];
  description: string;
}

export interface ShortcutSection {
  title: string;
  shortcuts: ShortcutEntry[];
}

export const KEYBOARD_SHORTCUTS: ShortcutSection[] = [
  {
    title: 'General',
    shortcuts: [
      { keys: ['Ctrl', '/'], description: 'Show / hide keyboard shortcuts' },
      { keys: ['Ctrl', 'K'], description: 'Search library' },
      { keys: ['Ctrl', ','], description: 'Open settings' },
      { keys: ['F5'], description: 'Refresh the app' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Alt', '←'], description: 'Go back' },
      { keys: ['Alt', '→'], description: 'Go forward' },
      { keys: ['Ctrl', '1'], description: 'Movies' },
      { keys: ['Ctrl', '2'], description: 'TV shows' },
      { keys: ['Ctrl', 'P'], description: 'Playlists' },
      { keys: ['Ctrl', 'Shift', 'S'], description: 'Scan page' },
      { keys: ['Alt', 'Home'], description: 'Go to Movies' },
    ],
  },
  {
    title: 'Library',
    shortcuts: [
      { keys: ['Ctrl', 'L'], description: 'Resume last watched' },
    ],
  },
  {
    title: 'Player',
    shortcuts: [
      { keys: ['Space'], description: 'Play / pause' },
      { keys: ['K'], description: 'Play / pause' },
      { keys: ['←'], description: 'Seek back 5 seconds' },
      { keys: ['→'], description: 'Seek forward 5 seconds' },
      { keys: ['J'], description: 'Rewind 10 seconds' },
      { keys: ['L'], description: 'Forward 10 seconds' },
      { keys: ['↑'], description: 'Volume up' },
      { keys: ['↓'], description: 'Volume down' },
      { keys: ['M'], description: 'Mute / unmute' },
      { keys: ['F'], description: 'Toggle fullscreen' },
      { keys: ['Ctrl', 'H'], description: 'Next audio track' },
      { keys: ['Ctrl', 'J'], description: 'Next subtitle track' },
    ],
  },
];
