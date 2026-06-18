import { app } from 'electron';
import { mkdirSync } from 'node:fs';
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

export function ensureAppDataLayout(): AppDataPaths {
  const root = app.getPath('userData');
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
    paths.cache,
    paths.images,
    paths.posters,
    paths.backdrops,
    paths.subtitles,
    paths.backups,
    paths.exports
  ]) {
    mkdirSync(path, { recursive: true });
  }

  return paths;
}
