import { app, type WebContents } from 'electron';
import { spawn, execFile } from 'node:child_process';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { stat } from 'node:fs/promises';
import { getDatabaseContext } from '../database/client';
import { libraryFolders, movies, mediaFiles } from '../database/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

const execFileAsync = promisify(execFile);
const log = logger('YouTubeService');

export class YouTubeService {
  private getYtDlpPath(): string {
    if (app.isPackaged) {
      return join(process.resourcesPath, 'bin', 'yt-dlp.exe');
    }
    return join(app.getAppPath(), 'resources', 'bin', 'yt-dlp.exe');
  }

  async downloadVideo(url: string, folderId: number, wc: WebContents): Promise<void> {
    const ytdlp = this.getYtDlpPath();
    
    // 1. Get Folder Path
    const { drizzle: db } = getDatabaseContext();
    const folderRes = db.select().from(libraryFolders).where(eq(libraryFolders.id, folderId)).get();
    if (!folderRes) {
      throw new Error(`Library folder with ID ${folderId} not found`);
    }
    const destDir = folderRes.path;

    // 2. Fetch Metadata
    log.info(`Fetching metadata for ${url} using ${ytdlp}`);
    const { stdout } = await execFileAsync(ytdlp, ['--dump-json', url], { maxBuffer: 10 * 1024 * 1024 });
    const metadata = JSON.parse(stdout);

    const videoId = metadata.id;
    const title = metadata.title;
    const channelName = metadata.uploader || metadata.channel;
    const thumbnail = metadata.thumbnail;
    const duration = metadata.duration;
    
    // 3. Prevent Duplicates
    const existingMovie = db.select().from(movies).where(eq(movies.sourceId, videoId)).get();
    if (existingMovie) {
      wc.send('youtube:progress', {
        url,
        progress: 100,
        status: 'error',
        error: 'Video already exists in the library'
      });
      return;
    }

    // 4. Download Video
    log.info(`Downloading video to ${destDir}`);
    // -f best downloads best pre-merged format (video+audio)
    const args = ['-f', 'best', '-o', join(destDir, '%(title)s.%(ext)s'), '--print', 'after_move:filepath', url];
    
    const child = spawn(ytdlp, args);
    let downloadedFilePath = '';
    
    // Parse progress from stderr/stdout
    child.stdout.on('data', (data) => {
      const output = data.toString();
      // yt-dlp might print the file path if using --print
      if (output.trim() && output.includes(destDir)) {
        downloadedFilePath = output.trim();
      }
      this.parseProgress(url, output, wc);
    });

    child.stderr.on('data', (data) => {
      const output = data.toString();
      this.parseProgress(url, output, wc);
    });

    return new Promise((resolve, reject) => {
      child.on('close', async (code) => {
        if (code === 0) {
          try {
            // Wait for file system
            if (!downloadedFilePath) {
              // fallback if --print didn't work for some reason
              throw new Error('Could not determine downloaded file path');
            }

            const fileStat = await stat(downloadedFilePath);
            const ext = downloadedFilePath.split('.').pop() || 'mp4';
            const fileName = downloadedFilePath.split('\\').pop() || 'video.mp4';

            // 5. Save to Database
            const now = new Date().toISOString();
            
            // Insert Movie
            const insertedMovie = db.insert(movies).values({
              title: title,
              overview: metadata.description || null,
              releaseYear: metadata.upload_date ? parseInt(metadata.upload_date.substring(0, 4)) : null,
              posterPath: thumbnail || null,
              backdropPath: thumbnail || null,
              runtimeMinutes: duration ? Math.floor(duration / 60) : null,
              source: 'youtube',
              sourceId: videoId,
              sourceUrl: url,
              channelName: channelName,
              addedAt: now,
              updatedAt: now,
            }).returning().get();

            // Insert Media File
            db.insert(mediaFiles).values({
              libraryFolderId: folderId,
              mediaKind: 'movie',
              absolutePath: downloadedFilePath,
              relativePath: fileName,
              fileName: fileName,
              extension: '.' + ext,
              fileSize: fileStat.size,
              modifiedTime: fileStat.mtime.toISOString(),
              createdTime: fileStat.birthtime.toISOString(),
              durationSeconds: duration,
              matchedMovieId: insertedMovie.id,
              matchConfidence: 100,
              matchStatus: 'matched'
            }).run();

            wc.send('youtube:progress', {
              url,
              progress: 100,
              status: 'completed'
            });
            resolve();
          } catch (e: any) {
            log.error('Error saving YouTube video to database:', e);
            wc.send('youtube:progress', { url, progress: 0, status: 'error', error: e.message });
            reject(e);
          }
        } else {
          wc.send('youtube:progress', { url, progress: 0, status: 'error', error: 'yt-dlp exited with code ' + code });
          reject(new Error('yt-dlp exited with code ' + code));
        }
      });
    });
  }

  private parseProgress(url: string, output: string, wc: WebContents) {
    // Example: [download]  10.0% of 50.00MiB at  5.00MiB/s ETA 00:09
    const match = output.match(/\[download\]\s+([\d.]+)% of\s+~?([\d.]+[a-zA-Z]+) at\s+([\d.]+[a-zA-Z]+\/s) ETA\s+([\d:]+)/);
    if (match) {
      const percent = parseFloat(match[1]);
      const speed = match[3];
      const eta = match[4];
      wc.send('youtube:progress', {
        url,
        progress: percent,
        status: 'downloading',
        speed,
        eta
      });
    }
  }
}

export default new YouTubeService();
