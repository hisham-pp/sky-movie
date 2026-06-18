import type { SqliteDatabase } from './client';

export function ensureSqliteSchema(db: SqliteDatabase): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA synchronous = NORMAL;

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
      updated_at TEXT NOT NULL
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
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS collection_items (
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
    CREATE INDEX IF NOT EXISTS tv_shows_title_idx ON tv_shows(title);
    CREATE INDEX IF NOT EXISTS media_files_movie_idx ON media_files(matched_movie_id);
    CREATE INDEX IF NOT EXISTS media_files_show_idx ON media_files(matched_show_id);
    CREATE INDEX IF NOT EXISTS media_files_episode_idx ON media_files(matched_episode_id);
    CREATE INDEX IF NOT EXISTS watch_history_media_file_idx ON watch_history(media_file_id);

    CREATE VIRTUAL TABLE IF NOT EXISTS library_search USING fts5(
      media_kind,
      title,
      subtitle,
      overview,
      content='',
      tokenize='porter unicode61'
    );
  `);
}
