/**
 * Adaptive buffering and streaming strategies based on stream type
 * Pattern from seanime's DirectStream manager
 */

import type { StreamType } from './stream';

/**
 * Buffering configuration for different stream types
 * Optimizes flush interval, batch size, and sleep time based on source
 */
export interface BufferingConfig {
  /**
   * How often to flush buffered data (ms)
   */
  flushIntervalMs: number;

  /**
   * Maximum number of items to batch before flushing
   */
  maxBatchSize: number;

  /**
   * Sleep time after flush to prevent CPU spinning (ms)
   */
  sleepAfterFlushMs: number;

  /**
   * Maximum buffer size in bytes before applying backpressure
   */
  maxBufferBytes: number;

  /**
   * Prefetch size for initial buffering (bytes)
   */
  prefetchBytes: number;

  /**
   * Description of this configuration
   */
  description: string;
}

/**
 * Default buffering configurations optimized for different stream types
 * Based on empirical testing and seanime's configurations
 */
export const BUFFERING_CONFIGS: Record<StreamType, BufferingConfig> = {
  'local-file': {
    flushIntervalMs: 300,
    maxBatchSize: 50,
    sleepAfterFlushMs: 500,
    maxBufferBytes: 50 * 1024 * 1024, // 50MB
    prefetchBytes: 5 * 1024 * 1024, // 5MB
    description: 'Local file (supports fast seeking)'
  },
  'http': {
    flushIntervalMs: 200,
    maxBatchSize: 30,
    sleepAfterFlushMs: 200,
    maxBufferBytes: 20 * 1024 * 1024, // 20MB
    prefetchBytes: 2 * 1024 * 1024, // 2MB
    description: 'HTTP stream (standard streaming)'
  },
  'torrent': {
    flushIntervalMs: 250,
    maxBatchSize: 25,
    sleepAfterFlushMs: 100,
    maxBufferBytes: 15 * 1024 * 1024, // 15MB
    prefetchBytes: 1 * 1024 * 1024, // 1MB
    description: 'Torrent (live streaming from peers)'
  },
  'debrid': {
    flushIntervalMs: 200,
    maxBatchSize: 30,
    sleepAfterFlushMs: 200,
    maxBufferBytes: 20 * 1024 * 1024, // 20MB
    prefetchBytes: 2 * 1024 * 1024, // 2MB
    description: 'Debrid service (HTTP-like streaming)'
  }
};

/**
 * Get buffering configuration for a specific stream type
 */
export function getBufferingConfig(streamType: StreamType): BufferingConfig {
  return BUFFERING_CONFIGS[streamType];
}

/**
 * Adaptive buffering manager - adjusts buffering based on network conditions
 */
export class AdaptiveBufferingManager {
  private config: BufferingConfig;
  private bufferQueue: any[] = [];
  private totalBufferedBytes = 0;
  private flushTimer: NodeJS.Timeout | null = null;
  private onFlush: (batch: any[]) => Promise<void>;

  constructor(streamType: StreamType, onFlush: (batch: any[]) => Promise<void>) {
    this.config = getBufferingConfig(streamType);
    this.onFlush = onFlush;
  }

  /**
   * Add data to buffer
   */
  async buffer(data: any, sizeBytes: number): Promise<void> {
    this.bufferQueue.push(data);
    this.totalBufferedBytes += sizeBytes;

    // Check if we should flush based on batch size
    if (this.bufferQueue.length >= this.config.maxBatchSize) {
      await this.flush();
      return;
    }

    // Check if we should apply backpressure
    if (this.totalBufferedBytes >= this.config.maxBufferBytes) {
      await this.flush();
      return;
    }

    // Schedule flush if not already scheduled
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.config.flushIntervalMs);
    }
  }

  /**
   * Manually flush buffer
   */
  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.bufferQueue.length === 0) {
      return;
    }

    const batch = this.bufferQueue.splice(0, this.bufferQueue.length);
    this.totalBufferedBytes = 0;

    try {
      await this.onFlush(batch);
      // Sleep after flush to prevent CPU spinning
      await new Promise((resolve) => setTimeout(resolve, this.config.sleepAfterFlushMs));
    } catch (error) {
      console.error('Error flushing buffer:', error);
      // Re-queue failed items? Or let caller handle?
      throw error;
    }
  }

  /**
   * Get current buffer statistics
   */
  getStats() {
    return {
      queueSize: this.bufferQueue.length,
      totalBytes: this.totalBufferedBytes,
      maxBatchSize: this.config.maxBatchSize,
      maxBufferBytes: this.config.maxBufferBytes
    };
  }

  /**
   * Clear buffer and cleanup
   */
  async clear(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.bufferQueue = [];
    this.totalBufferedBytes = 0;
  }

  /**
   * Update configuration (e.g., based on network conditions)
   */
  updateConfig(partialConfig: Partial<BufferingConfig>): void {
    this.config = {
      ...this.config,
      ...partialConfig
    };
  }
}

/**
 * Subtitle streaming configuration
 * Subtitles are extracted and cached separately from video stream
 */
export const SUBTITLE_STREAMING_CONFIG = {
  // Cache parsed subtitles to avoid re-parsing
  enableSubtitleCache: true,
  // Maximum size of subtitle cache
  maxSubtitleCacheSize: 100 * 1024 * 1024, // 100MB
  // Formats to support for subtitle conversion
  supportedFormats: ['vtt', 'ass', 'srt', 'ssa']
};
