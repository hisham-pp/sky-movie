import { Download, Film, FolderSearch, History, ListMusic, ListVideo, ScanSearch, Settings, Tv } from 'lucide-react';
import type { ViewMode } from '../types';

export interface NavItem {
  view: ViewMode;
  label: string;
  path: string;
  /** Compact icon (sidebar) */
  icon: React.ReactNode;
  /** Slightly larger icon variant for search modal */
  iconLg: React.ReactNode;
}

export const NAV_MAIN: NavItem[] = [
  { view: 'movies',    label: 'Movies',        path: '/movies',    icon: <Film size={18} />,        iconLg: <Film size={18} /> },
  { view: 'shows',     label: 'TV Shows',      path: '/shows',     icon: <Tv size={18} />,          iconLg: <Tv size={18} /> },
  { view: 'playlists', label: 'Playlists',     path: '/playlists', icon: <ListMusic size={18} />,   iconLg: <ListVideo size={18} /> },
  { view: 'history',   label: 'Watch History', path: '/history',   icon: <History size={18} />,     iconLg: <History size={18} /> },
  { view: 'downloads', label: 'Downloads',     path: '/downloads', icon: <Download size={18} />,    iconLg: <Download size={18} /> },
];

export const NAV_BOTTOM: NavItem[] = [
  { view: 'scan',     label: 'Scan',     path: '/scan',     icon: <FolderSearch size={18} />, iconLg: <ScanSearch size={18} /> },
  { view: 'settings', label: 'Settings', path: '/settings', icon: <Settings size={18} />,    iconLg: <Settings size={18} /> },
];

export const ALL_NAV_ITEMS: NavItem[] = [...NAV_MAIN, ...NAV_BOTTOM];
