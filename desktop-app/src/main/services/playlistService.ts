import type {
  AddToPlaylistRequest,
  CreatePlaylistRequest,
  Playlist,
  PlaylistItem,
  RemoveFromPlaylistRequest,
  UpdatePlaylistRequest
} from '../../shared/ipc';
import type { SqliteDatabase } from '../database/client';
import { mapMovie, mapShow } from './rowMappers';

export class PlaylistService {
  constructor(private readonly db: SqliteDatabase) {}

  getPlaylists(): Playlist[] {
    const rows = this.db
      .prepare(
        `SELECT c.*,
                COUNT(ci.id) as item_count
         FROM collections c
         LEFT JOIN collection_items ci ON c.id = ci.collection_id
         GROUP BY c.id
         ORDER BY c.name ASC`
      )
      .all() as Record<string, unknown>[];

    return rows.map((row) => ({
      id: row.id as number,
      name: row.name as string,
      description: row.description as string | null,
      itemCount: row.item_count as number,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    }));
  }

  getPlaylistById(id: number): PlaylistItem[] {
    const rows = this.db
      .prepare(
        `SELECT ci.*,
                m.id as movie_id,
                m.title as movie_title,
                m.original_title as movie_original_title,
                m.release_year as movie_release_year,
                m.overview as movie_overview,
                m.poster_path as movie_poster_path,
                m.backdrop_path as movie_backdrop_path,
                m.runtime_minutes as movie_runtime_minutes,
                m.rating as movie_rating,
                m.favorite as movie_favorite,
                m.added_at as movie_added_at,
                m.updated_at as movie_updated_at,
                s.id as show_id,
                s.title as show_title,
                s.original_title as show_original_title,
                s.first_air_year as show_first_air_year,
                s.overview as show_overview,
                s.poster_path as show_poster_path,
                s.backdrop_path as show_backdrop_path,
                s.rating as show_rating,
                s.favorite as show_favorite,
                s.added_at as show_added_at,
                s.updated_at as show_updated_at
         FROM collection_items ci
         LEFT JOIN movies m ON ci.movie_id = m.id
         LEFT JOIN tv_shows s ON ci.show_id = s.id
         WHERE ci.collection_id = ?
         ORDER BY ci.sort_order ASC`
      )
      .all(id) as Record<string, unknown>[];

    return rows.map((row) => ({
      id: row.id as number,
      playlistId: row.collection_id as number,
      mediaKind: row.media_kind as 'movie' | 'show',
      movieId: row.movie_id as number | null,
      showId: row.show_id as number | null,
      sortOrder: row.sort_order as number,
      movie: row.movie_id
        ? mapMovie({
            id: row.movie_id as number,
            title: row.movie_title as string,
            original_title: row.movie_original_title as string | null,
            release_year: row.movie_release_year as number | null,
            overview: row.movie_overview as string | null,
            poster_path: row.movie_poster_path as string | null,
            backdrop_path: row.movie_backdrop_path as string | null,
            runtime_minutes: row.movie_runtime_minutes as number | null,
            rating: row.movie_rating as number | null,
            favorite: row.movie_favorite as number,
            added_at: row.movie_added_at as string,
            updated_at: row.movie_updated_at as string
          })
        : null,
      show: row.show_id
        ? mapShow({
            id: row.show_id as number,
            title: row.show_title as string,
            original_title: row.show_original_title as string | null,
            first_air_year: row.show_first_air_year as number | null,
            overview: row.show_overview as string | null,
            poster_path: row.show_poster_path as string | null,
            backdrop_path: row.show_backdrop_path as string | null,
            rating: row.show_rating as number | null,
            favorite: row.show_favorite as number,
            added_at: row.show_added_at as string,
            updated_at: row.show_updated_at as string
          })
        : null
    }));
  }

