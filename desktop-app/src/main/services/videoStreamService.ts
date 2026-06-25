/**
 * FFmpeg-based video streaming service
 * Handles MKV and other container formats by extracting video stream
 */

import { spawn } from 'node:child_process';
import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { logger } from '../utils/logger';
import ffmpegManager from './ffmpegManager';

const log = logger('VideoStreamService');

interface StreamRequest {
  fileId: number;
  filePath: string;
  audioTrack?: number;
  startByte?: number;
  endByte?: number;
}

export class VideoStreamService {
  /**
   * Handle video stream request
   * Streams MKV files by transcoding audio with FFmpeg; other formats use range-request passthrough
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

      const isMKV = extname(streamRequest.filePath).toLowerCase() === '.mkv';

      if (isMKV) {
        if (!ffmpegManager.isFFmpegAvailable()) {
          res.writeHead(503, { 'Content-Type': 'text/plain' });
          res.end('FFmpeg not available');
          return;
        }
        await this.streamMKVWithFFmpeg(req, res, streamRequest);
      } else {
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
   * Stream MKV file via FFmpeg — copies video, transcodes audio to AAC for browser compat
   */
  private async streamMKVWithFFmpeg(
    req: IncomingMessage,
    res: ServerResponse,
    streamRequest: StreamRequest
  ): Promise<void> {
    const { filePath, audioTrack } = streamRequest;
    const ffmpegPath = ffmpegManager.getFFmpegPath();

    const ffmpegArgs: string[] = [
      '-threads', '0',         // Use all available CPU threads for decoding
      '-i', filePath,
      '-map', '0:v',           // Always include video
    ];

    // Select specific audio track or default to first
    if (typeof audioTrack === 'number' && audioTrack >= 0) {
      ffmpegArgs.push('-map', `0:a:${audioTrack}`);
    } else {
      ffmpegArgs.push('-map', '0:a:0?');  // First audio track, optional (? = don't fail if absent)
    }

    ffmpegArgs.push(
      '-c:v', 'copy',          // Copy video — no re-encoding cost
      '-c:a', 'aac',           // Transcode audio to AAC (browser compatible)
      '-b:a', '192k',          // Reasonable stereo bitrate
      '-ac', '2',              // Downmix to stereo (handles 5.1/7.1 DTS/TrueHD)
      '-c:s', 'copy',          // Copy subtitle streams (Matroska supports them natively)
      '-f', 'matroska',        // Matroska container output
      'pipe:1'                 // Write to stdout
    );

    log.info('Starting FFmpeg stream:', { filePath, audioTrack });

    const ffmpeg = spawn(ffmpegPath, ffmpegArgs, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    ffmpeg.stderr?.on('data', (data: Buffer) => {
      log.debug('FFmpeg:', data.toString().split('\n')[0]);
    });

    ffmpeg.on('error', (error) => {
      log.error('FFmpeg process error:', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Stream error');
      }
    });

    ffmpeg.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        log.warn('FFmpeg exited with code:', code);
      }
    });

    res.writeHead(200, {
      'Content-Type': 'video/x-matroska',
      'Accept-Ranges': 'none',
      'Cache-Control': 'no-store',
      'Connection': 'keep-alive'
    });

    if (ffmpeg.stdout) {
      ffmpeg.stdout.pipe(res);

      req.on('close', () => {
        ffmpeg.kill('SIGTERM');
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
        return 'video/mp4';
    }
  }
}

export default new VideoStreamService();
