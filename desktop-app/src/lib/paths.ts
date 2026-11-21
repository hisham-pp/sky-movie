import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface AppDataPaths {
  root: string;
  database: string;
  cache: string;
  images: string;
  posters: string;
  backdrops: string;
  subtitles: string;
  backups: string;
  exports: string;
}

function resolveUserDataDir(): string {
  if (process.env.SKY_MOVIE_DATA_DIR) {
    return process.env.SKY_MOVIE_DATA_DIR;
  }

  const platform = process.platform;
  const home = homedir();

  if (platform === 'win32') {
    const appData = process.env.APPDATA;
    return appData ? join(appData, 'sky-movie') : join(home, 'AppData', 'Roaming', 'sky-movie');
  }

  if (platform === 'darwin') {
    return join(home, 'Library', 'Application Support', 'sky-movie');
  }

  const xdg = process.env.XDG_CONFIG_HOME;
  return xdg ? join(xdg, 'sky-movie') : join(home, '.config', 'sky-movie');
}

export function ensureAppDataLayout(): AppDataPaths {
  const root = resolveUserDataDir();
  const paths: AppDataPaths = {
    root,
    database: join(root, 'database.sqlite'),
    cache: join(root, 'cache'),
    images: join(root, 'cache', 'images'),
    posters: join(root, 'cache', 'posters'),
    backdrops: join(root, 'cache', 'backdrops'),
    subtitles: join(root, 'cache', 'subtitles'),
    backups: join(root, 'backups'),
    exports: join(root, 'exports')
  };

  for (const path of [
    paths.root,
    paths.cache,
    paths.images,
    paths.posters,
    paths.backdrops,
    paths.subtitles,
    paths.backups,
    paths.exports
  ]) {
    try {
      mkdirSync(path, { recursive: true });
    } catch {
      // Ignore directory already exists
    }
  }

  return paths;
}
