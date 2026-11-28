import { existsSync, mkdirSync } from 'node:fs';
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
    const appData = process.env.APPDATA || join(home, 'AppData', 'Roaming');
    const electronDir = join(appData, '@sky-movie', 'desktop-app');
    if (existsSync(join(electronDir, 'database.sqlite'))) {
      return electronDir;
    }
    const legacyDir = join(appData, 'sky-movie');
    if (existsSync(join(legacyDir, 'database.sqlite'))) {
      return legacyDir;
    }
    return electronDir;
  }

  if (platform === 'darwin') {
    const electronDir = join(home, 'Library', 'Application Support', '@sky-movie', 'desktop-app');
    if (existsSync(join(electronDir, 'database.sqlite'))) {
      return electronDir;
    }
    const legacyDir = join(home, 'Library', 'Application Support', 'sky-movie');
    if (existsSync(join(legacyDir, 'database.sqlite'))) {
      return legacyDir;
    }
    return electronDir;
  }

  const xdg = process.env.XDG_CONFIG_HOME || join(home, '.config');
  const electronDir = join(xdg, '@sky-movie', 'desktop-app');
  if (existsSync(join(electronDir, 'database.sqlite'))) {
    return electronDir;
  }
  const legacyDir = join(xdg, 'sky-movie');
  if (existsSync(join(legacyDir, 'database.sqlite'))) {
    return legacyDir;
  }
  return electronDir;
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
