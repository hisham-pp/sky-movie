import type { SqliteDatabase } from './client';

/**
 * Removes movies, tv shows, seasons, episodes, genres, credits, tags, 
 * and watch progress data that no longer link to any media files.
 */
export function pruneOrphans(db: SqliteDatabase): void {
  // 1. Delete movies that have no media files
  db.prepare(`
    DELETE FROM movies
    WHERE id NOT IN (
      SELECT DISTINCT matched_movie_id
      FROM media_files
      WHERE matched_movie_id IS NOT NULL
    )
  `).run();

  // 2. Delete movie genres that no longer link to a movie
  db.prepare(`
    DELETE FROM movie_genres
    WHERE movie_id NOT IN (SELECT id FROM movies)
  `).run();

  // 3. Delete episodes that have no media files
  db.prepare(`
    DELETE FROM episodes
    WHERE id NOT IN (
      SELECT DISTINCT matched_episode_id
      FROM media_files
      WHERE matched_episode_id IS NOT NULL
    )
  `).run();

  // 4. Delete seasons that have no episodes
  db.prepare(`
    DELETE FROM seasons
    WHERE id NOT IN (
      SELECT DISTINCT season_id
      FROM episodes
    )
  `).run();

  // 5. Delete tv_shows that have no episodes and no media files linked
  db.prepare(`
    DELETE FROM tv_shows
    WHERE id NOT IN (SELECT DISTINCT show_id FROM episodes)
    AND id NOT IN (
      SELECT DISTINCT matched_show_id
      FROM media_files
      WHERE matched_show_id IS NOT NULL
    )
  `).run();

  // 6. Delete show genres that no longer link to a show
  db.prepare(`
    DELETE FROM show_genres
    WHERE show_id NOT IN (SELECT id FROM tv_shows)
  `).run();

  // 7. Delete credits that no longer link to a movie or show
  db.prepare(`
    DELETE FROM credits
    WHERE (media_kind = 'movie' AND movie_id NOT IN (SELECT id FROM movies))
       OR (media_kind = 'show' AND show_id NOT IN (SELECT id FROM tv_shows))
  `).run();

  // 8. Delete watch progress for deleted files
  db.prepare(`
    DELETE FROM watch_progress
    WHERE media_file_id NOT IN (SELECT id FROM media_files)
  `).run();

  // 9. Delete watch history for deleted files
  db.prepare(`
    DELETE FROM watch_history
    WHERE media_file_id NOT IN (SELECT id FROM media_files)
  `).run();

  // 10. Delete item tags for deleted movies, shows, or episodes
  db.prepare(`
    DELETE FROM item_tags
    WHERE (media_kind = 'movie' AND movie_id NOT IN (SELECT id FROM movies))
       OR (media_kind = 'show' AND show_id NOT IN (SELECT id FROM tv_shows))
       OR (media_kind = 'episode' AND episode_id NOT IN (SELECT id FROM episodes))
  `).run();

  // 11. Delete collection items for deleted movies or shows
  db.prepare(`
    DELETE FROM collection_items
    WHERE (media_kind = 'movie' AND movie_id NOT IN (SELECT id FROM movies))
       OR (media_kind = 'show' AND show_id NOT IN (SELECT id FROM tv_shows))
  `).run();
}
