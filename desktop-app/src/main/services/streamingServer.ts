/**
 * Local HTTP streaming server for video playback
 * Supports MKV and other container formats with FFmpeg
 * Similar to Seanime's DirectStream approach
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, basename } from 'node:path';
import { URL } from 'node:url';
import { logger } from '../utils/logger';
import { extractMediaMetadata } from './mediaMetadataService';

const log = logger('StreamingServer');

interface StreamSession {
  fileId: number;
  filePath: string;
  audioTrack?: number;
  subtitleTrack?: number;
}

export class StreamingServer {
  private server: any = null;
  private port = 0;
  private activeSessions = new Map<string, StreamSession>();

  async start(port = 13337): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = createServer(async (req, res) => {
        try {
          await this.handleRequest(req, res);
        } catch (error) {
          log.error('Request handler error:', error);
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
          }
          res.end('Internal server error');
        }
      });

      this.server.on('error', reject);
      this.server.listen(port, '127.0.0.1', () => {
        this.port = port;
        log.info(`Streaming server started on port ${port}`);
        resolve(port);
      });
    });
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;
    const query = url.searchParams;

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (pathname === '/stream') {
      await this.handleStream(req, res, query);
    } else if (pathname === '/metadata') {
      await this.handleMetadata(req, res, query);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  }

  /**
   * Handle video stream requests
   * GET /stream?id=123&audio=0&subtitle=-1
   */
  private async handleStream(
    req: IncomingMessage,
    res: ServerResponse,
    query: URLSearchParams
  ): Promise<void> {
    const fileId = parseInt(query.get('id') || '', 10);
    const audioTrack = query.has('audio') ? parseInt(query.get('audio') || '', 10) : undefined;
    const subtitleTrack = query.has('subtitle') ? parseInt(query.get('subtitle') || '', 10) : undefined;
    const filePath = query.get('path');

    if (!filePath || !existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }

    const isMKV = extname(filePath).toLowerCase() === '.mkv';

    if (isMKV) {
      await this.streamMKVWithFFmpeg(req, res, filePath, audioTrack, subtitleTrack);
    } else {
      await this.streamDirectFile(req, res, filePath);
    }
  }

  /**
   * Stream MKV file using FFmpeg
   * FFmpeg extracts video/audio and packages as Matroska for browser compatibility
   */
  private async streamMKVWithFFmpeg(
    req: IncomingMessage,
    res: ServerResponse,
    filePath: string,
    audioTrack?: number,
    subtitleTrack?: number
  ): Promise<void> {
    log.info('Streaming MKV file:', { filePath, audioTrack, subtitleTrack });

    // Build FFmpeg command to extract and re-stream
    const ffmpegArgs: string[] = ['-i', filePath];

    // Map specific audio track if requested
    if (typeof audioTrack === 'number' && audioTrack >= 0) {
      ffmpegArgs.push('-map', `0:a:${audioTrack}`);
    } else {
      // Include all audio tracks by default
      ffmpegArgs.push('-map', '0:a');
    }

    // Handle subtitles
    if (typeof subtitleTrack === 'number' && subtitleTrack >= 0) {
      ffmpegArgs.push('-map', `0:s:${subtitleTrack}`);
      ffmpegArgs.push('-c:s', 'mov_text'); // Convert to mov_text for browser compatibility
    }

    // Always include video
    ffmpegArgs.push('-map', '0:v:0');

    // Encoding options
    ffmpegArgs.push('-c:v', 'copy'); // Copy video codec (no re-encoding)
    ffmpegArgs.push('-c:a', 'copy'); // Copy audio codec
    ffmpegArgs.push('-f', 'matroska'); // Output as Matroska container
    ffmpegArgs.push('-fflags', '+genpts'); // Generate presentation timestamps
    ffmpegArgs.push('pipe:1'); // Output to stdout

    let ffmpegProcess;
    try {
      ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true
      });
    } catch (error) {
      log.error('Failed to spawn FFmpeg:', error);
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('FFmpeg not available');
      return;
    }

    let headersSent = false;

    // Send streaming headers
    res.writeHead(200, {
      'Content-Type': 'video/x-matroska',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-store',
      'Connection': 'keep-alive',
      'Accept-Ranges': 'none'
    });
    headersSent = true;

    if (!ffmpegProcess.stdout) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Stream initialization failed');
      return;
    }

    // Pipe FFmpeg output to response
    ffmpegProcess.stdout.pipe(res, { end: true });

    // Handle errors
    ffmpegProcess.on('error', (error) => {
      log.error('FFmpeg process error:', error);
      ffmpegProcess.kill();
    });

    ffmpegProcess.stderr?.on('data', (data) => {
      // Log FFmpeg debug info
      const lines = data.toString().split('\n');
      const relevantLines = lines.filter((line: string) =>
        line.includes('error') || line.includes('Error') || line.includes('No such')
      );
      if (relevantLines.length > 0) {
        log.debug('FFmpeg stderr:', relevantLines[0]);
      }
    });

    // Cleanup on client disconnect
    req.on('close', () => {
      if (!ffmpegProcess.killed) {
        ffmpegProcess.kill('SIGKILL');
      }
    });

    ffmpegProcess.on('close', (code) => {
      if (code && code !== 0 && code !== 143) {
        // 143 is SIGTERM which is expected on close
        log.warn('FFmpeg exited with code:', code);
      }
    });
  }

  /**
   * Stream non-MKV files directly with range request support
   */
  private async streamDirectFile(
    req: IncomingMessage,
    res: ServerResponse,
    filePath: string
  ): Promise<void> {
    try {
      const fileStat = await stat(filePath);
      const fileSize = fileStat.size;
      const rangeHeader = req.headers.range;

      // Handle range requests for seeking
      if (rangeHeader) {
        const ranges = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(ranges[0], 10) || 0;
        const end = parseInt(ranges[1], 10) || fileSize - 1;

        if (start > end || start >= fileSize) {
          res.writeHead(416, {
            'Content-Range': `bytes */${fileSize}`
          });
          res.end();
          return;
        }

        const chunkSize = end - start + 1;
        res.writeHead(206, {
          'Content-Type': 'video/mp4',
          'Content-Length': chunkSize,
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-store'
        });

        const fs = await import('node:fs');
        const stream = fs.createReadStream(filePath, { start, end });
        stream.pipe(res);

        stream.on('error', (error) => {
          log.error('File stream error:', error);
          if (!res.headersSent) {
            res.writeHead(500);
          }
          res.end();
        });
      } else {
        // Full file stream
        res.writeHead(200, {
          'Content-Type': 'video/mp4',
          'Content-Length': fileSize,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-store'
        });

        const fs = await import('node:fs');
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);

        stream.on('error', (error) => {
          log.error('File stream error:', error);
          if (!res.headersSent) {
            res.writeHead(500);
          }
          res.end();
        });
      }
    } catch (error) {
      log.error('Error streaming file:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal server error');
    }
  }

  /**
   * Handle metadata requests
   * GET /metadata?path=/path/to/file.mkv
   */
  private async handleMetadata(
    req: IncomingMessage,
    res: ServerResponse,
    query: URLSearchParams
  ): Promise<void> {
    const filePath = query.get('path');

    if (!filePath || !existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File not found' }));
      return;
    }

    try {
      const metadata = extractMediaMetadata(filePath);

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=3600'
      });
      res.end(
        JSON.stringify({
          duration: metadata.duration,
          audioTracks: metadata.audioTracks,
          subtitleTracks: metadata.subtitleTracks,
          videoTracks: metadata.videoTracks
        })
      );
    } catch (error) {
      log.error('Error extracting metadata:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to extract metadata' }));
    }
  }

  getUrl(fileId: number, filePath: string, audioTrack?: number, subtitleTrack?: number): string {
    if (!this.port) {
      throw new Error('Streaming server not started');
    }

    const url = new URL(`http://127.0.0.1:${this.port}/stream`);
    url.searchParams.set('id', String(fileId));
    url.searchParams.set('path', filePath);
    if (typeof audioTrack === 'number') {
      url.searchParams.set('audio', String(audioTrack));
    }
    if (typeof subtitleTrack === 'number') {
      url.searchParams.set('subtitle', String(subtitleTrack));
    }
    return url.toString();
  }

  getMetadataUrl(filePath: string): string {
    if (!this.port) {
      throw new Error('Streaming server not started');
    }

    const url = new URL(`http://127.0.0.1:${this.port}/metadata`);
    url.searchParams.set('path', filePath);
    return url.toString();
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      log.info('Streaming server stopped');
    }
  }
}

export default new StreamingServer();
