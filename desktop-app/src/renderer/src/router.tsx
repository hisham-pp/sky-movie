import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { App } from './App';

export function createRouter() {
  return createMemoryRouter(
    [
      {
        path: '/',
        element: <App />,
        children: [
          {
            index: true,
            element: null, // App handles the default view rendering
          },
        ],
      },
    ],
    {
      initialEntries: ['/'],
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
