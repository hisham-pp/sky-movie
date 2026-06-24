import { mkdir, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { net } from 'electron';
import type {
  ApplyMovieMetadataRequest,
  ApplyTvMetadataRequest,
  MetadataUpdate,
  Movie,
  MovieMetadataSearchRequest,
  MovieMetadataSearchResult,
  TvMetadataSearchRequest,
  TvMetadataSearchResult,
  TvShow
} from '../../shared/ipc';
import type { AppDataPaths } from '../appPaths';
import type { SqliteDatabase } from '../database/client';
import { SettingsService } from './settingsService';
import { mapMovie, mapShow } from './rowMappers';

interface TmdbSearchResponse {
  results: TmdbMovieSearchItem[];
}

interface TmdbTvSearchResponse {
  results: TmdbTvSearchItem[];
}

interface TmdbMovieSearchItem {
  id: number;
  title: string;
  original_title?: string;
  release_date?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
}

interface TmdbTvSearchItem {
  id: number;
  name: string;
  original_name?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
}

interface TmdbMovieDetails extends TmdbMovieSearchItem {
  runtime?: number | null;
  genres?: Array<{ id: number; name: string }>;
  credits?: {
    cast?: Array<{ id: number; name: string; character?: string; profile_path?: string | null; order?: number }>;
    crew?: Array<{ id: number; name: string; job?: string; department?: string; profile_path?: string | null }>;
  };
}

interface TmdbTvDetails extends TmdbTvSearchItem {
  genres?: Array<{ id: number; name: string }>;
  credits?: {
    cast?: Array<{ id: number; name: string; character?: string; profile_path?: string | null; order?: number }>;
    crew?: Array<{ id: number; name: string; job?: string; department?: string; profile_path?: string | null }>;
  };
}

interface TmdbConfiguration {
  images?: {
    secure_base_url?: string;
    poster_sizes?: string[];
    backdrop_sizes?: string[];
    profile_sizes?: string[];
  };
}

export class MetadataProviderManager {
  constructor(
    private readonly db: SqliteDatabase,
    private readonly paths: AppDataPaths,
    private readonly settings: SettingsService
  ) {}

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

  async searchMovieMetadata(request: MovieMetadataSearchRequest): Promise<MovieMetadataSearchResult[]> {
    const search = normalizeMetadataSearch(request.query, request.year);
    if (!search.query) {
      return [];
    }

    const settings = this.settings.getSettings();
    const apiKey = settings.tmdbApiKey.trim();
    if (!apiKey) {
      throw new Error('Add a TMDB API key in Settings before searching movie metadata.');
    }

    const body = await searchTmdbMovie(apiKey, settings.tmdbLanguage || 'en-US', search.query, search.year);
    const imageBase = await this.getImageBaseUrl(apiKey, 'poster');

    return body.results.slice(0, 8).map((result) => ({
      provider: 'tmdb',
      providerId: result.id,
      title: result.title,
      originalTitle: result.original_title ?? null,
      year: parseYear(result.release_date),
      releaseYear: parseYear(result.release_date),
      overview: result.overview ?? null,
      posterUrl: result.poster_path ? `${imageBase}${result.poster_path}` : null,
      backdropUrl: result.backdrop_path ? `${imageBase}${result.backdrop_path}` : null,
      rating: result.vote_average == null ? null : Number(result.vote_average.toFixed(1))
    }));
  }

  async applyMovieMetadata(request: ApplyMovieMetadataRequest): Promise<Movie> {
    if (request.provider !== 'tmdb') {
      throw new Error(`Unsupported metadata provider: ${request.provider}`);
    }

    const settings = this.settings.getSettings();
    const apiKey = settings.tmdbApiKey.trim();
    if (!apiKey) {
      throw new Error('Add a TMDB API key in Settings before applying movie metadata.');
    }

    const params = new URLSearchParams({
      api_key: apiKey,
      language: settings.tmdbLanguage || 'en-US',
      append_to_response: 'credits'
    });
    const response = await requestUrl(`https://api.themoviedb.org/3/movie/${request.providerId}?${params.toString()}`, 'TMDB movie details');
    if (!response.ok) {
      throw new Error(`TMDB movie details failed: ${response.status} ${response.statusText}`);
    }

    const details = (await response.json()) as TmdbMovieDetails;
    const posterBase = await this.getImageBaseUrl(apiKey, 'poster');
    const backdropBase = await this.getImageBaseUrl(apiKey, 'backdrop');
    const posterPath = details.poster_path
      ? await this.cacheImage(`${posterBase}${details.poster_path}`, this.paths.posters, `tmdb-${details.id}-poster`)
      : null;
    const backdropPath = details.backdrop_path
      ? await this.cacheImage(`${backdropBase}${details.backdrop_path}`, this.paths.backdrops, `tmdb-${details.id}-backdrop`)
      : null;
    const now = new Date().toISOString();

    let movieId = request.movieId;

    // If movieId is 0, create a new movie entry (or reuse existing one with same title/year)
    if (movieId === 0) {
      const parsedYearVal = parseYear(details.release_date);
      const existing = this.db
        .prepare('SELECT id FROM movies WHERE lower(title) = lower(?) AND COALESCE(release_year, 0) = COALESCE(?, 0)')
        .get(details.title, parsedYearVal) as { id: number } | undefined;

      if (existing) {
        movieId = existing.id;
        // Update existing movie instead of inserting a new one
        this.db
          .prepare(
            `UPDATE movies SET
              title = ?,
              original_title = ?,
              release_year = ?,
              overview = ?,
              poster_path = ?,
              backdrop_path = ?,
              runtime_minutes = ?,
              rating = ?,
              updated_at = ?
            WHERE id = ?`
          )
          .run(
            details.title,
            details.original_title ?? null,
            parsedYearVal,
            details.overview ?? null,
            posterPath,
            backdropPath,
            details.runtime ?? null,
            details.vote_average == null ? null : Number(details.vote_average.toFixed(1)),
            now,
            movieId
          );
      } else {
        const result = this.db
          .prepare(
            `INSERT INTO movies (title, original_title, release_year, overview, poster_path, backdrop_path, runtime_minutes, rating, favorite, added_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
          )
          .run(
            details.title,
            details.original_title ?? null,
            parsedYearVal,
            details.overview ?? null,
            posterPath,
            backdropPath,
            details.runtime ?? null,
            details.vote_average == null ? null : Number(details.vote_average.toFixed(1)),
            now,
            now
          );
        movieId = Number(result.lastInsertRowid);
      }
    } else {
      // Update existing movie
      this.db
        .prepare(
          `UPDATE movies SET
            title = ?,
            original_title = ?,
            release_year = ?,
            overview = ?,
            poster_path = ?,
            backdrop_path = ?,
            runtime_minutes = ?,
            rating = ?,
            updated_at = ?
          WHERE id = ?`
        )
        .run(
          details.title,
          details.original_title ?? null,
          parseYear(details.release_date),
          details.overview ?? null,
          posterPath,
          backdropPath,
          details.runtime ?? null,
          details.vote_average == null ? null : Number(details.vote_average.toFixed(1)),
          now,
          movieId
        );
    }

    this.replaceMovieGenres(movieId, details.genres ?? []);
    this.replaceMovieCredits(movieId, details.credits);

    const row = this.db.prepare('SELECT * FROM movies WHERE id = ?').get(movieId) as Record<string, unknown> | undefined;
    if (!row) {
      throw new Error(`Movie ${movieId} was not found after applying metadata.`);
    }

    return mapMovie(row);
  }

  async searchTvMetadata(request: TvMetadataSearchRequest): Promise<TvMetadataSearchResult[]> {
    const search = normalizeMetadataSearch(request.query, request.year);
    if (!search.query) {
      return [];
    }

    const settings = this.settings.getSettings();
    const apiKey = settings.tmdbApiKey.trim();
    if (!apiKey) {
      throw new Error('Add a TMDB API key in Settings before searching TV metadata.');
    }

    const body = await searchTmdbTv(apiKey, settings.tmdbLanguage || 'en-US', search.query, search.year);
    const imageBase = await this.getImageBaseUrl(apiKey, 'poster');

    return body.results.slice(0, 8).map((result) => ({
      provider: 'tmdb',
      providerId: result.id,
      title: result.name,
      originalTitle: result.original_name ?? null,
      year: parseYear(result.first_air_date),
      firstAirYear: parseYear(result.first_air_date),
      overview: result.overview ?? null,
      posterUrl: result.poster_path ? `${imageBase}${result.poster_path}` : null,
      backdropUrl: result.backdrop_path ? `${imageBase}${result.backdrop_path}` : null,
      rating: result.vote_average == null ? null : Number(result.vote_average.toFixed(1))
    }));
  }

  async applyTvMetadata(request: ApplyTvMetadataRequest): Promise<TvShow> {
    if (request.provider !== 'tmdb') {
      throw new Error(`Unsupported metadata provider: ${request.provider}`);
    }

    const settings = this.settings.getSettings();
    const apiKey = settings.tmdbApiKey.trim();
    if (!apiKey) {
      throw new Error('Add a TMDB API key in Settings before applying TV metadata.');
    }

    const params = new URLSearchParams({
      api_key: apiKey,
      language: settings.tmdbLanguage || 'en-US',
      append_to_response: 'credits'
    });
    const response = await requestUrl(`https://api.themoviedb.org/3/tv/${request.providerId}?${params.toString()}`, 'TMDB TV details');
    if (!response.ok) {
      throw new Error(`TMDB TV details failed: ${response.status} ${response.statusText}`);
    }

    const details = (await response.json()) as TmdbTvDetails;
    const posterBase = await this.getImageBaseUrl(apiKey, 'poster');
    const backdropBase = await this.getImageBaseUrl(apiKey, 'backdrop');
    const posterPath = details.poster_path
      ? await this.cacheImage(`${posterBase}${details.poster_path}`, this.paths.posters, `tmdb-tv-${details.id}-poster`)
      : null;
    const backdropPath = details.backdrop_path
      ? await this.cacheImage(`${backdropBase}${details.backdrop_path}`, this.paths.backdrops, `tmdb-tv-${details.id}-backdrop`)
      : null;
    const now = new Date().toISOString();

    let showId = request.showId;

    // If showId is 0, create a new TV show entry (or reuse existing one with same title/year)
    if (showId === 0) {
      const parsedYearVal = parseYear(details.first_air_date);
      const existing = this.db
        .prepare('SELECT id FROM tv_shows WHERE lower(title) = lower(?) AND COALESCE(first_air_year, 0) = COALESCE(?, 0)')
        .get(details.name, parsedYearVal) as { id: number } | undefined;

      if (existing) {
        showId = existing.id;
        // Update existing TV show
        this.db
          .prepare(
            `UPDATE tv_shows SET
              title = ?,
              original_title = ?,
              first_air_year = ?,
              overview = ?,
              poster_path = ?,
              backdrop_path = ?,
              rating = ?,
              updated_at = ?
            WHERE id = ?`
          )
          .run(
            details.name,
            details.original_name ?? null,
            parsedYearVal,
            details.overview ?? null,
            posterPath,
            backdropPath,
            details.vote_average == null ? null : Number(details.vote_average.toFixed(1)),
            now,
            showId
          );
      } else {
        const result = this.db
          .prepare(
            `INSERT INTO tv_shows (title, original_title, first_air_year, overview, poster_path, backdrop_path, rating, favorite, added_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
          )
          .run(
            details.name,
            details.original_name ?? null,
            parsedYearVal,
            details.overview ?? null,
            posterPath,
            backdropPath,
            details.vote_average == null ? null : Number(details.vote_average.toFixed(1)),
            now,
            now
          );
        showId = Number(result.lastInsertRowid);
      }
    } else {
      // Update existing TV show
      this.db
        .prepare(
          `UPDATE tv_shows SET
            title = ?,
            original_title = ?,
            first_air_year = ?,
            overview = ?,
            poster_path = ?,
            backdrop_path = ?,
            rating = ?,
            updated_at = ?
          WHERE id = ?`
        )
        .run(
          details.name,
          details.original_name ?? null,
          parseYear(details.first_air_date),
          details.overview ?? null,
          posterPath,
          backdropPath,
          details.vote_average == null ? null : Number(details.vote_average.toFixed(1)),
          now,
          showId
        );
    }

    this.replaceShowGenres(showId, details.genres ?? []);
    this.replaceShowCredits(showId, details.credits);

    const row = this.db.prepare('SELECT * FROM tv_shows WHERE id = ?').get(showId) as Record<string, unknown> | undefined;
    if (!row) {
      throw new Error(`TV show ${showId} was not found after applying metadata.`);
    }

    return mapShow(row);
  }

  private async getImageBaseUrl(apiKey: string, kind: 'poster' | 'backdrop' | 'profile'): Promise<string> {
    const fallbackSize = kind === 'backdrop' ? 'w780' : kind === 'profile' ? 'w185' : 'w342';
    try {
      const response = await requestUrl(
        `https://api.themoviedb.org/3/configuration?api_key=${encodeURIComponent(apiKey)}`,
        'TMDB image configuration'
      );
      if (!response.ok) {
        return `https://image.tmdb.org/t/p/${fallbackSize}`;
      }

      const config = (await response.json()) as TmdbConfiguration;
      const images = config.images;
      const base = images?.secure_base_url ?? 'https://image.tmdb.org/t/p/';
      const sizes = kind === 'backdrop' ? images?.backdrop_sizes : kind === 'profile' ? images?.profile_sizes : images?.poster_sizes;
      const size = chooseImageSize(sizes, fallbackSize);
      return `${base}${size}`;
    } catch {
      return `https://image.tmdb.org/t/p/${fallbackSize}`;
    }
  }

  private async cacheImage(url: string, folder: string, name: string): Promise<string> {
    await mkdir(folder, { recursive: true });
    const response = await requestUrl(url, 'TMDB image download');
    if (!response.ok) {
      throw new Error(`Could not download image from TMDB: ${response.status} ${response.statusText}`);
    }

    const extension = basename(new URL(url).pathname).split('.').pop() || 'jpg';
    const destination = join(folder, `${sanitizeFileName(name)}.${extension}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(destination, bytes);
    // Return a sky-image:// URL so the sandboxed renderer can load it
    // without file:// access. Format: sky-image://local/<encoded-absolute-path>
    return `sky-image://local/${encodeURIComponent(destination)}`;
  }

  private replaceMovieGenres(movieId: number, genres: Array<{ id: number; name: string }>): void {
    this.db.prepare('DELETE FROM movie_genres WHERE movie_id = ?').run(movieId);
    for (const genre of genres) {
      this.db.prepare('INSERT OR IGNORE INTO genres (name) VALUES (?)').run(genre.name);
      const row = this.db.prepare('SELECT id FROM genres WHERE name = ?').get(genre.name) as { id: number };
      this.db.prepare('INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?, ?)').run(movieId, row.id);
    }
  }

  private replaceMovieCredits(movieId: number, credits?: TmdbMovieDetails['credits']): void {
    this.db.prepare("DELETE FROM credits WHERE media_kind = 'movie' AND movie_id = ?").run(movieId);

    for (const castMember of credits?.cast?.slice(0, 12) ?? []) {
      const personId = this.upsertPerson(castMember.name, 'cast', castMember.profile_path ?? null);
      this.db
        .prepare(
          `INSERT INTO credits (person_id, media_kind, movie_id, show_id, episode_id, job, character_name, sort_order)
           VALUES (?, 'movie', ?, NULL, NULL, 'Actor', ?, ?)`
        )
        .run(personId, movieId, castMember.character ?? null, castMember.order ?? 0);
    }

    const usefulCrew = (credits?.crew ?? []).filter((member) => ['Director', 'Writer', 'Screenplay'].includes(member.job ?? '')).slice(0, 8);
    for (const crewMember of usefulCrew) {
      const personId = this.upsertPerson(crewMember.name, 'crew', crewMember.profile_path ?? null);
      this.db
        .prepare(
          `INSERT INTO credits (person_id, media_kind, movie_id, show_id, episode_id, job, character_name, sort_order)
           VALUES (?, 'movie', ?, NULL, NULL, ?, NULL, 0)`
        )
        .run(personId, movieId, crewMember.job ?? 'Crew');
    }
  }

  private replaceShowGenres(showId: number, genres: Array<{ id: number; name: string }>): void {
    this.db.prepare('DELETE FROM show_genres WHERE show_id = ?').run(showId);
    for (const genre of genres) {
      this.db.prepare('INSERT OR IGNORE INTO genres (name) VALUES (?)').run(genre.name);
      const row = this.db.prepare('SELECT id FROM genres WHERE name = ?').get(genre.name) as { id: number };
      this.db.prepare('INSERT OR IGNORE INTO show_genres (show_id, genre_id) VALUES (?, ?)').run(showId, row.id);
    }
  }

  private replaceShowCredits(showId: number, credits?: TmdbTvDetails['credits']): void {
    this.db.prepare("DELETE FROM credits WHERE media_kind = 'show' AND show_id = ?").run(showId);

    for (const castMember of credits?.cast?.slice(0, 12) ?? []) {
      const personId = this.upsertPerson(castMember.name, 'cast', castMember.profile_path ?? null);
      this.db
        .prepare(
          `INSERT INTO credits (person_id, media_kind, movie_id, show_id, episode_id, job, character_name, sort_order)
           VALUES (?, 'show', NULL, ?, NULL, 'Actor', ?, ?)`
        )
        .run(personId, showId, castMember.character ?? null, castMember.order ?? 0);
    }

    const usefulCrew = (credits?.crew ?? []).filter((member) => ['Creator', 'Director', 'Writer', 'Screenplay'].includes(member.job ?? '')).slice(0, 8);
    for (const crewMember of usefulCrew) {
      const personId = this.upsertPerson(crewMember.name, 'crew', crewMember.profile_path ?? null);
      this.db
        .prepare(
          `INSERT INTO credits (person_id, media_kind, movie_id, show_id, episode_id, job, character_name, sort_order)
           VALUES (?, 'show', NULL, ?, NULL, ?, NULL, 0)`
        )
        .run(personId, showId, crewMember.job ?? 'Crew');
    }
  }

  private upsertPerson(name: string, role: string, imagePath: string | null): number {
    const existing = this.db.prepare('SELECT id FROM people WHERE name = ? AND role = ?').get(name, role) as
      | { id: number }
      | undefined;
    if (existing) {
      return existing.id;
    }

    const result = this.db.prepare('INSERT INTO people (name, role, image_path) VALUES (?, ?, ?)').run(name, role, imagePath);
    return Number(result.lastInsertRowid);
  }
}

function parseYear(date?: string): number | null {
  if (!date) {
    return null;
  }

  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

function chooseImageSize(sizes: string[] | undefined, fallback: string): string {
  if (!sizes?.length) {
    return fallback;
  }

  return sizes.includes(fallback) ? fallback : sizes[Math.max(0, sizes.length - 2)] ?? fallback;
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '');
}

async function searchTmdbMovie(apiKey: string, language: string, query: string, year: number | null): Promise<TmdbSearchResponse> {
  const withYear = await fetchTmdbMovieSearch(apiKey, language, query, year);
  if (withYear.results.length || !year) {
    return withYear;
  }

  return fetchTmdbMovieSearch(apiKey, language, query, null);
}

async function fetchTmdbMovieSearch(
  apiKey: string,
  language: string,
  query: string,
  year: number | null
): Promise<TmdbSearchResponse> {
  const params = new URLSearchParams({
    api_key: apiKey,
    query,
    language,
    include_adult: 'false',
    page: '1'
  });
  if (year) {
    params.set('year', String(year));
  }

  const response = await requestUrl(`https://api.themoviedb.org/3/search/movie?${params.toString()}`, 'TMDB movie search');
  if (!response.ok) {
    throw new Error(`TMDB movie search failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as TmdbSearchResponse;
}

async function searchTmdbTv(apiKey: string, language: string, query: string, year: number | null): Promise<TmdbTvSearchResponse> {
  const withYear = await fetchTmdbTvSearch(apiKey, language, query, year);
  if (withYear.results.length || !year) {
    return withYear;
  }

  return fetchTmdbTvSearch(apiKey, language, query, null);
}

async function fetchTmdbTvSearch(apiKey: string, language: string, query: string, year: number | null): Promise<TmdbTvSearchResponse> {
  const params = new URLSearchParams({
    api_key: apiKey,
    query,
    language,
    include_adult: 'false',
    page: '1'
  });
  if (year) {
    params.set('first_air_date_year', String(year));
  }

  const response = await requestUrl(`https://api.themoviedb.org/3/search/tv?${params.toString()}`, 'TMDB TV search');
  if (!response.ok) {
    throw new Error(`TMDB TV search failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as TmdbTvSearchResponse;
}

function normalizeMetadataSearch(rawQuery: string, requestedYear?: number | null): { query: string; year: number | null } {
  const trimmed = rawQuery.trim();
  const queryYear = parseYear(trimmed);
  const year = requestedYear ?? queryYear;
  const query = trimmed
    .replace(/\b(?:19|20)\d{2}\b/g, ' ')
    .replace(/\[[^\]]*]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(2160p|1080p|720p|4k|uhd|hdr|bluray|brrip|webrip|web-dl|dvdrip|x264|x265|h264|h265|hevc|aac|dts)\b/gi, ' ')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { query, year };
}

async function requestUrl(url: string, label: string): Promise<Response> {
  try {
    return await net.fetch(url);
  } catch (error) {
    throw new Error(`${label} could not connect: ${formatNetworkError(error)}`);
  }
}

function formatNetworkError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error);
}
