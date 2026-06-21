import { createMemoryRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { LibraryRoute } from './routes/LibraryRoute';
import { SettingsRoute } from './routes/SettingsRoute';
import { ScanRoute } from './routes/ScanRoute';
import { PlaylistsRoute } from './routes/PlaylistsRoute';

export function createRouter() {
  return createMemoryRouter(
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
            element: <PlaylistsRoute />,
          },
        ],
      },
    ],
    {
      initialEntries: ['/movies'],
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    }
  );
}

export function Router() {
  const router = createRouter();
  return <RouterProvider router={router} />;
}
