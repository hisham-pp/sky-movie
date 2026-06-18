import { randomUUID } from 'node:crypto';
import type { AppSettings } from '../../shared/ipc';
import type { SqliteDatabase } from '../database/client';
import { defaultSettings } from './rowMappers';

export class SettingsService {
  constructor(private readonly db: SqliteDatabase) {}

  getSettings(): AppSettings {
    const existing = this.db.prepare('SELECT value FROM app_settings WHERE key = ?').get('settings') as
      | { value: string }
      | undefined;

    if (existing) {
      return { ...defaultSettings(randomUUID()), ...JSON.parse(existing.value) };
    }

    const settings = defaultSettings(randomUUID());
    this.save(settings);
    return settings;
  }

  updateSettings(update: Partial<AppSettings>): AppSettings {
    const next = { ...this.getSettings(), ...update };
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
