import { renameSync, existsSync } from 'node:fs';
import { join, extname, dirname, basename } from 'node:path';
import type { TorrentFileInfo, TorrentInfo } from '../../shared/ipc';

const VIDEO_EXTENSIONS = new Set(['.mkv', '.mp4', '.avi', '.mov', '.wmv', '.m4v', '.webm', '.flv', '.ts', '.m2ts']);

// Tags that are never part of a clean title
const NOISE_TAGS = [
  '1080p', '2160p', '4k', '720p', '480p',
  'bluray', 'blu-ray', 'webrip', 'web-dl', 'webdl', 'hdtv', 'dvdrip',
  'x264', 'x265', 'h264', 'h265', 'hevc', 'avc',
  'aac', 'ac3', 'dts', 'dd5', 'dd2',
  'hdr', 'hdr10', 'dolby', 'atmos',
  'yts', 'yify', 'rarbg', 'eztv',
  'extended', 'remastered', 'proper', 'repack',
  'multi', 'dual', 'hindi', 'dubbed',
];

const NOISE_PATTERN = new RegExp(
  `\\b(${NOISE_TAGS.join('|')})\\b`,
  'gi'
);

/** Mirrors libraryScanner.cleanTitle */
function cleanTitle(raw: string): string {
  return raw
    .replace(/\([^)]*\)/g, ' ')   // remove parenthetical groups
    .replace(/\[[^\]]*\]/g, ' ')   // remove bracket groups
    .replace(NOISE_PATTERN, ' ')
    .replace(/[._\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function sanitizeFilename(name: string): string {
  // Strip characters illegal on Windows/macOS/Linux
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim();
}

function parseYear(text: string): number | null {
  const m = text.match(/\b((?:19|20)\d{2})\b/);
  return m ? Number(m[1]) : null;
}

function parseShowEpisode(text: string): { season: number; episode: number } | null {
  const m = text.match(/s(\d{1,2})e(\d{1,2})/i);
  if (m) return { season: Number(m[1]), episode: Number(m[2]) };
  // Alternative: 1x01
  const alt = text.match(/(\d{1,2})x(\d{1,2})/i);
  if (alt) return { season: Number(alt[1]), episode: Number(alt[2]) };
  return null;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export interface RenameResult {
  originalPath: string;
  renamedPath: string;
  newName: string;
}

/**
 * Determines the target filename for a torrent's main video file.
 * Format:
 *   Movie   → "Title (Year).ext"  or  "Title.ext"
 *   TV Show → "Show Name S01E01.ext"
 */
export function buildTargetName(
  rawName: string,
  ext: string,
  category: TorrentInfo['category']
): string {
  const year  = parseYear(rawName);
  const epInfo = parseShowEpisode(rawName);
  const title = cleanTitle(
    // Strip the year and SxxExx portion before cleaning so they don't end up in the title
    rawName
      .replace(/\b(?:19|20)\d{2}\b/, '')
      .replace(/s\d{1,2}e\d{1,2}/gi, '')
  );

  if (category === 'tv' || category === 'anime' || epInfo) {
    const s = epInfo ? pad2(epInfo.season) : '01';
    const e = epInfo ? pad2(epInfo.episode) : '01';
    return sanitizeFilename(`${title} S${s}E${e}${ext}`);
  }

  if (year) {
    return sanitizeFilename(`${title} (${year})${ext}`);
  }

  return sanitizeFilename(`${title}${ext}`);
}

/**
 * Picks the primary video file from the torrent's file list —
 * the largest video file wins (it's almost always the main feature).
 */
export function pickMainVideoFile(files: TorrentFileInfo[]): TorrentFileInfo | null {
  return files
    .filter((f) => VIDEO_EXTENSIONS.has(extname(f.name).toLowerCase()))
    .sort((a, b) => b.size - a.size)[0] ?? null;
}

/**
 * Renames the main video file of a completed torrent to match the app's
 * naming convention. Returns the result, or null if nothing was renamed
 * (e.g. file not found, already has the right name, no video file).
 */
export function renameTorrentFile(info: TorrentInfo): RenameResult | null {
  const mainFile = pickMainVideoFile(info.files);
  if (!mainFile) return null;

  const ext         = extname(mainFile.name).toLowerCase();
  const targetName  = buildTargetName(info.name, ext, info.category);
  const dir         = dirname(join(info.savePath, mainFile.path));
  const currentPath = join(info.savePath, mainFile.path);
  const targetPath  = join(dir, targetName);

  // Already has the right name
  if (basename(currentPath) === targetName) return null;

  if (!existsSync(currentPath)) return null;

  // Don't overwrite an existing file
  if (existsSync(targetPath)) return null;

  try {
    renameSync(currentPath, targetPath);
    return { originalPath: currentPath, renamedPath: targetPath, newName: targetName };
  } catch (err) {
    console.error('[TorrentRenamer] rename failed', err);
    return null;
  }
}
