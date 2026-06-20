import { statSync } from 'node:fs';
import { readdir, realpath } from 'node:fs/promises';
import { basename, dirname, extname, join, relative } from 'node:path';
import type { LibraryScanMode, LibrarySummary, MatcherStrategy, MediaKind, ScanResult } from '../../shared/ipc';
import type { SqliteDatabase } from '../database/client';
import { mapLibraryFolder } from './rowMappers';
import { pruneOrphans } from '../database/cleanup';

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

interface ExistingMediaFileMatch {
  media_kind: MediaKind;
  matched_movie_id: number | null;
  matched_show_id: number | null;
  matched_episode_id: number | null;
  match_confidence: number;
  match_status: string;
}

export class LibraryScanner {
  constructor(private readonly db: SqliteDatabase) {}

  async scanLibrary(rootPath: string, options: ScanOptions): Promise<ScanResult> {
    const normalizedRootPath = await normalizePath(rootPath);
    const folder = this.upsertLibraryFolder(normalizedRootPath, options.mediaKind);
    const files = await this.findVideoFiles(normalizedRootPath);

    let importedFiles = 0;
    let movieMatches = 0;
    let showMatches = 0;
    let unmatchedFiles = 0;
    const movieIds = new Set<number>();
    const showIds = new Set<number>();

    const transaction = this.db.transaction((videoFiles: string[]) => {
      // Delete files in database that are no longer on disk
      const existingFiles = this.db
        .prepare('SELECT id, absolute_path FROM media_files WHERE library_folder_id = ?')
        .all(folder.id) as { id: number; absolute_path: string }[];

      const scannedPathsSet = new Set(videoFiles);
      const missingFileIds = existingFiles
        .filter((f) => !scannedPathsSet.has(f.absolute_path))
        .map((f) => f.id);

      if (missingFileIds.length > 0) {
        const stmt = this.db.prepare('DELETE FROM media_files WHERE id = ?');
        for (const id of missingFileIds) {
          stmt.run(id);
        }
      }

      for (const absolutePath of videoFiles) {
        const existingFile = this.getExistingMediaFileMatch(absolutePath);
        const parsed = existingFile ? null : parseMediaName(absolutePath, normalizedRootPath, options);
        const fileStats = statSync(absolutePath);
        const relativePath = relative(normalizedRootPath, absolutePath);
        const extension = extname(absolutePath).toLowerCase();
        const fileMetadata = options.extractFileMetadata
          ? extractFileMetadataHints(absolutePath)
          : emptyFileMetadata();

        let matchedMovieId: number | null = null;
        let matchedShowId: number | null = null;
        let matchedEpisodeId: number | null = null;
        let mediaKind: MediaKind;
        let matchConfidence: number;
        let matchStatus: string;

        if (existingFile) {
          mediaKind = existingFile.media_kind;
          matchedMovieId = existingFile.matched_movie_id;
          matchedShowId = existingFile.matched_show_id;
          matchedEpisodeId = existingFile.matched_episode_id;
          matchConfidence = existingFile.match_confidence;
          matchStatus = existingFile.match_status;

          if (matchedMovieId) {
            movieMatches += 1;
          } else if (matchedShowId) {
            showMatches += 1;
          } else {
            unmatchedFiles += 1;
          }
        } else if (parsed?.mediaKind === 'movie') {
          mediaKind = parsed.mediaKind;
          matchConfidence = parsed.confidence;
          matchStatus = parsed.confidence >= 0.5 ? 'auto_matched' : 'unmatched';
          const match = this.upsertMovie(parsed.title, parsed.year);
          matchedMovieId = match.id;
          if (match.created) {
            movieIds.add(matchedMovieId);
          }
          movieMatches += 1;
        } else {
          if (!parsed) {
            throw new Error(`Could not parse media file ${absolutePath}.`);
          }
          mediaKind = parsed.mediaKind;
          matchConfidence = parsed.confidence;
          matchStatus = parsed.confidence >= 0.5 ? 'auto_matched' : 'unmatched';
          const match = this.upsertShowEpisode(parsed.title, parsed.seasonNumber ?? 1, parsed.episodeNumber ?? 1);
          matchedShowId = match.showId;
          matchedEpisodeId = match.episodeId;
          showIds.add(matchedShowId);
          showMatches += 1;
        }

        if (!existingFile && parsed && parsed.confidence < 0.5) {
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
            mediaKind,
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
            matchConfidence,
            matchStatus
          );

        if (result.changes > 0) {
          importedFiles += 1;
        }
      }
      pruneOrphans(this.db);
    });

    transaction(files);

    return {
      folder,
      scannedFiles: files.length,
      importedFiles,
      movieMatches,
      showMatches,
      unmatchedFiles,
      movieIds: [...movieIds],
      showIds: [...showIds]
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

  private getExistingMediaFileMatch(absolutePath: string): ExistingMediaFileMatch | null {
    const existing = this.db
      .prepare(
        `SELECT media_kind, matched_movie_id, matched_show_id, matched_episode_id, match_confidence, match_status
         FROM media_files
         WHERE absolute_path = ?`
      )
      .get(absolutePath) as ExistingMediaFileMatch | undefined;

    return existing ?? null;
  }

  private upsertMovie(title: string, year: number | null): { id: number; created: boolean } {
    const now = new Date().toISOString();
    const existing = this.db
      .prepare('SELECT id FROM movies WHERE lower(title) = lower(?) AND COALESCE(release_year, 0) = COALESCE(?, 0)')
      .get(title, year) as { id: number } | undefined;

    if (existing) {
      return { id: existing.id, created: false };
    }

    const result = this.db
      .prepare(
        `INSERT INTO movies (title, original_title, release_year, overview, poster_path, backdrop_path, runtime_minutes, rating, favorite, added_at, updated_at)
         VALUES (?, NULL, ?, NULL, NULL, NULL, NULL, NULL, 0, ?, ?)`
      )
      .run(title, year, now, now);

    return { id: Number(result.lastInsertRowid), created: true };
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

function cleanPrefixNumber(title: string): string {
  // 1. Leading number in brackets, e.g., "[01] Title", "[1] - Title"
  const bracketMatch = title.match(/^\[\d+\]\s*[\-\._\s]*\s*(.+)$/i);
  if (bracketMatch) {
    return bracketMatch[1];
  }

  // 2. Leading number followed by punctuation separator, e.g., "01 - Title", "1. Title", "01_Title"
  const sepMatch = title.match(/^\d+\s*[\-\._:]\s*(.+)$/);
  if (sepMatch) {
    return sepMatch[1];
  }

  // 3. Leading number starting with 0 followed by space, e.g., "01 Title"
  const zeroSpaceMatch = title.match(/^(0\d+)\s+(.+)$/);
  if (zeroSpaceMatch) {
    return zeroSpaceMatch[2];
  }

  return title;
}

function parseMediaName(absolutePath: string, rootPath: string, options: ScanOptions): ParsedMediaName {
  const fileName = basename(absolutePath);
  const withoutExtension = fileName.replace(/\.[^.]+$/, '');
  const rawFolderTitle = basename(dirname(absolutePath)) || basename(rootPath);
  const folderTitle = cleanTitle(cleanPrefixNumber(rawFolderTitle));

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
      title: cleanTitle(cleanPrefixNumber(showMatch[1])),
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
      title: cleanTitle(cleanPrefixNumber(movieMatch[1])),
      year: Number(movieMatch[2]),
      seasonNumber: null,
      episodeNumber: null,
      confidence: 0.8
    };
  }

  if (options.mediaKind === 'show' || options.matcherStrategy === 'show-season-episode') {
    return {
      mediaKind: 'show',
      title: folderTitle || cleanTitle(cleanPrefixNumber(withoutExtension)),
      year: null,
      seasonNumber: 1,
      episodeNumber: 1,
      confidence: 0.42
    };
  }

  return {
    mediaKind: 'movie',
    title: cleanTitle(cleanPrefixNumber(withoutExtension)),
    year: null,
    seasonNumber: null,
    episodeNumber: null,
    confidence: 0.45
  };
}

async function normalizePath(path: string): Promise<string> {
  try {
    return await realpath(path);
  } catch {
    return path;
  }
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
