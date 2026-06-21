import { createMemoryRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { LibraryRoute } from './routes/LibraryRoute';
import { SettingsRoute } from './routes/SettingsRoute';
import { ScanRoute } from './routes/ScanRoute';

const STORAGE_KEY = 'sky-movie-router-history';
const MAX_HISTORY_SIZE = 100;

interface RouterHistory {
  entries: string[];
  index: number;
}

function getInitialHistory(): { entries: string[]; index: number } {
  try {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      const parsed: RouterHistory = JSON.parse(savedHistory);
      if (parsed.entries && Array.isArray(parsed.entries) && parsed.entries.length > 0) {
        // Validate that all entries are valid paths
        const validEntries = parsed.entries.filter((entry: string) => 
          typeof entry === 'string' && entry.startsWith('/')
        );
        if (validEntries.length > 0) {
          const validIndex = Math.min(parsed.index, validEntries.length - 1);
          return {
            entries: validEntries,
            index: Math.max(0, validIndex)
          };
        }
      }
    }
  } catch (error) {
    console.error('Failed to load saved router history:', error);
  }
  return { entries: ['/movies'], index: 0 };
}

function saveRouterHistory(entries: string[], index: number) {
  try {
    // Limit history size to prevent localStorage bloat
    const limitedEntries = entries.slice(-MAX_HISTORY_SIZE);
    const adjustedIndex = index - (entries.length - limitedEntries.length);
    
    const history: RouterHistory = {
      entries: limitedEntries,
      index: Math.max(0, adjustedIndex)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save router history:', error);
  }
}

export function createRouter() {
  const initialHistory = getInitialHistory();
  
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/movies" replace />,
          },
          {
            path: 'movies',
            element: <LibraryRoute view="movies" />,
          },
          {
            path: 'movies/:id',
            element: <LibraryRoute view="movies" />,
          },
          {
            path: 'shows',
            element: <LibraryRoute view="shows" />,
          },
          {
            path: 'shows/:id',
            element: <LibraryRoute view="shows" />,
          },
          {
            path: 'settings',
            element: <SettingsRoute />,
          },
          {
            path: 'scan',
            element: <ScanRoute />,
          },
          {
            path: 'playlists',
            element: <LibraryRoute view="playlists" />,
          },
          {
            path: 'playlists/:id',
            element: <LibraryRoute view="playlists" />,
          },
        ],
      },
    ],
    {
      initialEntries: initialHistory.entries,
      initialIndex: initialHistory.index,
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    }
  );

  // Track history state manually since RouterState doesn't expose it
  let historyEntries: string[] = initialHistory.entries;
  let historyIndex: number = initialHistory.index;

  // Listen to route changes and persist the full navigation history
  router.subscribe((state) => {
    if (state.location) {
      const currentPath = state.location.pathname;
      
      // Check if this is a new navigation (not just a state change)
      const lastPath = historyEntries[historyIndex];
      if (currentPath !== lastPath) {
        // If we went back, find the matching entry in history
        const existingIndex = historyEntries.indexOf(currentPath);
        if (existingIndex !== -1 && existingIndex < historyIndex) {
          // Going back to existing entry
          historyIndex = existingIndex;
        } else if (existingIndex !== -1 && existingIndex > historyIndex) {
          // Going forward to existing entry
          historyIndex = existingIndex;
        } else {
          // New navigation
          // Remove any entries after current index (if we went back then navigated somewhere new)
          historyEntries = historyEntries.slice(0, historyIndex + 1);
          historyEntries.push(currentPath);
          historyIndex = historyEntries.length - 1;
        }
        
        saveRouterHistory(historyEntries, historyIndex);
      }
    }
  });

  return router;
}

export function Router() {
  const router = createRouter();
  return <RouterProvider router={router} />;
}