  createPlaylist(request: CreatePlaylistRequest): Playlist {
    const now = new Date().toISOString();
    const result = this.db
      .prepare(
        `INSERT INTO collections (name, description, created_at, updated_at)
         VALUES (?, ?, ?, ?)`
      )
      .run(request.name, request.description ?? null, now, now);

    const row = this.db.prepare('SELECT * FROM collections WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;

    return {
      id: row.id as number,
      name: row.name as string,
      description: row.description as string | null,
      itemCount: 0,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    };
  }

  updatePlaylist(request: UpdatePlaylistRequest): Playlist {
    const now = new Date().toISOString();
    const updates: string[] = ['updated_at = ?'];
    const params: unknown[] = [now];

    if (request.name !== undefined) {
      updates.push('name = ?');
      params.push(request.name);
    }

    if (request.description !== undefined) {
      updates.push('description = ?');
      params.push(request.description);
    }

    params.push(request.id);

    this.db
      .prepare(`UPDATE collections SET ${updates.join(', ')} WHERE id = ?`)
      .run(...params);

    const row = this.db.prepare('SELECT * FROM collections WHERE id = ?').get(request.id) as Record<string, unknown>;
    const itemCount = this.db
      .prepare('SELECT COUNT(*) as count FROM collection_items WHERE collection_id = ?')
      .get(request.id) as { count: number };

    return {
      id: row.id as number,
      name: row.name as string,
      description: row.description as string | null,
      itemCount: itemCount.count,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    };
  }

  deletePlaylist(id: number): void {
    this.db.prepare('DELETE FROM collection_items WHERE collection_id = ?').run(id);
    this.db.prepare('DELETE FROM collections WHERE id = ?').run(id);
  }

  addToPlaylist(request: AddToPlaylistRequest): void {
    const maxSort = this.db
      .prepare('SELECT MAX(sort_order) as max_sort FROM collection_items WHERE collection_id = ?')
      .get(request.playlistId) as { max_sort: number | null };
    const nextSort = (maxSort?.max_sort ?? -1) + 1;

    this.db
      .prepare(
        `INSERT INTO collection_items (collection_id, media_kind, movie_id, show_id, sort_order)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(request.playlistId, request.mediaKind, request.movieId ?? null, request.showId ?? null, nextSort);

    const now = new Date().toISOString();
    this.db.prepare('UPDATE collections SET updated_at = ? WHERE id = ?').run(now, request.playlistId);
  }

  removeFromPlaylist(request: RemoveFromPlaylistRequest): void {
    this.db.prepare('DELETE FROM collection_items WHERE id = ?').run(request.itemId);

    const now = new Date().toISOString();
    this.db.prepare('UPDATE collections SET updated_at = ? WHERE id = ?').run(now, request.playlistId);
  }

  reorderPlaylistItem(playlistId: number, itemId: number, newSortOrder: number): void {
    const item = this.db
      .prepare('SELECT sort_order FROM collection_items WHERE id = ?')
      .get(itemId) as { sort_order: number } | undefined;

    if (!item) {
      throw new Error('Item not found');
    }

    const oldSortOrder = item.sort_order;

    if (newSortOrder > oldSortOrder) {
      this.db
        .prepare(
          `UPDATE collection_items
           SET sort_order = sort_order - 1
           WHERE collection_id = ? AND sort_order > ? AND sort_order <= ?`
        )
        .run(playlistId, oldSortOrder, newSortOrder);
    } else if (newSortOrder < oldSortOrder) {
      this.db
        .prepare(
          `UPDATE collection_items
           SET sort_order = sort_order + 1
           WHERE collection_id = ? AND sort_order >= ? AND sort_order < ?`
        )
        .run(playlistId, newSortOrder, oldSortOrder);
    }

    this.db
      .prepare('UPDATE collection_items SET sort_order = ? WHERE id = ?')
      .run(newSortOrder, itemId);

    const now = new Date().toISOString();
    this.db.prepare('UPDATE collections SET updated_at = ? WHERE id = ?').run(now, playlistId);
  }
}
