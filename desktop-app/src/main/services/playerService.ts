import { protocol, shell } from 'electron';
import { createReadStream, readdirSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname, extname, basename, join } from 'node:path';
import { Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import type { LastWatchedInfo, WatchHistoryItem, PlayMediaResult, WatchProgressSnapshot, WatchProgressUpdate, SidecarSubtitle } from '../../shared/ipc';
import type { SqliteDatabase } from '../database/client';
import { CatalogService } from './catalogService';

interface ByteRange {
  start: number;
  end: number;
}

const SUBTITLE_EXTS = new Set(['.srt', '.vtt', '.ass', '.ssa']);

function scanSidecarSubtitles(mediaPath: string): SidecarSubtitle[] {
  try {
    const dir = dirname(mediaPath);
    const stem = basename(mediaPath, extname(mediaPath)).toLowerCase();
    const files = readdirSync(dir);
    const results: SidecarSubtitle[] = [];

    for (const file of files) {
      const ext = extname(file).toLowerCase() as '.srt' | '.vtt' | '.ass' | '.ssa';
      if (!SUBTITLE_EXTS.has(ext)) continue;
      const fileStem = basename(file, ext).toLowerCase();
      // Match files that start with the same stem (e.g. movie.en.srt, movie.srt)
      if (!fileStem.startsWith(stem)) continue;
      const suffix = fileStem.slice(stem.length).replace(/^[._-]/, '') || 'Default';
      const label = suffix.charAt(0).toUpperCase() + suffix.slice(1);
      const url = pathToFileURL(join(dir, file)).toString();
      results.push({ label, url, type: ext === '.ssa' ? 'ass' : ext.slice(1) as 'srt' | 'vtt' | 'ass' });
    }

    return results;
  } catch {
    return [];
  }
}

export class PlayerService {
  private readonly catalog: CatalogService;

  constructor(private readonly db: SqliteDatabase) {
    this.catalog = new CatalogService(db);
  }

  registerMediaProtocol(): void {
    protocol.handle('sky-media', async (request) => {
      try {
        const id = Number(new URL(request.url).hostname);
        const mediaFile = this.catalog.getMediaFile(id);

        if (!mediaFile) {
          console.error(`Media file not found for id: ${id}`);
          return new Response('Media file not found.', { status: 404 });
        }

        console.log(`Serving media file: ${mediaFile.absolutePath}`);
        const fileStat = await stat(mediaFile.absolutePath);
        const range = parseByteRange(request.headers.get('range'), fileStat.size);
        const contentType = getVideoContentType(mediaFile.absolutePath);

        if (request.headers.get('range') && !range) {
          return new Response(null, {
            status: 416,
            headers: {
              'Accept-Ranges': 'bytes',
              'Content-Range': `bytes */${fileStat.size}`
            }
          });
        }

        if (range) {
          const contentLength = range.end - range.start + 1;
          const body = Readable.toWeb(createReadStream(mediaFile.absolutePath, range)) as ReadableStream;

          return new Response(body, {
            status: 206,
            headers: {
              'Accept-Ranges': 'bytes',
              'Cache-Control': 'no-store',
              'Content-Length': String(contentLength),
              'Content-Range': `bytes ${range.start}-${range.end}/${fileStat.size}`,
              'Content-Type': contentType
            }
          });
        }

        const body = Readable.toWeb(createReadStream(mediaFile.absolutePath)) as ReadableStream;

        return new Response(body, {
          status: 200,
          headers: {
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-store',
            'Content-Length': String(fileStat.size),
            'Content-Type': contentType
          }
        });
      } catch (error) {
        console.error('Error in sky-media protocol handler:', error);
        return new Response('Internal server error', { status: 500 });
      }
    });
  }

  async playMedia(mediaFileId: number): Promise<PlayMediaResult> {
    const mediaFile = this.catalog.getMediaFile(mediaFileId);
    if (!mediaFile) {
      throw new Error(`Media file ${mediaFileId} was not found.`);
    }

    console.log('[PlayerService] playMedia called', { mediaFileId, path: mediaFile.absolutePath });

    // mpv plays absolutePath directly; the Artplayer fallback streams
    // browser-compatible formats through the sky-media:// protocol.
    const mediaUrl = `sky-media://${mediaFileId}`;
    const sidecarSubtitles = scanSidecarSubtitles(mediaFile.absolutePath);

    return {
      mediaFileId,
      mediaUrl,
      absolutePath: mediaFile.absolutePath,
      title: mediaFile.fileName,
      watchProgress: this.getWatchProgress(mediaFileId),
      sidecarSubtitles
    };
  }

  async openExternally(mediaFileId: number): Promise<void> {
    const mediaFile = this.catalog.getMediaFile(mediaFileId);
    if (!mediaFile) {
      throw new Error(`Media file ${mediaFileId} was not found.`);
    }

    const error = await shell.openPath(mediaFile.absolutePath);
    if (error) {
      throw new Error(error);
    }
  }

  updateWatchProgress(update: WatchProgressUpdate): void {
    const now = new Date().toISOString();
    const previousProgress = this.getWatchProgress(update.mediaFileId);
    this.db
      .prepare(
        `INSERT INTO watch_progress (media_file_id, position_seconds, duration_seconds, completed, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(media_file_id) DO UPDATE SET
          position_seconds = excluded.position_seconds,
          duration_seconds = excluded.duration_seconds,
          completed = excluded.completed,
          updated_at = excluded.updated_at`
      )
      .run(update.mediaFileId, update.positionSeconds, update.durationSeconds, Number(update.completed ?? false), now);

    if (update.completed && !previousProgress?.completed) {
      this.db
        .prepare('INSERT INTO watch_history (media_file_id, watched_at, position_seconds) VALUES (?, ?, ?)')
        .run(update.mediaFileId, now, update.positionSeconds);
      // Keep only the 10 most-recent completion events per file to bound table growth.
      this.db
        .prepare(
          `DELETE FROM watch_history
           WHERE media_file_id = ?
             AND id NOT IN (
               SELECT id FROM watch_history
               WHERE media_file_id = ?
               ORDER BY watched_at DESC
               LIMIT 10
             )`
        )
        .run(update.mediaFileId, update.mediaFileId);
    }
  }

  getLastWatched(): LastWatchedInfo | null {
    const row = this.db
      .prepare(
        `SELECT
           wp.media_file_id,
           wp.position_seconds,
           wp.duration_seconds,
           wp.completed,
           wp.updated_at,
           mf.matched_movie_id,
           mf.matched_show_id,
           COALESCE(m.title, s.title, mf.file_name) AS title
         FROM watch_progress wp
         JOIN media_files mf ON mf.id = wp.media_file_id
         LEFT JOIN movies m ON m.id = mf.matched_movie_id
         LEFT JOIN tv_shows s ON s.id = mf.matched_show_id
         ORDER BY wp.updated_at DESC
         LIMIT 1`
      )
      .get() as
      | {
          media_file_id: number;
          position_seconds: number;
          duration_seconds: number;
          completed: number;
          updated_at: string;
          matched_movie_id: number | null;
          matched_show_id: number | null;
          title: string;
        }
      | undefined;

    if (!row) return null;

    return {
      mediaFileId: row.media_file_id,
      matchedMovieId: row.matched_movie_id,
      matchedShowId: row.matched_show_id,
      title: row.title,
      positionSeconds: row.position_seconds,
      durationSeconds: row.duration_seconds,
      completed: Boolean(row.completed),
      updatedAt: row.updated_at
    };
  }

  getWatchHistory(): WatchHistoryItem[] {
    const rows = this.db
      .prepare(
        `SELECT
           wp.media_file_id,
           wp.position_seconds,
           wp.duration_seconds,
           wp.completed,
           wp.updated_at AS last_watched_at,
           mf.media_kind,
           mf.matched_movie_id,
           mf.matched_show_id,
           COALESCE(m.title, s.title, mf.file_name) AS title,
           COALESCE(m.poster_path, s.poster_path)   AS poster_path,
           COUNT(wh.id) AS watch_count
         FROM watch_progress wp
         JOIN media_files mf ON mf.id = wp.media_file_id
         LEFT JOIN movies   m  ON m.id  = mf.matched_movie_id
         LEFT JOIN tv_shows s  ON s.id  = mf.matched_show_id
         LEFT JOIN watch_history wh ON wh.media_file_id = wp.media_file_id
         GROUP BY wp.media_file_id
         ORDER BY wp.updated_at DESC`
      )
      .all() as {
        media_file_id: number;
        position_seconds: number;
        duration_seconds: number;
        completed: number;
        last_watched_at: string;
        media_kind: string;
        matched_movie_id: number | null;
        matched_show_id: number | null;
        title: string;
        poster_path: string | null;
        watch_count: number;
      }[];

    return rows.map((r) => ({
      mediaFileId: r.media_file_id,
      matchedMovieId: r.matched_movie_id,
      matchedShowId: r.matched_show_id,
      title: r.title,
      mediaKind: r.media_kind as 'movie' | 'show',
      posterPath: r.poster_path,
      positionSeconds: r.position_seconds,
      durationSeconds: r.duration_seconds,
      completed: Boolean(r.completed),
      lastWatchedAt: r.last_watched_at,
      watchCount: r.watch_count
    }));
  }

  clearWatchHistory(): void {
    this.db.prepare('DELETE FROM watch_history').run();
    this.db.prepare('DELETE FROM watch_progress').run();
  }

  private getWatchProgress(mediaFileId: number): WatchProgressSnapshot | null {
    const row = this.db
      .prepare(
        `SELECT position_seconds, duration_seconds, completed, updated_at
         FROM watch_progress
         WHERE media_file_id = ?`
      )
      .get(mediaFileId) as
      | {
          position_seconds: number;
          duration_seconds: number;
          completed: number;
          updated_at: string;
        }
      | undefined;

    if (!row) {
      return null;
    }

    return {
      positionSeconds: row.position_seconds,
      durationSeconds: row.duration_seconds,
      completed: Boolean(row.completed),
      updatedAt: row.updated_at
    };
  }
}

function parseByteRange(rangeHeader: string | null, fileSize: number): ByteRange | null {
  if (!rangeHeader?.startsWith('bytes=')) {
    return null;
  }

  const range = rangeHeader.slice('bytes='.length).split(',')[0];
  const [rawStart, rawEnd] = range.split('-');
  const start = rawStart ? Number(rawStart) : Math.max(fileSize - Number(rawEnd), 0);
  const end = rawEnd ? Number(rawEnd) : fileSize - 1;

  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= fileSize) {
    return null;
  }

  return {
    start,
    end: Math.min(end, fileSize - 1)
  };
}

function getVideoContentType(filePath: string): string {
  switch (extname(filePath).toLowerCase()) {
    case '.mp4':
    case '.m4v':
      return 'video/mp4';
    case '.mov':
      return 'video/quicktime';
    case '.webm':
      return 'video/webm';
    case '.mkv':
      return 'video/x-matroska';
    case '.avi':
      return 'video/x-msvideo';
    case '.wmv':
      return 'video/x-ms-wmv';
    case '.ogv':
    case '.ogg':
      return 'video/ogg';
    case '.ts':
    case '.m2ts':
      return 'video/mp2t';
    default:
      return 'application/octet-stream';
  }
}
