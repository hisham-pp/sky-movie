/**
 * Media file metadata extraction and track management
 * Handles MKV and other container formats
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

export interface MediaTrack {
  index: number;
  type: 'video' | 'audio' | 'subtitle';
  codec: string;
  language?: string;
  title?: string;
  default: boolean;
  enabled: boolean;
}

export interface MediaMetadata {
  duration: number;
  videoTracks: MediaTrack[];
  audioTracks: MediaTrack[];
  subtitleTracks: MediaTrack[];
}

/**
 * Check if ffprobe is available in system PATH
 */
export function isFFProbeAvailable(): boolean {
  try {
    execSync('ffprobe -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract metadata from media file using ffprobe
 * Requires ffmpeg/ffprobe to be installed on system
 */
export function extractMediaMetadata(filePath: string): MediaMetadata {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  if (!isFFProbeAvailable()) {
    // Return empty metadata if ffprobe not available
    console.warn('ffprobe not available, metadata extraction skipped');
    return {
      duration: 0,
      videoTracks: [],
      audioTracks: [],
      subtitleTracks: []
    };
  }

  try {
    // Run ffprobe to get JSON output
    const output = execSync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );

    const data = JSON.parse(output);
    const streams = data.streams || [];
    const format = data.format || {};

    const metadata: MediaMetadata = {
      duration: Math.floor(parseFloat(format.duration) || 0),
      videoTracks: [],
      audioTracks: [],
      subtitleTracks: []
    };

    streams.forEach((stream: any, index: number) => {
      const track: MediaTrack = {
        index: stream.index || index,
        type: stream.codec_type as 'video' | 'audio' | 'subtitle',
        codec: stream.codec_name || stream.codec_type,
        language: stream.tags?.language || 'unknown',
        title: stream.tags?.title,
        default: stream.disposition?.default === 1,
        enabled: stream.disposition?.default === 1
      };

      if (stream.codec_type === 'video') {
        metadata.videoTracks.push(track);
      } else if (stream.codec_type === 'audio') {
        metadata.audioTracks.push(track);
      } else if (stream.codec_type === 'subtitle') {
        metadata.subtitleTracks.push(track);
      }
    });

    return metadata;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {
      duration: 0,
      videoTracks: [],
      audioTracks: [],
      subtitleTracks: []
    };
  }
}

/**
 * Check if file is MKV (Matroska) container
 */
export function isMKVFile(filePath: string): boolean {
  return filePath.toLowerCase().endsWith('.mkv');
}

/**
 * Get file extension
 */
export function getFileExtension(filePath: string): string {
  return filePath.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file format needs special handling
 */
export function needsSpecialHandling(filePath: string): boolean {
  const ext = getFileExtension(filePath);
  // Formats that may have multiple tracks or need special handling
  return ['mkv', 'webm', 'avi', 'mov', 'flv', 'mts', 'm2ts'].includes(ext);
}
