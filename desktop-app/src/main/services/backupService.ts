import { readFile, writeFile } from 'node:fs/promises';
import type { BackupResult } from '../../shared/ipc';
import type { AppDataPaths } from '../appPaths';
import type { SqliteDatabase } from '../database/client';

const backupTables = [
  'app_settings',
  'library_folders',
  'movies',
  'tv_shows',
  'seasons',
  'episodes',
  'media_files',
  'genres',
  'movie_genres',
  'show_genres',
  'people',
  'credits',
  'watch_progress',
  'watch_history',
  'tags',
  'item_tags',
  'collections',
  'collection_items',
  'sync_profiles',
  'sync_history'
];

interface BackupFile {
  format: 'sky-movie-backup';
  version: 1;
  createdAt: string;
  tables: Record<string, Record<string, unknown>[]>;
}

export class BackupService {
  constructor(
    private readonly db: SqliteDatabase,
    private readonly paths: AppDataPaths
  ) {}

  async createBackup(destinationPath: string): Promise<BackupResult> {
    const createdAt = new Date().toISOString();
    const tables: BackupFile['tables'] = {};
    let rowCount = 0;

    for (const table of backupTables) {
      const rows = this.db.prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[];
      tables[table] = rows;
      rowCount += rows.length;
    }

    const backup: BackupFile = {
      format: 'sky-movie-backup',
      version: 1,
      createdAt,
      tables
    };

    await writeFile(destinationPath, JSON.stringify(backup, null, 2), 'utf8');

    return {
      backupPath: destinationPath,
      tableCount: backupTables.length,
      rowCount,
      createdAt
    };
  }

  async restoreBackup(path: string): Promise<BackupResult> {
    const backup = JSON.parse(await readFile(path, 'utf8')) as BackupFile;
    if (backup.format !== 'sky-movie-backup' || backup.version !== 1) {
      throw new Error('Unsupported Sky Movie backup file.');
    }

    let rowCount = 0;
    const transaction = this.db.transaction(() => {
      for (const table of [...backupTables].reverse()) {
        this.db.prepare(`DELETE FROM ${table}`).run();
      }

      for (const table of backupTables) {
        const rows = backup.tables[table] ?? [];
        for (const row of rows) {
          const columns = Object.keys(row);
          if (columns.length === 0) {
            continue;
          }

          const placeholders = columns.map(() => '?').join(', ');
          const quotedColumns = columns.map((column) => `"${column}"`).join(', ');
          this.db
            .prepare(`INSERT INTO ${table} (${quotedColumns}) VALUES (${placeholders})`)
            .run(...columns.map((column) => row[column]));
          rowCount += 1;
        }
      }
    });
    transaction();

    return {
      backupPath: path,
      tableCount: backupTables.length,
      rowCount,
      createdAt: backup.createdAt
    };
  }
}
