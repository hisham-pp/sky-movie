/**
 * FFmpeg Bundle Manager
 * Handles locating and managing bundled FFmpeg executable
 */

import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { app } from 'electron';
import { execSync } from 'node:child_process';
import { logger } from '../utils/logger';

const log = logger('FFmpegManager');

export class FFmpegManager {
  private ffmpegPath: string | null = null;
  private isAvailable: boolean = false;
  private initialized: boolean = false;

  constructor() {
    // Delay initialization until first usage to ensure Electron paths are available
  }

  private init(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    const candidates = this.getFfmpegCandidates();
    log.info('Checking for FFmpeg in:', candidates);

    for (const candidate of candidates) {
      if (candidate === 'ffmpeg' || candidate === 'ffmpeg.exe') {
        continue;
      }

      if (existsSync(candidate)) {
        this.ffmpegPath = candidate;
        this.isAvailable = true;
        log.info('Found FFmpeg at:', candidate);
        return;
      }
    }

    try {
      execSync('ffmpeg -version', { stdio: 'pipe', timeout: 5000 });
      this.isAvailable = true;
      this.ffmpegPath = 'ffmpeg';
      log.info('Found FFmpeg in system PATH');
    } catch {
      log.warn('FFmpeg not found in any location');
    }
  }

  /**
   * Get list of potential FFmpeg locations
   */
  private getFfmpegCandidates(): string[] {
    const appPath = app.getAppPath();
    const packagedPaths = [
      join(process.resourcesPath, 'ffmpeg', 'ffmpeg.exe'),
      join(process.resourcesPath, 'ffmpeg', 'ffmpeg'),
      join(process.resourcesPath, 'app.asar.unpacked', 'ffmpeg', 'ffmpeg.exe'),
      join(process.resourcesPath, 'app.asar.unpacked', 'ffmpeg', 'ffmpeg'),
      join(process.resourcesPath, 'resources', 'ffmpeg', 'ffmpeg.exe'),
      join(process.resourcesPath, 'resources', 'ffmpeg', 'ffmpeg')
    ];

    const devPaths = [
      join(dirname(appPath), 'resources', 'ffmpeg', 'ffmpeg.exe'),
      join(dirname(appPath), 'resources', 'ffmpeg', 'ffmpeg'),
      join(dirname(appPath), '..', 'resources', 'ffmpeg', 'ffmpeg.exe'),
      join(dirname(appPath), '..', 'resources', 'ffmpeg', 'ffmpeg'),
      join(process.cwd(), 'resources', 'ffmpeg', 'ffmpeg.exe'),
      join(process.cwd(), 'resources', 'ffmpeg', 'ffmpeg')
    ];

    return Array.from(new Set([...packagedPaths, ...devPaths, 'ffmpeg.exe', 'ffmpeg']));
  }

  /**
   * Check if FFmpeg is available
   */
  isFFmpegAvailable(): boolean {
    this.init();
    return this.isAvailable;
  }

  /**
   * Get FFmpeg executable path
   * Returns 'ffmpeg' if in system PATH, otherwise full path to bundled version
   */
  getFFmpegPath(): string {
    this.init();
    if (this.ffmpegPath) {
      return this.ffmpegPath;
    }
    throw new Error('FFmpeg not found');
  }

  /**
   * Check availability and return path or throw error
   */
  requireFFmpeg(): string {
    if (!this.isFFmpegAvailable()) {
      throw new Error(
        'FFmpeg is required for MKV support but not found. ' +
        'Please reinstall Sky Movie or install FFmpeg from https://ffmpeg.org/download.html'
      );
    }
    return this.getFFmpegPath();
  }
}

export default new FFmpegManager();

