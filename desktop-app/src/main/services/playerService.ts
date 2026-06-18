import { net, protocol, shell } from 'electron';
import { pathToFileURL } from 'node:url';
import type { PlayMediaResult, WatchProgressUpdate } from '../../shared/ipc';
import type { SqliteDatabase } from '../database/client';
import { CatalogService } from './catalogService';

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

      return net.fetch(pathToFileURL(mediaFile.absolutePath).toString());
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
