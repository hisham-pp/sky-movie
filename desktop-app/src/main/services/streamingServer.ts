/**
 * Local HTTP streaming server for video playback.
 *
 * FFmpeg transcodes to a temp file (sky-movie-stream/) rather than piping
 * directly to the HTTP response.  This gives the browser a real seekable
 * file with proper range-request support, which is required for:
 *   - pause / resume (browser sends Range: bytes=X- when resuming)
 *   - seeking inside the video
 *   - correct audio-track initialisation in the moov atom
 *
 * Jobs are cached per {fileId}-{audioTrack}: once transcoding starts the
 * output file stays on disk until the server is restarted or the file is
 * more than 2 hours old, so replaying the same file is instant.
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { spawn, spawnSync, ChildProcess } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  statSync,
  createReadStream,
  readdirSync,
  unlinkSync
} from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { URL } from 'node:url';
import { logger } from '../utils/logger';
import { extractMediaMetadata } from './mediaMetadataService';
import ffmpegManager from './ffmpegManager';

const log = logger('StreamingServer');

interface TranscodeJob {
  filePath: string;
  outputPath: string;
  process: ChildProcess;
  codec: string;
  done: boolean;
  // Active HTTP connections serving this job. When it drops to zero after
  // a short grace period we kill the FFmpeg process so a refresh/nav-away
  // doesn't leave dozens of orphaned processes outputting audio.
  activeConnections: number;
  killTimer: ReturnType<typeof setTimeout> | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function readFileSlice(filePath: string, start: number, end: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = createReadStream(filePath, { start, end });
    stream.on('data', (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// Max total size of the temp directory before old files are evicted (2 GB).
const MAX_TEMP_BYTES = 2 * 1024 * 1024 * 1024;

export class StreamingServer {
  private server: ReturnType<typeof createServer> | null = null;
  private port = 0;
  private jobs = new Map<string, TranscodeJob>();
  private tempDir = join(tmpdir(), 'sky-movie-stream');

  async start(port = 13337): Promise<number> {
    mkdirSync(this.tempDir, { recursive: true });
    this.cleanOldTempFiles();

    if (!ffmpegManager.isFFmpegAvailable()) {
      log.warn('FFmpeg not found — MKV streaming will not work');
    } else {
      log.info('FFmpeg available — MKV streaming enabled');
    }

    return new Promise((resolve, reject) => {
      this.server = createServer(async (req, res) => {
        try {
          await this.handleRequest(req, res);
        } catch (error) {
          log.error('Request handler error:', error);
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
          }
          if (!res.writableEnded) res.end('Internal server error');
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

  private cleanOldTempFiles(): void {
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours
    try {
      const entries: Array<{ fp: string; mtime: number; size: number }> = [];
      for (const f of readdirSync(this.tempDir)) {
        try {
          const fp = join(this.tempDir, f);
          const st = statSync(fp);
          if (Date.now() - st.mtimeMs > maxAge) {
            unlinkSync(fp);
          } else {
            entries.push({ fp, mtime: st.mtimeMs, size: st.size });
          }
        } catch {}
      }

      // Evict oldest files first if total size exceeds cap
      const total = entries.reduce((s, e) => s + e.size, 0);
      if (total > MAX_TEMP_BYTES) {
        entries.sort((a, b) => a.mtime - b.mtime);
        let running = total;
        for (const e of entries) {
          if (running <= MAX_TEMP_BYTES) break;
          try { unlinkSync(e.fp); running -= e.size; } catch {}
        }
      }
    } catch {}
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url || '/', `http://127.0.0.1`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (url.pathname === '/stream') {
      await this.handleStream(req, res, url.searchParams);
    } else if (url.pathname === '/metadata') {
      await this.handleMetadata(req, res, url.searchParams);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  }

  private async handleStream(
    req: IncomingMessage,
    res: ServerResponse,
    query: URLSearchParams
  ): Promise<void> {
    const fileId = parseInt(query.get('id') || '', 10);
    const audioTrack = query.has('audio') ? parseInt(query.get('audio') || '0', 10) : 0;
    const filePath = query.get('path');

    log.info('Stream request', { fileId, filePath, audioTrack, range: req.headers.range });

    if (!filePath || !existsSync(filePath)) {
      log.error('File not found', { filePath });
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }

    if (extname(filePath).toLowerCase() === '.mkv') {
      await this.streamMKV(req, res, fileId, filePath, audioTrack);
    } else {
      await this.streamDirectFile(req, res, filePath);
    }
  }

  /**
   * Stream MKV via a cached temp file.
   *
   * FFmpeg transcodes to <tempDir>/<fileId>-<audioTrack>.mp4 once; any
   * subsequent request (including range / resume) is served from that file.
   */
  private killJob(jobKey: string): void {
    const job = this.jobs.get(jobKey);
    if (!job) return;
    if (job.killTimer) { clearTimeout(job.killTimer); job.killTimer = null; }
    if (!job.done) {
      try { job.process.kill('SIGKILL'); } catch {}
    }
    this.jobs.delete(jobKey);
    log.info(`Killed transcode job ${jobKey}`);
  }

  private trackConnection(jobKey: string, req: IncomingMessage): void {
    const job = this.jobs.get(jobKey);
    if (!job) return;

    // Cancel any pending kill — a new connection just arrived
    if (job.killTimer) { clearTimeout(job.killTimer); job.killTimer = null; }
    job.activeConnections++;

    req.on('close', () => {
      const j = this.jobs.get(jobKey);
      if (!j) return;
      j.activeConnections = Math.max(0, j.activeConnections - 1);
      if (j.activeConnections === 0 && !j.done) {
        // All connections closed (page refresh / navigate away). Wait 3 s in
        // case the browser immediately reconnects (seek / resume). If nothing
        // reconnects, kill the FFmpeg process.
        j.killTimer = setTimeout(() => {
          const still = this.jobs.get(jobKey);
          if (still && still.activeConnections === 0 && !still.done) {
            log.info(`No active connections for ${jobKey} — killing FFmpeg`);
            this.killJob(jobKey);
          }
        }, 3000);
      }
    });
  }

  private async streamMKV(
    req: IncomingMessage,
    res: ServerResponse,
    fileId: number,
    filePath: string,
    audioTrack: number
  ): Promise<void> {
    const jobKey = `${fileId}-${audioTrack}`;
    const outputPath = join(this.tempDir, `${jobKey}.mp4`);
    const ffmpegPath = ffmpegManager.getFFmpegPath();

    // ── Dedup check BEFORE spawnSync ────────────────────────────────────────
    // spawnSync blocks the Node.js event loop for ~500ms. If we check for an
    // existing job AFTER spawnSync, all the simultaneous byte-range requests
    // that were queued during the block all see jobAlive=false and each spawn
    // their own FFmpeg process → hundreds of processes, duplicate audio.
    // Checking FIRST means only the very first request ever starts a transcode.
    {
      const outputExists = existsSync(outputPath);
      const job = this.jobs.get(jobKey);
      const jobAlive = !!job && !job.done && job.process.exitCode === null;

      // File exists from a previous session or job already running — skip probe
      if (outputExists || jobAlive) {
        this.trackConnection(jobKey, req);
        // Fall through to wait + serve below
        return this.waitAndServe(req, res, outputPath, jobKey);
      }

      // Stale map entry for a dead process — clean up
      if (job) {
        try { job.process.kill('SIGKILL'); } catch {}
        this.jobs.delete(jobKey);
      }
    }

    // ── Probe file (only runs once per job) ─────────────────────────────────
    const probe = spawnSync(ffmpegPath, ['-i', filePath], { encoding: 'utf8', timeout: 5000 });
    const probeInfo = probe.stderr ?? '';

    const videoCodec = /Video: hevc|Video: av1|Video: vp9|Video: mpeg2video/i.test(probeInfo)
      ? 'libx264'
      : 'copy';
    log.info(videoCodec === 'libx264' ? 'Non-H264 — transcoding to H264' : 'H264 — stream copy');

    const audioStreamRegex = /Stream #0:\d+(?:\([^)]*\))?: Audio: (\w+)/g;
    const audioStreams: Array<{ codec: string; idx: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = audioStreamRegex.exec(probeInfo)) !== null) {
      audioStreams.push({ codec: m[1].toLowerCase(), idx: audioStreams.length });
    }

    const nativeIdx = audioStreams.findIndex((s) => /^(aac|mp3|opus|vorbis)$/.test(s.codec));
    let audioMap: string;
    let audioEncodeArgs: string[];

    if (nativeIdx !== -1) {
      audioMap = `0:a:${nativeIdx}`;
      audioEncodeArgs = ['-c:a', 'copy'];
      log.info(`Using native ${audioStreams[nativeIdx].codec} audio (stream idx ${nativeIdx}) — copy`);
    } else {
      audioMap = `0:a:${audioTrack}`;
      audioEncodeArgs = [
        '-af', 'aformat=channel_layouts=stereo',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-ar', '48000'
      ];
      log.info(`No native audio track — transcoding track ${audioTrack} to AAC stereo`);
    }

    // Re-check after the blocking probe — another request may have started the
    // job during the spawnSync (shouldn't happen since spawnSync blocks, but
    // be defensive).
    {
      const outputExists = existsSync(outputPath);
      const existingJob = this.jobs.get(jobKey);
      const jobAlive = !!existingJob && !existingJob.done && existingJob.process.exitCode === null;
      if (outputExists || jobAlive) {
        this.trackConnection(jobKey, req);
        return this.waitAndServe(req, res, outputPath, jobKey);
      }
    }

    // ── Start FFmpeg ─────────────────────────────────────────────────────────
    const args = [
      '-i', filePath,
      '-map', '0:v:0',
      '-map', audioMap,
      '-c:v', videoCodec,
      ...(videoCodec !== 'copy' ? ['-preset', 'ultrafast', '-crf', '28'] : []),
      ...audioEncodeArgs,
      '-f', 'mp4',
      '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
      '-fflags', '+genpts',
      '-y',
      outputPath
    ];

    log.info('Starting transcode', { jobKey, codec: videoCodec });
    log.debug('FFmpeg args:', args.join(' '));

    let proc: ChildProcess;
    try {
      proc = spawn(ffmpegPath, args, {
        stdio: ['ignore', 'ignore', 'pipe'],
        windowsHide: true
      });
    } catch (e) {
      log.error('Failed to spawn FFmpeg:', e);
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('FFmpeg not available');
      return;
    }

    const newJob: TranscodeJob = {
      filePath,
      outputPath,
      process: proc,
      codec: videoCodec,
      done: false,
      activeConnections: 0,
      killTimer: null
    };
    this.jobs.set(jobKey, newJob);

    proc.stderr?.on('data', (d: Buffer) => {
      const s = d.toString().trimEnd();
      if (/error|invalid|no such/i.test(s)) {
        log.error('FFmpeg stderr:', s);
      } else {
        log.debug('FFmpeg stderr:', s);
      }
    });

    proc.on('close', (code) => {
      log.info(`Transcode ${jobKey} exited with code ${code}`);
      const j = this.jobs.get(jobKey);
      if (j) j.done = true;
    });

    proc.on('error', (e) => {
      log.error(`Transcode ${jobKey} error:`, e);
      const j = this.jobs.get(jobKey);
      if (j) j.done = true;
    });

    this.trackConnection(jobKey, req);
    return this.waitAndServe(req, res, outputPath, jobKey);
  }

  private async waitAndServe(
    req: IncomingMessage,
    res: ServerResponse,
    outputPath: string,
    jobKey: string
  ): Promise<void> {

    const waitDeadline = Date.now() + 8000;
    while (Date.now() < waitDeadline) {
      if (existsSync(outputPath) && statSync(outputPath).size > 8192) break;
      const j = this.jobs.get(jobKey);
      if (j?.done) break;
      await sleep(50);
    }

    if (!existsSync(outputPath) || statSync(outputPath).size === 0) {
      log.error('Transcoding produced no output', { outputPath });
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Transcoding failed');
      return;
    }

    const currentJob = this.jobs.get(jobKey);

    if (!currentJob || currentJob.done) {
      await this.streamDirectFile(req, res, outputPath);
      return;
    }

    await this.serveGrowingFile(req, res, outputPath, currentJob);
  }

  /**
   * Serve a file that FFmpeg is still writing to.
   *
   * Initial request (no Range / bytes=0-): chunked 200 that keeps the
   * connection open and pushes bytes as FFmpeg writes them.
   *
   * Range request (pause/resume or seek): 206 with the bytes available
   * right now; the browser will issue another range request for the rest.
   */
  private async serveGrowingFile(
    req: IncomingMessage,
    res: ServerResponse,
    outputPath: string,
    job: TranscodeJob
  ): Promise<void> {
    const rangeHeader = req.headers.range;
    let start = 0;

    if (rangeHeader) {
      const m = /bytes=(\d+)-/.exec(rangeHeader);
      if (m) start = parseInt(m[1], 10);
    }

    // For range requests, wait until FFmpeg has written past the requested offset.
    // Timeout is 60 s to handle slow HEVC→H264 transcodes where 15 s isn't
    // enough to reach a mid-file seek position.
    if (start > 0) {
      const deadline = Date.now() + 60000;
      while (Date.now() < deadline) {
        if (statSync(outputPath).size > start) break;
        if (job.done) break;
        await sleep(100);
      }
    }

    const currentSize = statSync(outputPath).size;

    if (start >= currentSize) {
      log.warn('Range start beyond available data', { start, currentSize });
      res.writeHead(416, { 'Content-Range': `bytes */${currentSize}` });
      res.end();
      return;
    }

    if (start > 0) {
      // Partial range response: serve what's available now.
      // Browser will request bytes=<end+1>- for subsequent chunks.
      const end = currentSize - 1;
      res.writeHead(206, {
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes ${start}-${end}/*`,
        'Content-Length': end - start + 1,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store'
      });
      const stream = createReadStream(outputPath, { start, end });
      stream.pipe(res);
      req.on('close', () => stream.destroy());
      return;
    }

    // Full content: chunked 200, polling for new data as FFmpeg writes
    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Transfer-Encoding': 'chunked',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
      'Connection': 'keep-alive'
    });

    let offset = 0;
    let clientClosed = false;
    req.on('close', () => { clientClosed = true; });

    while (!clientClosed && !res.writableEnded) {
      const size = existsSync(outputPath) ? statSync(outputPath).size : 0;

      if (size > offset) {
        try {
          const chunk = await readFileSlice(outputPath, offset, size - 1);
          if (!res.writableEnded && !clientClosed) {
            res.write(chunk);
            offset = size;
          }
        } catch (e) {
          log.error('Error reading growing file slice:', e);
          break;
        }
      }

      const finalSize = existsSync(outputPath) ? statSync(outputPath).size : 0;
      if (job.done && offset >= finalSize) {
        res.end();
        log.debug('Chunked stream complete');
        break;
      }

      if (!job.done) await sleep(100);
    }
  }

  /**
   * Serve a complete file with full range-request support.
   * Used for non-MKV files and for fully-transcoded temp files.
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

      if (rangeHeader) {
        const [startStr, endStr] = rangeHeader.replace('bytes=', '').split('-');
        const start = parseInt(startStr, 10) || 0;
        const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

        if (start > end || start >= fileSize) {
          res.writeHead(416, { 'Content-Range': `bytes */${fileSize}` });
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

        const stream = createReadStream(filePath, { start, end });
        stream.pipe(res);
        req.on('close', () => stream.destroy());
        stream.on('error', (error) => {
          log.error('File stream error:', error);
          if (!res.writableEnded) res.end();
        });
      } else {
        res.writeHead(200, {
          'Content-Type': 'video/mp4',
          'Content-Length': fileSize,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-store'
        });

        const stream = createReadStream(filePath);
        stream.pipe(res);
        req.on('close', () => stream.destroy());
        stream.on('error', (error) => {
          log.error('File stream error:', error);
          if (!res.writableEnded) res.end();
        });
      }
    } catch (error) {
      log.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
      }
      res.end('Internal server error');
    }
  }

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
    if (!this.port) throw new Error('Streaming server not started');
    const url = new URL(`http://127.0.0.1:${this.port}/stream`);
    url.searchParams.set('id', String(fileId));
    url.searchParams.set('path', filePath);
    if (typeof audioTrack === 'number') url.searchParams.set('audio', String(audioTrack));
    if (typeof subtitleTrack === 'number') url.searchParams.set('subtitle', String(subtitleTrack));
    return url.toString();
  }

  getMetadataUrl(filePath: string): string {
    if (!this.port) throw new Error('Streaming server not started');
    const url = new URL(`http://127.0.0.1:${this.port}/metadata`);
    url.searchParams.set('path', filePath);
    return url.toString();
  }

  stop(): void {
    for (const [key, job] of this.jobs) {
      if (job.killTimer) clearTimeout(job.killTimer);
      if (!job.done) {
        try { job.process.kill('SIGKILL'); } catch {}
      }
      this.jobs.delete(key);
    }
    if (this.server) {
      this.server.close();
      log.info('Streaming server stopped');
    }
  }
}

export default new StreamingServer();
