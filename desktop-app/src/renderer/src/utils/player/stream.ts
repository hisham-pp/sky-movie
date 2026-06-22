/**
 * Video stream abstraction - unified interface for all source types
 * This allows the player to handle local files, torrents, HTTP streams, etc. uniformly
 */

export type StreamType = 'local-file' | 'http' | 'torrent' | 'debrid';

export interface PlaybackInfo {
  contentType: string;
  duration?: number;
  fileSize?: number;
  canSeek: boolean;
}

export interface TrackInfo {
  number: number;
  type: 'video' | 'audio' | 'subtitle';
  codecId: string; // 'V_UNCOMPRESSED', 'A_AAC', 'S_TEXT/ASS'
  language?: string; // IETF BCP 47
  label?: string;
  isDefault: boolean;
  isForced: boolean;
  codecPrivate?: string; // Base64 encoded codec-specific data

  // Video track fields
  width?: number;
  height?: number;
  pixelFormat?: string;

  // Audio track fields
  channels?: number;
  sampleRate?: number;
  bitDepth?: number;
}

export interface VideoMetadata {
  title?: string;
  duration: number;
  videoTracks: TrackInfo[];
  audioTracks: TrackInfo[];
  subtitleTracks: TrackInfo[];
  chapters?: ChapterInfo[];
  attachments?: AttachmentInfo[]; // Fonts for subtitles
}

export interface ChapterInfo {
  startTime: number;
  endTime: number;
  title?: string;
}

export interface AttachmentInfo {
  name: string;
  mimeType: string;
  data: Uint8Array;
}

/**
 * Unified stream interface - enables handling of different source types uniformly
 */
export interface VideoStream {
  /**
   * Get the type of stream
   */
  type(): StreamType;

  /**
   * Get the stream URL or identifier
   */
  getUrl(): string;

  /**
   * Get the content type (e.g., 'video/mp4', 'video/x-matroska')
   */
  getContentType(): Promise<string>;

  /**
   * Get detailed playback information
   */
  getPlaybackInfo(): Promise<PlaybackInfo>;

  /**
   * Get video metadata (tracks, chapters, etc.)
   */
  getMetadata(): Promise<VideoMetadata>;

  /**
   * Check if stream supports range requests (for seeking)
   */
  supportsRangeRequests(): boolean;

  /**
   * Called when stream error occurs
   */
  onError(error: Error): void;

  /**
   * Terminate stream and cleanup resources
   */
  terminate(): Promise<void>;
}

/**
 * Base implementation for local file streams
 */
export class LocalFileStream implements VideoStream {
  constructor(private filePath: string) {}

  type(): StreamType {
    return 'local-file';
  }

  getUrl(): string {
    return this.filePath;
  }

  async getContentType(): Promise<string> {
    // Implement based on file extension or MIME type detection
    return 'video/x-matroska'; // Example
  }

  async getPlaybackInfo(): Promise<PlaybackInfo> {
    // Get file metadata
    return {
      contentType: await this.getContentType(),
      canSeek: true
    };
  }

  async getMetadata(): Promise<VideoMetadata> {
    // Parse metadata from file (MKV, MP4, etc.)
    return {
      duration: 0,
      videoTracks: [],
      audioTracks: [],
      subtitleTracks: []
    };
  }

  supportsRangeRequests(): boolean {
    return true;
  }

  onError(error: Error): void {
    console.error('Local file stream error:', error);
  }

  async terminate(): Promise<void> {
    // Cleanup if needed
  }
}

/**
 * HTTP stream implementation
 */
export class HTTPStream implements VideoStream {
  constructor(private url: string) {}

  type(): StreamType {
    return 'http';
  }

  getUrl(): string {
    return this.url;
  }

  async getContentType(): Promise<string> {
    // Fetch content type from HTTP headers
    return 'video/x-matroska'; // Example
  }

  async getPlaybackInfo(): Promise<PlaybackInfo> {
    // Get file size and other info from headers
    return {
      contentType: await this.getContentType(),
      canSeek: this.supportsRangeRequests()
    };
  }

  async getMetadata(): Promise<VideoMetadata> {
    // Parse metadata from HTTP stream
    return {
      duration: 0,
      videoTracks: [],
      audioTracks: [],
      subtitleTracks: []
    };
  }

  supportsRangeRequests(): boolean {
    // Check if server supports Range header
    return true;
  }

  onError(error: Error): void {
    console.error('HTTP stream error:', error);
  }

  async terminate(): Promise<void> {
    // Cancel HTTP requests if needed
  }
}
