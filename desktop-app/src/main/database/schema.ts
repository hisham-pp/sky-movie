import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const libraryFolders = sqliteTable(
  'library_folders',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    path: text('path').notNull(),
    name: text('name').notNull(),
    mediaKind: text('media_kind').notNull().default('mixed'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull()
  },
  (table) => ({
    pathUnique: uniqueIndex('library_folders_path_unique').on(table.path)
  })
);

export const movies = sqliteTable(
  'movies',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    originalTitle: text('original_title'),
    releaseYear: integer('release_year'),
    overview: text('overview'),
    posterPath: text('poster_path'),
    backdropPath: text('backdrop_path'),
    runtimeMinutes: integer('runtime_minutes'),
    rating: real('rating'),
    favorite: integer('favorite', { mode: 'boolean' }).notNull().default(false),
    addedAt: text('added_at').notNull(),
    updatedAt: text('updated_at').notNull()
  },
  (table) => ({
    titleIdx: index('movies_title_idx').on(table.title),
    yearIdx: index('movies_release_year_idx').on(table.releaseYear)
  })
);

export const tvShows = sqliteTable(
  'tv_shows',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    originalTitle: text('original_title'),
    firstAirYear: integer('first_air_year'),
    overview: text('overview'),
    posterPath: text('poster_path'),
    backdropPath: text('backdrop_path'),
    rating: real('rating'),
    favorite: integer('favorite', { mode: 'boolean' }).notNull().default(false),
    addedAt: text('added_at').notNull(),
    updatedAt: text('updated_at').notNull()
  },
  (table) => ({
    titleIdx: index('tv_shows_title_idx').on(table.title)
  })
);

export const seasons = sqliteTable(
  'seasons',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    showId: integer('show_id').notNull(),
    seasonNumber: integer('season_number').notNull(),
    title: text('title'),
    overview: text('overview'),
    posterPath: text('poster_path')
  },
  (table) => ({
    showSeasonUnique: uniqueIndex('seasons_show_number_unique').on(table.showId, table.seasonNumber)
  })
);

export const episodes = sqliteTable(
  'episodes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    showId: integer('show_id').notNull(),
    seasonId: integer('season_id').notNull(),
    seasonNumber: integer('season_number').notNull(),
    episodeNumber: integer('episode_number').notNull(),
    title: text('title'),
    overview: text('overview'),
    runtimeMinutes: integer('runtime_minutes'),
    airDate: text('air_date'),
    stillPath: text('still_path')
  },
  (table) => ({
    episodeUnique: uniqueIndex('episodes_show_season_episode_unique').on(
      table.showId,
      table.seasonNumber,
      table.episodeNumber
    )
  })
);

export const mediaFiles = sqliteTable(
  'media_files',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    libraryFolderId: integer('library_folder_id').notNull(),
    mediaKind: text('media_kind').notNull(),
    absolutePath: text('absolute_path').notNull(),
    relativePath: text('relative_path').notNull(),
    fileName: text('file_name').notNull(),
    extension: text('extension').notNull(),
    fileSize: integer('file_size').notNull(),
    modifiedTime: text('modified_time').notNull(),
    createdTime: text('created_time').notNull(),
    hash: text('hash'),
    durationSeconds: integer('duration_seconds'),
    resolution: text('resolution'),
    videoCodec: text('video_codec'),
    audioTracks: text('audio_tracks'),
    subtitleTracks: text('subtitle_tracks'),
    matchedMovieId: integer('matched_movie_id'),
    matchedShowId: integer('matched_show_id'),
    matchedEpisodeId: integer('matched_episode_id'),
    matchConfidence: real('match_confidence').notNull().default(0),
    matchStatus: text('match_status').notNull().default('unmatched')
  },
  (table) => ({
    pathUnique: uniqueIndex('media_files_path_unique').on(table.absolutePath),
    movieIdx: index('media_files_movie_idx').on(table.matchedMovieId),
    showIdx: index('media_files_show_idx').on(table.matchedShowId)
  })
);

export const genres = sqliteTable('genres', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique()
});

export const people = sqliteTable('people', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  role: text('role').notNull(),
  imagePath: text('image_path')
});

export const watchProgress = sqliteTable(
  'watch_progress',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    mediaFileId: integer('media_file_id').notNull(),
    positionSeconds: integer('position_seconds').notNull(),
    durationSeconds: integer('duration_seconds').notNull(),
    completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
    updatedAt: text('updated_at').notNull()
  },
  (table) => ({
    mediaFileUnique: uniqueIndex('watch_progress_media_file_unique').on(table.mediaFileId)
  })
);

export const watchHistory = sqliteTable('watch_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  mediaFileId: integer('media_file_id').notNull(),
  watchedAt: text('watched_at').notNull(),
  positionSeconds: integer('position_seconds').notNull()
});

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique()
});

export const collections = sqliteTable('collections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description')
});

export const syncProfiles = sqliteTable('sync_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  syncType: text('sync_type').notNull(),
  destinationPath: text('destination_path').notNull(),
  filtersJson: text('filters_json'),
  includeMediaFiles: integer('include_media_files', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
});

export const syncHistory = sqliteTable('sync_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  syncProfileId: integer('sync_profile_id'),
  syncType: text('sync_type').notNull(),
  destinationPath: text('destination_path').notNull(),
  itemCount: integer('item_count').notNull(),
  fileCount: integer('file_count').notNull(),
  totalSize: integer('total_size').notNull(),
  status: text('status').notNull(),
  manifestPath: text('manifest_path'),
  createdAt: text('created_at').notNull()
});

export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull()
});
