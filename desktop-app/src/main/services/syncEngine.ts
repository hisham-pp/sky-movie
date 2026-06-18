import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve, sep } from 'node:path';
import type { SyncRequest, SyncResult } from '../../shared/ipc';
import type { AppDataPaths } from '../appPaths';
import type { SqliteDatabase } from '../database/client';

export class LocalSyncEngine {
  constructor(
    private readonly db: SqliteDatabase,
    private readonly paths: AppDataPaths,
    private readonly appVersion: string
  ) {}

  async exportLibrary(request: SyncRequest = { type: 'metadata-only' }): Promise<SyncResult> {
    const destinationRoot = request.destinationPath ?? this.paths.exports;
    const destinationPath = join(destinationRoot, 'movie-library-sync');
    await mkdir(destinationPath, { recursive: true });

    const movies = this.db.prepare('SELECT * FROM movies ORDER BY title ASC').all();
    const shows = this.db.prepare('SELECT * FROM tv_shows ORDER BY title ASC').all();
    const episodes = this.db.prepare('SELECT * FROM episodes ORDER BY show_id ASC, season_number ASC, episode_number ASC').all();
    const progress = this.db.prepare('SELECT * FROM watch_progress ORDER BY updated_at DESC').all();
    const files = this.selectFilesForSync(request);

    const metadataPath = join(destinationPath, 'database-export.jsonl');
    const lines = [
      ...movies.map((row) => JSON.stringify({ type: 'movie', data: row })),
      ...shows.map((row) => JSON.stringify({ type: 'show', data: row })),
      ...episodes.map((row) => JSON.stringify({ type: 'episode', data: row })),
      ...progress.map((row) => JSON.stringify({ type: 'watch_progress', data: row })),
      ...files.map((row) => JSON.stringify({ type: 'media_file', data: row }))
    ];
    await writeFile(metadataPath, `${lines.join('\n')}\n`, 'utf8');

    const shouldCopyMediaFiles = request.includeMediaFiles || request.type === 'files' || request.type === 'full';
    const copiedFiles = shouldCopyMediaFiles
      ? await this.copyMediaFiles(files, destinationPath, request)
      : { count: 0, totalSize: 0 };
    const checksumSummary = createHash('sha256').update(lines.join('\n')).digest('hex');
    const manifest = {
      syncVersion: 1,
      appVersion: this.appVersion,
      syncDate: new Date().toISOString(),
      sourceDeviceId: this.getDeviceId(),
      syncType: request.type,
      includedFilters: request.filters ?? {},
      itemCount: movies.length + shows.length + episodes.length,
      fileCount: copiedFiles.count,
      totalSize: copiedFiles.totalSize,
      checksumSummary,
      includesPosterCache: Boolean(request.includePosterCache),
      includesBackdropCache: Boolean(request.includeBackdropCache),
      includesMediaFiles: shouldCopyMediaFiles
    };
    const manifestPath = join(destinationPath, 'manifest.json');
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    await mkdir(join(destinationPath, 'movies'), { recursive: true });
    await mkdir(join(destinationPath, 'shows'), { recursive: true });
    await mkdir(join(destinationPath, 'posters'), { recursive: true });
    await mkdir(join(destinationPath, 'backdrops'), { recursive: true });
    await mkdir(join(destinationPath, 'subtitles'), { recursive: true });
    await mkdir(join(destinationPath, 'files'), { recursive: true });

    this.db
      .prepare(
        `INSERT INTO sync_history (sync_profile_id, sync_type, destination_path, item_count, file_count, total_size, status, manifest_path, created_at)
         VALUES (NULL, ?, ?, ?, ?, ?, 'complete', ?, ?)`
      )
      .run(request.type, destinationPath, manifest.itemCount, copiedFiles.count, copiedFiles.totalSize, manifestPath, manifest.syncDate);

    return {
      destinationPath,
      manifestPath,
      itemCount: manifest.itemCount,
      fileCount: copiedFiles.count,
      totalSize: copiedFiles.totalSize,
      checksumSummary
    };
  }

