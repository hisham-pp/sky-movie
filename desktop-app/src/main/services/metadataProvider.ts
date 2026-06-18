import type { MetadataUpdate } from '../../shared/ipc';
import type { SqliteDatabase } from '../database/client';

export class MetadataProviderManager {
  constructor(private readonly db: SqliteDatabase) {}

  updateMetadata(update: MetadataUpdate): void {
    const now = new Date().toISOString();
    const favorite = update.favorite == null ? undefined : Number(update.favorite);

    if (update.mediaKind === 'movie') {
      this.db
        .prepare(
          `UPDATE movies SET
            title = COALESCE(?, title),
            overview = COALESCE(?, overview),
            release_year = COALESCE(?, release_year),
            rating = COALESCE(?, rating),
            favorite = COALESCE(?, favorite),
            poster_path = COALESCE(?, poster_path),
            backdrop_path = COALESCE(?, backdrop_path),
            updated_at = ?
          WHERE id = ?`
        )
        .run(
          update.title,
          update.overview,
          update.releaseYear,
          update.rating,
          favorite,
          update.posterPath,
          update.backdropPath,
          now,
          update.id
        );
      return;
    }

    this.db
      .prepare(
        `UPDATE tv_shows SET
          title = COALESCE(?, title),
          overview = COALESCE(?, overview),
          first_air_year = COALESCE(?, first_air_year),
          rating = COALESCE(?, rating),
          favorite = COALESCE(?, favorite),
          poster_path = COALESCE(?, poster_path),
          backdrop_path = COALESCE(?, backdrop_path),
          updated_at = ?
        WHERE id = ?`
      )
      .run(
        update.title,
        update.overview,
        update.firstAirYear,
        update.rating,
        favorite,
        update.posterPath,
        update.backdropPath,
        now,
        update.id
      );
  }
}
