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

export function createDatabaseContext(paths: AppDataPaths): DatabaseContext {
  const sqlite = BetterSqlite3(paths.database);
  ensureSqliteSchema(sqlite);
  context = {
    sqlite,
    drizzle: drizzle(sqlite, { schema })
  };
  return context;
}

export function getDatabaseContext(): DatabaseContext {
  if (!context) {
    throw new Error('Database has not been initialized.');
  }

  return context;
}
