import type { SqliteDatabase } from './client';
import { fileURLToPath } from 'node:url';

export function ensureSqliteSchema(db: SqliteDatabase): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA synchronous = NORMAL;
    PRAGMA cache_size = -64000;
    PRAGMA temp_store = MEMORY;
    PRAGMA mmap_size = 268435456;

    CREATE TABLE IF NOT EXISTS library_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      media_kind TEXT NOT NULL DEFAULT 'mixed',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      original_title TEXT,
      release_year INTEGER,
      overview TEXT,
      poster_path TEXT,
      backdrop_path TEXT,
      runtime_minutes INTEGER,
      rating REAL,
      favorite INTEGER NOT NULL DEFAULT 0,
      added_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tv_shows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      original_title TEXT,
      first_air_year INTEGER,
      overview TEXT,
      poster_path TEXT,
      backdrop_path TEXT,
      rating REAL,
      favorite INTEGER NOT NULL DEFAULT 0,
      added_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS seasons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      show_id INTEGER NOT NULL,
      season_number INTEGER NOT NULL,
      title TEXT,
      overview TEXT,
      poster_path TEXT,
      UNIQUE(show_id, season_number)
    );

    CREATE TABLE IF NOT EXISTS episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      show_id INTEGER NOT NULL,
      season_id INTEGER NOT NULL,
      season_number INTEGER NOT NULL,
      episode_number INTEGER NOT NULL,
      title TEXT,
      overview TEXT,
      runtime_minutes INTEGER,
      air_date TEXT,
      still_path TEXT,
      UNIQUE(show_id, season_number, episode_number)
    );

    CREATE TABLE IF NOT EXISTS media_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      library_folder_id INTEGER NOT NULL,
      media_kind TEXT NOT NULL,
      absolute_path TEXT NOT NULL UNIQUE,
      relative_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      extension TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      modified_time TEXT NOT NULL,
      created_time TEXT NOT NULL,
      hash TEXT,
      duration_seconds INTEGER,
      resolution TEXT,
      video_codec TEXT,
      audio_tracks TEXT,
      subtitle_tracks TEXT,
      matched_movie_id INTEGER,
      matched_show_id INTEGER,
      matched_episode_id INTEGER,
      match_confidence REAL NOT NULL DEFAULT 0,
      match_status TEXT NOT NULL DEFAULT 'unmatched'
    );

    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS movie_genres (
      movie_id INTEGER NOT NULL,
      genre_id INTEGER NOT NULL,
      PRIMARY KEY(movie_id, genre_id)
    );

    CREATE TABLE IF NOT EXISTS show_genres (
      show_id INTEGER NOT NULL,
      genre_id INTEGER NOT NULL,
      PRIMARY KEY(show_id, genre_id)
    );

    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      image_path TEXT
    );

    CREATE TABLE IF NOT EXISTS credits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id INTEGER NOT NULL,
      media_kind TEXT NOT NULL,
      movie_id INTEGER,
      show_id INTEGER,
      episode_id INTEGER,
      job TEXT NOT NULL,
      character_name TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS watch_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_file_id INTEGER NOT NULL UNIQUE,
      position_seconds INTEGER NOT NULL,
      duration_seconds INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      media_kind TEXT,
      title TEXT,
      poster_path TEXT
    );

    CREATE TABLE IF NOT EXISTS watch_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_file_id INTEGER NOT NULL,
      watched_at TEXT NOT NULL,
      position_seconds INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS item_tags (
      tag_id INTEGER NOT NULL,
      media_kind TEXT NOT NULL,
      movie_id INTEGER,
      show_id INTEGER,
      episode_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collection_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection_id INTEGER NOT NULL,
      media_kind TEXT NOT NULL,
      movie_id INTEGER,
      show_id INTEGER,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sync_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sync_type TEXT NOT NULL,
      destination_path TEXT NOT NULL,
      filters_json TEXT,
      include_media_files INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sync_profile_id INTEGER,
      sync_type TEXT NOT NULL,
      destination_path TEXT NOT NULL,
      item_count INTEGER NOT NULL,
      file_count INTEGER NOT NULL,
      total_size INTEGER NOT NULL,
      status TEXT NOT NULL,
      manifest_path TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS movies_title_idx ON movies(title);
    CREATE INDEX IF NOT EXISTS movies_release_year_idx ON movies(release_year);
    CREATE INDEX IF NOT EXISTS movies_fav_year_idx ON movies(favorite DESC, release_year DESC);
    CREATE INDEX IF NOT EXISTS tv_shows_title_idx ON tv_shows(title);
    CREATE INDEX IF NOT EXISTS tv_shows_fav_year_idx ON tv_shows(favorite DESC, first_air_year DESC);
    CREATE INDEX IF NOT EXISTS media_files_movie_idx ON media_files(matched_movie_id);
    CREATE INDEX IF NOT EXISTS media_files_show_idx ON media_files(matched_show_id);
    CREATE INDEX IF NOT EXISTS media_files_episode_idx ON media_files(matched_episode_id);
    CREATE INDEX IF NOT EXISTS watch_history_media_file_idx ON watch_history(media_file_id);
    CREATE INDEX IF NOT EXISTS collection_items_collection_idx ON collection_items(collection_id);
    CREATE INDEX IF NOT EXISTS collection_items_movie_idx ON collection_items(movie_id);
    CREATE INDEX IF NOT EXISTS collection_items_show_idx ON collection_items(show_id);
    CREATE INDEX IF NOT EXISTS watch_progress_media_file_idx ON watch_progress(media_file_id);
    CREATE INDEX IF NOT EXISTS watch_progress_updated_at_idx ON watch_progress(updated_at DESC);

    CREATE VIRTUAL TABLE IF NOT EXISTS library_search USING fts5(
      media_kind,
      title,
      subtitle,
      overview,
      content='',
      tokenize='porter unicode61'
    );
  `);

  // Migration: Add missing columns to existing tables
  try {
    // Check if created_at column exists in collections
    const columns = db.pragma('table_info(collections)') as Array<{ name: string }>;
    const hasCreatedAt = columns.some(col => col.name === 'created_at');
    const hasUpdatedAt = columns.some(col => col.name === 'updated_at');

    if (!hasCreatedAt) {
      db.exec('ALTER TABLE collections ADD COLUMN created_at TEXT');
    }
    if (!hasUpdatedAt) {
      db.exec('ALTER TABLE collections ADD COLUMN updated_at TEXT');
    }
  } catch (error) {
    // Column might already exist or table structure is different
    console.warn('Migration for collections table skipped or failed:', error);
  }

  try {
    // Check if source column exists in movies
    const columns = db.pragma('table_info(movies)') as Array<{ name: string }>;
    const hasSource = columns.some(col => col.name === 'source');

    if (!hasSource) {
      db.exec(`
        ALTER TABLE movies ADD COLUMN source TEXT DEFAULT 'local';
        ALTER TABLE movies ADD COLUMN source_id TEXT;
        ALTER TABLE movies ADD COLUMN source_url TEXT;
        ALTER TABLE movies ADD COLUMN channel_name TEXT;
      `);
    }
  } catch (error) {
    console.warn('Migration for movies table (source columns) skipped or failed:', error);
  }

  try {
    // Check if id column exists in collection_items
    const columns = db.pragma('table_info(collection_items)') as Array<{ name: string }>;
    const hasId = columns.some(col => col.name === 'id');

    if (!hasId) {
      // For SQLite, we need to recreate the table to add a PRIMARY KEY
      // This is a more complex migration
      db.exec(`
        CREATE TABLE collection_items_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          collection_id INTEGER NOT NULL,
          media_kind TEXT NOT NULL,
          movie_id INTEGER,
          show_id INTEGER,
          sort_order INTEGER NOT NULL DEFAULT 0
        );
        INSERT INTO collection_items_new (collection_id, media_kind, movie_id, show_id, sort_order)
        SELECT collection_id, media_kind, movie_id, show_id, sort_order FROM collection_items;
        DROP TABLE collection_items;
        ALTER TABLE collection_items_new RENAME TO collection_items;
      `);
    }
  } catch (error) {
    console.warn('Migration for collection_items table skipped or failed:', error);
  }

  try {
    // Check if media_kind column exists in watch_progress
    const columns = db.pragma('table_info(watch_progress)') as Array<{ name: string }>;
    const hasMediaKind = columns.some(col => col.name === 'media_kind');

    if (!hasMediaKind) {
      db.exec(`
        ALTER TABLE watch_progress ADD COLUMN media_kind TEXT;
        ALTER TABLE watch_progress ADD COLUMN title TEXT;
        ALTER TABLE watch_progress ADD COLUMN poster_path TEXT;
      `);

      // Backfill data
      db.exec(`
        UPDATE watch_progress
        SET 
          media_kind = (SELECT media_kind FROM media_files WHERE media_files.id = watch_progress.media_file_id),
          title = (
            SELECT COALESCE(m.title, s.title, mf.file_name) 
            FROM media_files mf 
            LEFT JOIN movies m ON m.id = mf.matched_movie_id 
            LEFT JOIN tv_shows s ON s.id = mf.matched_show_id 
            WHERE mf.id = watch_progress.media_file_id
          ),
          poster_path = (
            SELECT COALESCE(m.poster_path, s.poster_path) 
            FROM media_files mf 
            LEFT JOIN movies m ON m.id = mf.matched_movie_id 
            LEFT JOIN tv_shows s ON s.id = mf.matched_show_id 
            WHERE mf.id = watch_progress.media_file_id
          )
      `);
    }
  } catch (error) {
    console.warn('Migration for watch_progress table skipped or failed:', error);
  }

  // Migration: Default theme to pitch-black (Premium) if still on previous default cinema
  try {
    const existing = db.prepare('SELECT value FROM app_settings WHERE key = ?').get('settings') as
      | { value: string }
      | undefined;
    if (existing) {
      const parsed = JSON.parse(existing.value);
      if (parsed && (parsed.theme === 'cinema' || !parsed.theme)) {
        parsed.theme = 'pitch-black';
        db.prepare('UPDATE app_settings SET value = ?, updated_at = ? WHERE key = ?')
          .run(JSON.stringify(parsed), new Date().toISOString(), 'settings');
      }
    }
  } catch (error) {
    console.warn('Migration for default theme upgrade skipped or failed:', error);
  }

  // Migration: Convert legacy file:// URLs in movies, tv_shows, and watch_progress to sky-image://
  try {
    const convertUrl = (url: unknown): string | null => {
      if (url == null) return null;
      const s = String(url).trim();
      if (!s) return null;
      if (s.startsWith('sky-image://')) return s;
      if (s.startsWith('file://')) {
        try {
          const absolutePath = fileURLToPath(s);
          return `sky-image://local/${encodeURIComponent(absolutePath)}`;
        } catch {
          return s;
        }
      }
      return s;
    };

    const moviesToUpdate = db
      .prepare("SELECT id, poster_path, backdrop_path FROM movies WHERE poster_path LIKE 'file://%' OR backdrop_path LIKE 'file://%'")
      .all() as { id: number; poster_path: string | null; backdrop_path: string | null }[];
    const updateMovieStmt = db.prepare('UPDATE movies SET poster_path = ?, backdrop_path = ? WHERE id = ?');
    for (const m of moviesToUpdate) {
      updateMovieStmt.run(convertUrl(m.poster_path), convertUrl(m.backdrop_path), m.id);
    }

    const showsToUpdate = db
      .prepare("SELECT id, poster_path, backdrop_path FROM tv_shows WHERE poster_path LIKE 'file://%' OR backdrop_path LIKE 'file://%'")
      .all() as { id: number; poster_path: string | null; backdrop_path: string | null }[];
    const updateShowStmt = db.prepare('UPDATE tv_shows SET poster_path = ?, backdrop_path = ? WHERE id = ?');
    for (const s of showsToUpdate) {
      updateShowStmt.run(convertUrl(s.poster_path), convertUrl(s.backdrop_path), s.id);
    }

    const wpToUpdate = db
      .prepare("SELECT media_file_id, poster_path FROM watch_progress WHERE poster_path LIKE 'file://%'")
      .all() as { media_file_id: number; poster_path: string | null }[];
    const updateWpStmt = db.prepare('UPDATE watch_progress SET poster_path = ? WHERE media_file_id = ?');
    for (const wp of wpToUpdate) {
      updateWpStmt.run(convertUrl(wp.poster_path), wp.media_file_id);
    }
  } catch (error) {
    console.warn('Migration for legacy file:// image URLs skipped or failed:', error);
  }
}
