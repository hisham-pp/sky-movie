import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { AppDataPaths } from '../appPaths';
import * as schema from './schema';
import { ensureSqliteSchema } from './migrations';

export type SqliteDatabase = ReturnType<typeof BetterSqlite3>;

export interface DatabaseContext {
  sqlite: SqliteDatabase;
  drizzle: ReturnType<typeof drizzle<typeof schema>>;
}

let context: DatabaseContext | null = null;
let walCheckpointInterval: ReturnType<typeof setInterval> | null = null;

export function createDatabaseContext(paths: AppDataPaths): DatabaseContext {
  const sqlite = BetterSqlite3(paths.database);
  ensureSqliteSchema(sqlite);
  context = {
    sqlite,
    drizzle: drizzle(sqlite, { schema })
  };
  // Periodically flush the WAL file so it doesn't accumulate during long sessions.
  walCheckpointInterval = setInterval(() => {
    try { sqlite.pragma('wal_checkpoint(PASSIVE)'); } catch {}
  }, 15 * 60 * 1000);
  return context;
}

export function closeDatabaseContext(): void {
  if (walCheckpointInterval) {
    clearInterval(walCheckpointInterval);
    walCheckpointInterval = null;
  }
  if (context) {
    try { context.sqlite.pragma('wal_checkpoint(TRUNCATE)'); } catch {}
    context.sqlite.close();
    context = null;
  }
}

export function getDatabaseContext(): DatabaseContext {
  if (!context) {
    throw new Error('Database has not been initialized.');
  }

  return context;
}