  async importLibrary(path: string): Promise<SyncResult> {
    const metadataPath = join(path, 'database-export.jsonl');
    const content = await readFile(metadataPath, 'utf8');
    const rows = content
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as { type: string; data: Record<string, unknown> });

    const transaction = this.db.transaction((items: typeof rows) => {
      for (const item of items) {
        if (item.type === 'watch_progress') {
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
            .run(
              item.data.media_file_id,
              item.data.position_seconds,
              item.data.duration_seconds,
              item.data.completed,
              item.data.updated_at
            );
        }
      }
    });
    transaction(rows);

    const manifestPath = join(path, 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
      itemCount: number;
      fileCount: number;
      totalSize: number;
      checksumSummary: string;
    };

    return {
      destinationPath: path,
      manifestPath,
      itemCount: manifest.itemCount,
      fileCount: manifest.fileCount,
      totalSize: manifest.totalSize,
      checksumSummary: manifest.checksumSummary
    };
  }

  async syncLibrary(request: SyncRequest): Promise<SyncResult> {
    return this.exportLibrary(request);
  }

  private selectFilesForSync(request: SyncRequest): Record<string, unknown>[] {
    const rows = this.db.prepare('SELECT * FROM media_files ORDER BY relative_path ASC').all() as Record<string, unknown>[];

    return rows.filter((row) => {
      if (request.mediaKind && request.mediaKind !== 'mixed' && row.media_kind !== request.mediaKind) {
        return false;
      }

      if (request.filters?.fileLocationIncludes) {
        const path = String(row.absolute_path).toLowerCase();
        if (!path.includes(request.filters.fileLocationIncludes.toLowerCase())) {
          return false;
        }
      }

      if (request.filters?.maxFileSizeBytes && Number(row.file_size) > request.filters.maxFileSizeBytes) {
        return false;
      }

      if (request.filters?.resolution && request.filters.resolution !== 'any' && row.resolution !== request.filters.resolution) {
        return false;
      }

      return true;
    });
  }

  private async copyMediaFiles(
    files: Record<string, unknown>[],
    destinationPath: string,
    request: SyncRequest
  ): Promise<{ count: number; totalSize: number }> {
    const filesRoot = join(destinationPath, 'files');
    await mkdir(filesRoot, { recursive: true });

    let copiedFileCount = 0;
    let totalSize = 0;
    for (const row of files) {
      const sourcePath = String(row.absolute_path ?? '');
      const sourceStats = await getFileStats(sourcePath);
      if (!sourceStats) {
        continue;
      }

      const relativePath = request.preserveFolderStructure === false
        ? uniqueFlatFileName(row, copiedFileCount)
        : String(row.relative_path ?? basename(sourcePath));
      const targetPath = safeJoin(filesRoot, relativePath);
      await mkdir(dirname(targetPath), { recursive: true });
      await copyFile(sourcePath, targetPath);
      copiedFileCount += 1;
      totalSize += sourceStats.size;
    }

    return { count: copiedFileCount, totalSize };
  }

  private getDeviceId(): string {
    const row = this.db.prepare('SELECT value FROM app_settings WHERE key = ?').get('settings') as
      | { value: string }
      | undefined;
    if (!row) {
      return 'unknown-device';
    }

    return JSON.parse(row.value).deviceId ?? 'unknown-device';
  }
}

async function getFileStats(path: string) {
  try {
    const stats = await stat(path);
    return stats.isFile() ? stats : null;
  } catch {
    return null;
  }
}

function uniqueFlatFileName(row: Record<string, unknown>, index: number): string {
  const id = String(row.id ?? index + 1);
  return `${id}-${basename(String(row.file_name ?? row.absolute_path ?? `media-${index + 1}`))}`;
}

function safeJoin(root: string, relativePath: string): string {
  const targetPath = resolve(root, relativePath);
  const normalizedRoot = resolve(root);
  if (targetPath !== normalizedRoot && !targetPath.startsWith(`${normalizedRoot}${sep}`)) {
    throw new Error(`Refusing to copy outside export folder: ${relativePath}`);
  }

  return targetPath;
}
