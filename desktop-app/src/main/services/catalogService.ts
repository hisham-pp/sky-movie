import type { DetailResult, MediaFile, Movie, TvShow } from '../../shared/ipc';
import type { SqliteDatabase } from '../database/client';
import { mapEpisode, mapMediaFile, mapMovie, mapShow } from './rowMappers';

export class CatalogService {
  constructor(private readonly db: SqliteDatabase) {}

  getMovies(query = ''): Movie[] {
    const like = `%${query.trim()}%`;
    const rows = this.db
      .prepare(
        `SELECT * FROM movies
         WHERE ? = '%%' OR title LIKE ? OR COALESCE(original_title, '') LIKE ?
         ORDER BY favorite DESC, COALESCE(release_year, 0) DESC, title ASC`
      )
      .all(like, like, like) as Record<string, unknown>[];

    return rows.map(mapMovie);
  }

  getMovieById(id: number): DetailResult<Movie> {
    const row = this.db.prepare('SELECT * FROM movies WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    const files = this.db
      .prepare('SELECT * FROM media_files WHERE matched_movie_id = ? ORDER BY file_name ASC')
      .all(id) as Record<string, unknown>[];

    return {
      item: row ? mapMovie(row) : null,
      files: files.map(mapMediaFile)
    };
  }

  getShows(query = ''): TvShow[] {
    const like = `%${query.trim()}%`;
    const rows = this.db
      .prepare(
        `SELECT * FROM tv_shows
         WHERE ? = '%%' OR title LIKE ? OR COALESCE(original_title, '') LIKE ?
         ORDER BY favorite DESC, COALESCE(first_air_year, 0) DESC, title ASC`
      )
      .all(like, like, like) as Record<string, unknown>[];

    return rows.map(mapShow);
  }

  getShowById(id: number): DetailResult<TvShow> {
    const row = this.db.prepare('SELECT * FROM tv_shows WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    const files = this.db
      .prepare('SELECT * FROM media_files WHERE matched_show_id = ? ORDER BY relative_path ASC')
      .all(id) as Record<string, unknown>[];
    const episodes = this.db
      .prepare('SELECT * FROM episodes WHERE show_id = ? ORDER BY season_number ASC, episode_number ASC')
      .all(id) as Record<string, unknown>[];

    return {
      item: row ? mapShow(row) : null,
      files: files.map(mapMediaFile),
      episodes: episodes.map(mapEpisode)
    };
  }

  getMediaFile(id: number): MediaFile | null {
    const row = this.db.prepare('SELECT * FROM media_files WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? mapMediaFile(row) : null;
  }

  getUnmatchedFiles(): MediaFile[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM media_files
         WHERE match_status = 'unmatched'
         AND match_confidence < 0.5
         ORDER BY file_name ASC`
      )
      .all() as Record<string, unknown>[];

    return rows.map(mapMediaFile);
  }

  markFileAsIgnored(fileId: number): void {
    this.db
      .prepare(
        `UPDATE media_files
         SET match_status = 'ignored'
         WHERE id = ?`
      )
      .run(fileId);
  }
}
