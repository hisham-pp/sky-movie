import { protocol, shell } from 'electron';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { Readable } from 'node:stream';
import type { PlayMediaResult, WatchProgressUpdate } from '../../shared/ipc';
import type { SqliteDatabase } from '../database/client';
import { CatalogService } from './catalogService';

interface ByteRange {
  start: number;
  end: number;
}

export class PlayerService {
  private readonly catalog: CatalogService;

  constructor(private readonly db: SqliteDatabase) {
    this.catalog = new CatalogService(db);
  }

  registerMediaProtocol(): void {
    protocol.handle('sky-media', async (request) => {
      const id = Number(new URL(request.url).hostname);
      const mediaFile = this.catalog.getMediaFile(id);

      if (!mediaFile) {
        return new Response('Media file not found.', { status: 404 });
      }

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
    });
  }

  async playMedia(mediaFileId: number): Promise<PlayMediaResult> {
    const mediaFile = this.catalog.getMediaFile(mediaFileId);
    if (!mediaFile) {
      throw new Error(`Media file ${mediaFileId} was not found.`);
    }

    return {
      mediaFileId,
      mediaUrl: `sky-media://${mediaFileId}`,
      title: mediaFile.fileName
    };
  }

  async openExternally(mediaFileId: number): Promise<void> {
    const mediaFile = this.catalog.getMediaFile(mediaFileId);
    if (!mediaFile) {
      throw new Error(`Media file ${mediaFileId} was not found.`);
    }

    await shell.openPath(mediaFile.absolutePath);
  }

  updateWatchProgress(update: WatchProgressUpdate): void {
    const now = new Date().toISOString();
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

    if (update.completed) {
      this.db
        .prepare('INSERT INTO watch_history (media_file_id, watched_at, position_seconds) VALUES (?, ?, ?)')
        .run(update.mediaFileId, now, update.positionSeconds);
    }
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
