/**
 * FFmpeg-based video streaming service
 * Handles MKV and other container formats by extracting video stream
 * Similar to Seanime's DirectStream approach
 */

import { spawn, ChildProcess } from 'node:child_process';
import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { logger } from '../utils/logger';

const log = logger('VideoStreamService');

interface StreamRequest {
  fileId: number;
  filePath: string;
  audioTrack?: number;
  startByte?: number;
  endByte?: number;
}

interface StreamSession {
  process: ChildProcess;
  createdAt: number;
  lastAccessedAt: number;
}

export class VideoStreamService {
  private activeSessions = new Map<string, StreamSession>();
  private readonly SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if FFmpeg is available
   */
  private isFFmpegAvailable(): boolean {
    try {
      const proc = spawn('ffmpeg', ['-version'], { stdio: 'ignore' });
      proc.kill();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Handle video stream request
   * Streams MKV files by extracting video with FFmpeg
   */
  async handleStreamRequest(
    req: IncomingMessage,
    res: ServerResponse,
    streamRequest: StreamRequest
  ): Promise<void> {
    try {
      if (!existsSync(streamRequest.filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        return;
      }

      if (!this.isFFmpegAvailable()) {
        res.writeHead(503, { 'Content-Type': 'text/plain' });
        res.end('FFmpeg not available');
        return;
      }

      const isMKV = extname(streamRequest.filePath).toLowerCase() === '.mkv';

      if (isMKV) {
        // Stream MKV via FFmpeg extraction
        await this.streamMKVWithFFmpeg(req, res, streamRequest);
      } else {
        // Stream regular file with range support
        await this.streamRegularFile(req, res, streamRequest);
      }
    } catch (error) {
      log.error('Error handling stream request:', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal server error');
      }
    }
  }

  /**
   * Stream MKV file by extracting video with FFmpeg
   */
  private async streamMKVWithFFmpeg(
    req: IncomingMessage,
    res: ServerResponse,
    streamRequest: StreamRequest
  ): Promise<void> {
    const { filePath, audioTrack } = streamRequest;

    // Build FFmpeg command
    const ffmpegArgs = [
      '-i', filePath,
      '-c:v', 'copy',           // Copy video codec (no re-encoding)
      '-c:a', 'aac',            // Re-encode audio to AAC (browser friendly)
      '-c:s', 'mov_text',       // Convert subtitles to mov_text format
      '-f', 'matroska',         // Output as Matroska
      '-y',                      // Overwrite without asking
      'pipe:1'                  // Output to stdout
    ];

    // Add audio track selection if specified
    if (typeof audioTrack === 'number' && audioTrack >= 0) {
      // Insert after -i argument
      ffmpegArgs.splice(2, 0, '-map', `0:a:${audioTrack}`);
    }

    log.info('Starting FFmpeg stream for:', { filePath, audioTrack });

    const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let headersSent = false;

    // Handle FFmpeg stderr for debugging
    ffmpeg.stderr?.on('data', (data) => {
      if (!headersSent) {
        log.debug('FFmpeg:', data.toString().split('\n')[0]);
      }
    });

    // Handle FFmpeg process errors
    ffmpeg.on('error', (error) => {
      log.error('FFmpeg process error:', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Stream error');
      }
      ffmpeg.kill();
    });

    // Handle process exit
    ffmpeg.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        log.warn('FFmpeg exited with code:', code);
      }
    });

    // Send headers
    res.writeHead(200, {
      'Content-Type': 'video/x-matroska',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
      'Connection': 'keep-alive'
    });
    headersSent = true;

    // Stream the output
    if (ffmpeg.stdout) {
      ffmpeg.stdout.pipe(res);

      // Handle client disconnect
      req.on('close', () => {
        ffmpeg.kill();
      });
    }
  }

  /**
   * Stream regular files with range request support
   */
  private async streamRegularFile(
    req: IncomingMessage,
    res: ServerResponse,
    streamRequest: StreamRequest
  ): Promise<void> {
    const { filePath } = streamRequest;
    const fileStat = await stat(filePath);
    const fileSize = fileStat.size;

    // Parse range header
    const rangeHeader = req.headers.range;
    let start = 0;
    let end = fileSize - 1;

    if (rangeHeader) {
      const ranges = rangeHeader.replace(/bytes=/, '').split('-');
      start = parseInt(ranges[0], 10) || 0;
      end = parseInt(ranges[1], 10) || fileSize - 1;

      if (start > end || start >= fileSize) {
        res.writeHead(416, {
          'Content-Range': `bytes */${fileSize}`,
          'Accept-Ranges': 'bytes'
        });
        res.end();
        return;
      }

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': this.getContentType(filePath),
        'Cache-Control': 'no-store'
      });
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Accept-Ranges': 'bytes',
        'Content-Type': this.getContentType(filePath),
        'Cache-Control': 'no-store'
      });
    }

    const stream = createReadStream(filePath, { start, end });
    stream.pipe(res);

    stream.on('error', (error) => {
      log.error('File stream error:', error);
      if (!res.headersSent) {
        res.writeHead(500);
      }
      res.end();
    });
  }

  /**
   * Get content type from file extension
   */
  private getContentType(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    switch (ext) {
      case '.mp4':
      case '.m4v':
        return 'video/mp4';
      case '.mkv':
        return 'video/x-matroska';
      case '.webm':
        return 'video/webm';
      case '.avi':
        return 'video/x-msvideo';
      case '.mov':
        return 'video/quicktime';
      case '.flv':
        return 'video/x-flv';
      case '.ogv':
      case '.ogg':
        return 'video/ogg';
      case '.ts':
      case '.m2ts':
        return 'video/mp2t';
      default:
        return 'video/mp4'; // Default to mp4
    }
  }

  /**
   * Cleanup expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [key, session] of this.activeSessions.entries()) {
      if (now - session.lastAccessedAt > this.SESSION_TIMEOUT) {
        log.info('Terminating expired stream session:', key);
        session.process.kill();
        this.activeSessions.delete(key);
      }
    }
  }

  /**
   * Periodic cleanup of expired sessions
   */
  startPeriodicCleanup(): NodeJS.Timeout {
    return setInterval(() => this.cleanupExpiredSessions(), 60000); // Every minute
  }

  /**
   * Cleanup all sessions
   */
  terminateAllSessions(): void {
    for (const [, session] of this.activeSessions.entries()) {
      session.process.kill();
    }
    this.activeSessions.clear();
  }
}

export default new VideoStreamService();
