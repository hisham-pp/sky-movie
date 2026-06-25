import type { SqliteDatabase } from './client';

/**
 * Removes movies, tv shows, seasons, episodes, genres, credits, tags,
 * and watch progress data that no longer link to any media files.
 *
 * All deletes run inside a single transaction so they either all commit
 * or all roll back, and SQLite only acquires one write lock.
 */
export function pruneOrphans(db: SqliteDatabase): void {
  db.transaction(() => {
    // 1. Movies with no files
    db.prepare(`
      DELETE FROM movies
      WHERE id NOT IN (
        SELECT DISTINCT matched_movie_id FROM media_files
        WHERE matched_movie_id IS NOT NULL
      )
    `).run();

    // 2. Movie genres for deleted movies
    db.prepare(`
      DELETE FROM movie_genres WHERE movie_id NOT IN (SELECT id FROM movies)
    `).run();

    // 3. Episodes with no files
    db.prepare(`
      DELETE FROM episodes
      WHERE id NOT IN (
        SELECT DISTINCT matched_episode_id FROM media_files
        WHERE matched_episode_id IS NOT NULL
      )
    `).run();

    // 4. Seasons with no episodes
    db.prepare(`
      DELETE FROM seasons
      WHERE id NOT IN (SELECT DISTINCT season_id FROM episodes)
    `).run();

    // 5. Shows with no episodes and no files
    db.prepare(`
      DELETE FROM tv_shows
      WHERE id NOT IN (SELECT DISTINCT show_id FROM episodes)
        AND id NOT IN (
          SELECT DISTINCT matched_show_id FROM media_files
          WHERE matched_show_id IS NOT NULL
        )
    `).run();

    // 6. Show genres for deleted shows
    db.prepare(`
      DELETE FROM show_genres WHERE show_id NOT IN (SELECT id FROM tv_shows)
    `).run();

    // 7. Credits for deleted movies/shows
    db.prepare(`
      DELETE FROM credits
      WHERE (media_kind = 'movie' AND movie_id NOT IN (SELECT id FROM movies))
         OR (media_kind = 'show'  AND show_id  NOT IN (SELECT id FROM tv_shows))
    `).run();

    // 8. Watch progress for deleted files
    db.prepare(`
      DELETE FROM watch_progress WHERE media_file_id NOT IN (SELECT id FROM media_files)
    `).run();

    // 9. Watch history for deleted files
    db.prepare(`
      DELETE FROM watch_history WHERE media_file_id NOT IN (SELECT id FROM media_files)
    `).run();

    // 10. Item tags for deleted movies/shows/episodes
    db.prepare(`
      DELETE FROM item_tags
      WHERE (media_kind = 'movie'   AND movie_id   NOT IN (SELECT id FROM movies))
         OR (media_kind = 'show'    AND show_id    NOT IN (SELECT id FROM tv_shows))
         OR (media_kind = 'episode' AND episode_id NOT IN (SELECT id FROM episodes))
    `).run();

    // 11. Collection items for deleted movies/shows
    db.prepare(`
      DELETE FROM collection_items
      WHERE (media_kind = 'movie' AND movie_id NOT IN (SELECT id FROM movies))
         OR (media_kind = 'show'  AND show_id  NOT IN (SELECT id FROM tv_shows))
    `).run();
  })();
}
