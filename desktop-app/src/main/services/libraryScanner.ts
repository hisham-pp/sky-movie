import { statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { basename, dirname, extname, join, relative } from 'node:path';
import type { LibraryScanMode, LibrarySummary, MatcherStrategy, MediaKind, ScanResult } from '../../shared/ipc';
import type { SqliteDatabase } from '../database/client';
import { mapLibraryFolder } from './rowMappers';

const videoExtensions = new Set([
  '.avi',
  '.m2ts',
  '.m4v',
  '.mkv',
  '.mov',
  '.mp4',
  '.mpeg',
  '.mpg',
  '.ts',
  '.webm',
  '.wmv'
]);

interface ParsedMediaName {
  mediaKind: MediaKind;
  title: string;
  year: number | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  confidence: number;
}

interface ScanOptions {
  mediaKind: LibraryScanMode;
  matcherStrategy: MatcherStrategy;
  extractFileMetadata: boolean;
}

interface ExtractedFileMetadata {
  durationSeconds: number | null;
  resolution: string | null;
  videoCodec: string | null;
  audioTracks: string | null;
  subtitleTracks: string | null;
}

export class LibraryScanner {
  constructor(private readonly db: SqliteDatabase) {}

  async scanLibrary(rootPath: string, options: ScanOptions): Promise<ScanResult> {
    const folder = this.upsertLibraryFolder(rootPath, options.mediaKind);
    const files = await this.findVideoFiles(rootPath);

    let importedFiles = 0;
    let movieMatches = 0;
    let showMatches = 0;
    let unmatchedFiles = 0;

    const transaction = this.db.transaction((videoFiles: string[]) => {
      for (const absolutePath of videoFiles) {
        const parsed = parseMediaName(absolutePath, rootPath, options);
        const fileStats = statSync(absolutePath);
        const relativePath = relative(rootPath, absolutePath);
        const extension = extname(absolutePath).toLowerCase();
        const fileMetadata = options.extractFileMetadata
          ? extractFileMetadataHints(absolutePath)
          : emptyFileMetadata();

        let matchedMovieId: number | null = null;
        let matchedShowId: number | null = null;
        let matchedEpisodeId: number | null = null;

        if (parsed.mediaKind === 'movie') {
          matchedMovieId = this.upsertMovie(parsed.title, parsed.year);
          movieMatches += 1;
        } else {
          const match = this.upsertShowEpisode(parsed.title, parsed.seasonNumber ?? 1, parsed.episodeNumber ?? 1);
          matchedShowId = match.showId;
          matchedEpisodeId = match.episodeId;
          showMatches += 1;
        }

        if (parsed.confidence < 0.5) {
          unmatchedFiles += 1;
        }

        const result = this.db
          .prepare(
            `INSERT INTO media_files (
              library_folder_id, media_kind, absolute_path, relative_path, file_name, extension,
              file_size, modified_time, created_time, duration_seconds, resolution, video_codec,
              audio_tracks, subtitle_tracks, matched_movie_id, matched_show_id, matched_episode_id,
              match_confidence, match_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(absolute_path) DO UPDATE SET
              library_folder_id = excluded.library_folder_id,
              media_kind = excluded.media_kind,
              relative_path = excluded.relative_path,
              file_name = excluded.file_name,
              extension = excluded.extension,
              file_size = excluded.file_size,
              modified_time = excluded.modified_time,
              created_time = excluded.created_time,
              duration_seconds = excluded.duration_seconds,
              resolution = excluded.resolution,
              video_codec = excluded.video_codec,
              audio_tracks = excluded.audio_tracks,
              subtitle_tracks = excluded.subtitle_tracks,
              matched_movie_id = excluded.matched_movie_id,
              matched_show_id = excluded.matched_show_id,
              matched_episode_id = excluded.matched_episode_id,
              match_confidence = excluded.match_confidence,
              match_status = excluded.match_status`
          )
          .run(
            folder.id,
            parsed.mediaKind,
            absolutePath,
            relativePath,
            basename(absolutePath),
            extension,
            fileStats.size,
            fileStats.mtime.toISOString(),
            fileStats.ctime.toISOString(),
            fileMetadata.durationSeconds,
            fileMetadata.resolution,
            fileMetadata.videoCodec,
            fileMetadata.audioTracks,
            fileMetadata.subtitleTracks,
            matchedMovieId,
            matchedShowId,
            matchedEpisodeId,
            parsed.confidence,
            parsed.confidence >= 0.5 ? 'auto_matched' : 'unmatched'
          );

        if (result.changes > 0) {
          importedFiles += 1;
        }
      }
    });

    transaction(files);

    return {
      folder,
      scannedFiles: files.length,
      importedFiles,
      movieMatches,
      showMatches,
      unmatchedFiles
    };
  }

  getSummary(): LibrarySummary {
    const count = (table: string): number => {
      const row = this.db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number };
      return Number(row.count);
    };

    return {
      movieCount: count('movies'),
      showCount: count('tv_shows'),
      episodeCount: count('episodes'),
      mediaFileCount: count('media_files'),
      libraryFolderCount: count('library_folders')
    };
  }

  private async findVideoFiles(rootPath: string): Promise<string[]> {
    let entries;
    try {
      entries = await readdir(rootPath, { withFileTypes: true });
    } catch {
      return [];
    }

    const found: string[] = [];

    for (const entry of entries) {
      const entryPath = join(rootPath, entry.name);
      if (entry.isDirectory()) {
        found.push(...(await this.findVideoFiles(entryPath)));
      } else if (entry.isFile() && videoExtensions.has(extname(entry.name).toLowerCase())) {
        found.push(entryPath);
      }
    }

    return found;
  }

  private upsertLibraryFolder(rootPath: string, mediaKind: LibraryScanMode) {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO library_folders (path, name, media_kind, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(path) DO UPDATE SET media_kind = excluded.media_kind, updated_at = excluded.updated_at`
      )
      .run(rootPath, basename(rootPath), mediaKind, now, now);

    return mapLibraryFolder(this.db.prepare('SELECT * FROM library_folders WHERE path = ?').get(rootPath) as Record<string, unknown>);
  }

  private upsertMovie(title: string, year: number | null): number {
    const now = new Date().toISOString();
    const existing = this.db
      .prepare('SELECT id FROM movies WHERE title = ? AND COALESCE(release_year, 0) = COALESCE(?, 0)')
      .get(title, year) as { id: number } | undefined;

    if (existing) {
      return existing.id;
    }

    const result = this.db
      .prepare(
        `INSERT INTO movies (title, original_title, release_year, overview, poster_path, backdrop_path, runtime_minutes, rating, favorite, added_at, updated_at)
         VALUES (?, NULL, ?, NULL, NULL, NULL, NULL, NULL, 0, ?, ?)`
      )
      .run(title, year, now, now);

    return Number(result.lastInsertRowid);
  }

  private upsertShowEpisode(title: string, seasonNumber: number, episodeNumber: number) {
    const now = new Date().toISOString();
    let show = this.db
      .prepare('SELECT id FROM tv_shows WHERE title = ?')
      .get(title) as { id: number } | undefined;

    if (!show) {
      const result = this.db
        .prepare(
          `INSERT INTO tv_shows (title, original_title, first_air_year, overview, poster_path, backdrop_path, rating, favorite, added_at, updated_at)
           VALUES (?, NULL, NULL, NULL, NULL, NULL, NULL, 0, ?, ?)`
        )
        .run(title, now, now);
      show = { id: Number(result.lastInsertRowid) };
    }

    let season = this.db
      .prepare('SELECT id FROM seasons WHERE show_id = ? AND season_number = ?')
      .get(show.id, seasonNumber) as { id: number } | undefined;

    if (!season) {
      const result = this.db
        .prepare('INSERT INTO seasons (show_id, season_number, title, overview, poster_path) VALUES (?, ?, ?, NULL, NULL)')
        .run(show.id, seasonNumber, `Season ${seasonNumber}`);
      season = { id: Number(result.lastInsertRowid) };
    }

    let episode = this.db
      .prepare('SELECT id FROM episodes WHERE show_id = ? AND season_number = ? AND episode_number = ?')
      .get(show.id, seasonNumber, episodeNumber) as { id: number } | undefined;

    if (!episode) {
      const result = this.db
        .prepare(
          `INSERT INTO episodes (show_id, season_id, season_number, episode_number, title, overview, runtime_minutes, air_date, still_path)
           VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, NULL)`
        )
        .run(show.id, season.id, seasonNumber, episodeNumber, `Episode ${episodeNumber}`);
      episode = { id: Number(result.lastInsertRowid) };
    }

    return { showId: show.id, episodeId: episode.id };
  }
}

function parseMediaName(absolutePath: string, rootPath: string, options: ScanOptions): ParsedMediaName {
  const fileName = basename(absolutePath);
  const withoutExtension = fileName.replace(/\.[^.]+$/, '');
  const folderTitle = cleanTitle(basename(dirname(absolutePath)) || basename(rootPath));

  if (options.matcherStrategy === 'folder-name') {
    return {
      mediaKind: options.mediaKind === 'show' ? 'show' : 'movie',
      title: folderTitle,
      year: parseYear(folderTitle),
      seasonNumber: options.mediaKind === 'show' ? 1 : null,
      episodeNumber: options.mediaKind === 'show' ? 1 : null,
      confidence: 0.72
    };
  }

  const showMatch = withoutExtension.match(/(.+?)[ ._\-]+s(\d{1,2})e(\d{1,2})/i);

  if (showMatch && options.mediaKind !== 'movie' && options.matcherStrategy !== 'movie-title-year') {
    return {
      mediaKind: 'show',
      title: cleanTitle(showMatch[1]),
      year: null,
      seasonNumber: Number(showMatch[2]),
      episodeNumber: Number(showMatch[3]),
      confidence: 0.86
    };
  }

  const movieMatch = withoutExtension.match(/(.+?)[ ._\-]+((?:19|20)\d{2})/);
  if (movieMatch && options.mediaKind !== 'show' && options.matcherStrategy !== 'show-season-episode') {
    return {
      mediaKind: 'movie',
      title: cleanTitle(movieMatch[1]),
      year: Number(movieMatch[2]),
      seasonNumber: null,
      episodeNumber: null,
      confidence: 0.8
    };
  }

  if (options.mediaKind === 'show' || options.matcherStrategy === 'show-season-episode') {
    return {
      mediaKind: 'show',
      title: folderTitle || cleanTitle(withoutExtension),
      year: null,
      seasonNumber: 1,
      episodeNumber: 1,
      confidence: 0.42
    };
  }

  return {
    mediaKind: 'movie',
    title: cleanTitle(withoutExtension),
    year: null,
    seasonNumber: null,
    episodeNumber: null,
    confidence: 0.45
  };
}

function extractFileMetadataHints(path: string): ExtractedFileMetadata {
  const lower = path.toLowerCase();

  return {
    durationSeconds: null,
    resolution: lower.includes('2160p') || lower.includes('4k') ? '4K' : lower.includes('1080p') ? '1080p' : lower.includes('720p') ? '720p' : null,
    videoCodec: lower.includes('x265') || lower.includes('h265') || lower.includes('hevc') ? 'HEVC' : lower.includes('x264') || lower.includes('h264') ? 'H.264' : null,
    audioTracks: lower.includes('dual audio') ? 'dual audio' : null,
    subtitleTracks: lower.includes('sub') ? 'subtitle hint' : null
  };
}

function emptyFileMetadata(): ExtractedFileMetadata {
  return {
    durationSeconds: null,
    resolution: null,
    videoCodec: null,
    audioTracks: null,
    subtitleTracks: null
  };
}

function parseYear(value: string): number | null {
  const match = value.match(/\b((?:19|20)\d{2})\b/);
  return match ? Number(match[1]) : null;
}

function cleanTitle(value: string): string {
  return value
    .replace(/[._\-]+/g, ' ')
    .replace(/\b(1080p|2160p|720p|4k|bluray|webrip|web-dl|x264|x265|h264|h265)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}
