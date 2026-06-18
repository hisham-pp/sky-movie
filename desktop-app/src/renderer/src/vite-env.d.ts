/// <reference types="vite/client" />

import type { SkyMovieApi } from '../../shared/ipc';

declare global {
  interface Window {
    skyMovie: SkyMovieApi;
  }
}
