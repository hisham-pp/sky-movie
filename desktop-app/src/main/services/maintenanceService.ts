import { mkdir, rm } from 'node:fs/promises';
import type { ClearLocalDataResult } from '../../shared/ipc';
import type { AppDataPaths } from '../appPaths';
import type { SqliteDatabase } from '../database/client';

const clearableTables = [
  'watch_history',
  'watch_progress',
  'collection_items',
  'collections',
  'item_tags',
  'tags',
  'credits',
  'people',
  'show_genres',
  'movie_genres',
  'genres',
  'media_files',
  'episodes',
  'seasons',
  'tv_shows',
  'movies',
  'library_folders',
  'sync_history',
  'sync_profiles'
];

export class MaintenanceService {
  constructor(
    private readonly db: SqliteDatabase,
    private readonly paths: AppDataPaths
  ) {}

  async clearLocalLibraryData(): Promise<ClearLocalDataResult> {
    let removedRows = 0;

    const transaction = this.db.transaction(() => {
      for (const table of clearableTables) {
        const countRow = this.db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number };
        removedRows += Number(countRow.count);
        this.db.prepare(`DELETE FROM ${table}`).run();
      }
    });
    transaction();

    await rm(this.paths.cache, { recursive: true, force: true });
    await Promise.all([
      mkdir(this.paths.images, { recursive: true }),
      mkdir(this.paths.posters, { recursive: true }),
      mkdir(this.paths.backdrops, { recursive: true }),
      mkdir(this.paths.subtitles, { recursive: true })
    ]);

    return {
      removedRows,
      clearedCache: true
    };
  }
}
