import { randomUUID } from 'node:crypto';
import type { AppSettings, AppTheme, LibraryScanMode, MatcherStrategy, PlayerStyle } from '../../shared/ipc';
import type { SqliteDatabase } from '../database/client';
import { defaultSettings } from './rowMappers';

const VALID_PLAYER_STYLES = new Set<PlayerStyle>(['default', 'youtube']);
const VALID_THEMES = new Set<AppTheme>([
  'cinema', 'midnight', 'daylight', 'ember', 'ocean', 'forest', 'sunset', 'noir', 'lavender', 'crimson'
]);
const VALID_SCAN_MODES   = new Set<LibraryScanMode>(['mixed', 'movie', 'show']);
const VALID_STRATEGIES   = new Set<MatcherStrategy>(['auto', 'movie-title-year', 'show-season-episode', 'folder-name']);
const VALID_PROVIDERS    = new Set<string>(['local', 'tmdb']);

function sanitize(update: Partial<AppSettings>): Partial<AppSettings> {
  const out = { ...update };
  if (out.theme         !== undefined && !VALID_THEMES.has(out.theme))        delete out.theme;
  if (out.playerStyle   !== undefined && !VALID_PLAYER_STYLES.has(out.playerStyle)) delete out.playerStyle;
  if (out.defaultScanMode !== undefined && !VALID_SCAN_MODES.has(out.defaultScanMode)) delete out.defaultScanMode;
  if (out.defaultMatcherStrategy !== undefined && !VALID_STRATEGIES.has(out.defaultMatcherStrategy)) delete out.defaultMatcherStrategy;
  if (out.metadataProvider !== undefined && !VALID_PROVIDERS.has(out.metadataProvider)) delete out.metadataProvider;
  // Coerce booleans so stringified "true"/"false" from renderer don't leak through
  if (out.autoScan        !== undefined) out.autoScan        = Boolean(out.autoScan);
  if (out.watchFolders    !== undefined) out.watchFolders    = Boolean(out.watchFolders);
  if (out.extractFileMetadata !== undefined) out.extractFileMetadata = Boolean(out.extractFileMetadata);
  if (out.autoDownloadUpdates !== undefined) out.autoDownloadUpdates = Boolean(out.autoDownloadUpdates);
  if (out.hideSidebar         !== undefined) out.hideSidebar         = Boolean(out.hideSidebar);
  if (out.defaultSyncIncludesFiles !== undefined) out.defaultSyncIncludesFiles = Boolean(out.defaultSyncIncludesFiles);
  if (out.hardwareAcceleration !== undefined) out.hardwareAcceleration = Boolean(out.hardwareAcceleration);
  if (out.resumePlayback       !== undefined) out.resumePlayback       = Boolean(out.resumePlayback);
  if (out.autoPlayNextEpisode  !== undefined) out.autoPlayNextEpisode  = Boolean(out.autoPlayNextEpisode);
  if (out.onboardingCompleted  !== undefined) out.onboardingCompleted  = Boolean(out.onboardingCompleted);
  // onboardingStep: clamp to the six-step flow (0–5)
  if (out.onboardingStep !== undefined) {
    const step = Number(out.onboardingStep);
    out.onboardingStep = Number.isFinite(step) ? Math.min(5, Math.max(0, Math.trunc(step))) : 0;
  }
  // libraryFolders must be a string array
  if (out.libraryFolders !== undefined) {
    out.libraryFolders = Array.isArray(out.libraryFolders)
      ? out.libraryFolders.filter((f): f is string => typeof f === 'string')
      : undefined as unknown as string[];
  }
  return out;
}

export class SettingsService {
  constructor(private readonly db: SqliteDatabase) {}

  getSettings(): AppSettings {
    const existing = this.db.prepare('SELECT value FROM app_settings WHERE key = ?').get('settings') as
      | { value: string }
      | undefined;

    if (existing) {
      try {
        return { ...defaultSettings(randomUUID()), ...JSON.parse(existing.value) };
      } catch {
        // Corrupt JSON — fall through to create fresh defaults
      }
    }

    const settings = defaultSettings(randomUUID());
    this.save(settings);
    return settings;
  }

  updateSettings(update: Partial<AppSettings>): AppSettings {
    const next = { ...this.getSettings(), ...sanitize(update) };
    this.save(next);
    return next;
  }

  private save(settings: AppSettings): void {
    this.db
      .prepare(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES ('settings', ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
      )
      .run(JSON.stringify(settings), new Date().toISOString());
  }
}
