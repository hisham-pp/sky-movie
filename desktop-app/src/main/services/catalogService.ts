import type { DetailResult, MediaFile, Movie, TvShow } from '../../shared/ipc';
import type { SqliteDatabase } from '../database/client';
import { mapEpisode, mapMediaFile, mapMovie, mapShow } from './rowMappers';
import { pruneOrphans } from '../database/cleanup';

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

  updateFileMatch(fileId: number, matchedMovieId: number | null, matchedShowId: number | null): void {
    let matchedEpisodeId: number | null = null;

    if (matchedShowId !== null) {
      const file = this.db.prepare('SELECT file_name FROM media_files WHERE id = ?').get(fileId) as { file_name: string } | undefined;
      if (file) {
        const { season, episode } = parseSeasonEpisode(file.file_name);
        matchedEpisodeId = ensureSeasonEpisode(this.db, matchedShowId, season, episode);
      }
    }

    this.db
      .prepare(
        `UPDATE media_files
         SET matched_movie_id = ?,
             matched_show_id = ?,
             matched_episode_id = ?,
             match_status = 'manual_matched',
             match_confidence = 1.0
         WHERE id = ?`
      )
      .run(matchedMovieId, matchedShowId, matchedEpisodeId, fileId);

    pruneOrphans(this.db);
  }
}

function parseSeasonEpisode(fileName: string): { season: number; episode: number } {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '');
  const showMatch = withoutExtension.match(/[ ._\-]+s(\d{1,2})e(\d{1,2})/i);
  if (showMatch) {
    return {
      season: Number(showMatch[1]),
      episode: Number(showMatch[2])
    };
  }
  return { season: 1, episode: 1 };
}

function ensureSeasonEpisode(db: SqliteDatabase, showId: number, seasonNumber: number, episodeNumber: number): number {
  let season = db
    .prepare('SELECT id FROM seasons WHERE show_id = ? AND season_number = ?')
    .get(showId, seasonNumber) as { id: number } | undefined;

  if (!season) {
    const result = db
      .prepare('INSERT INTO seasons (show_id, season_number, title, overview, poster_path) VALUES (?, ?, ?, NULL, NULL)')
      .run(showId, seasonNumber, `Season ${seasonNumber}`);
    season = { id: Number(result.lastInsertRowid) };
  }

  let episode = db
    .prepare('SELECT id FROM episodes WHERE show_id = ? AND season_number = ? AND episode_number = ?')
    .get(showId, seasonNumber, episodeNumber) as { id: number } | undefined;

  if (!episode) {
    const result = db
      .prepare(
        `INSERT INTO episodes (show_id, season_id, season_number, episode_number, title, overview, runtime_minutes, air_date, still_path)
         VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, NULL)`
      )
      .run(showId, season.id, seasonNumber, episodeNumber, `Episode ${episodeNumber}`);
    episode = { id: Number(result.lastInsertRowid) };
  }

  return episode.id;
}
