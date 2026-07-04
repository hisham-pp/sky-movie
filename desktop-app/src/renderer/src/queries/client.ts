import type { SkyMovieApi } from '@shared/ipc';

function getSkyMovieApi(): SkyMovieApi {
  if (!window.skyMovie) {
    throw new Error('Sky Movie desktop bridge is unavailable. Restart the Electron app so the preload script can load.');
  }

  return window.skyMovie;
}

/**
 * Wrap a preload-bridge method behind a lazy lookup so importing a query
 * module never crashes when the bridge is missing — only calling one does.
 */
export function bind<K extends keyof SkyMovieApi>(method: K): SkyMovieApi[K] {
  return ((...args: unknown[]) =>
    (getSkyMovieApi()[method] as (...fnArgs: unknown[]) => unknown)(...args)) as SkyMovieApi[K];
}
