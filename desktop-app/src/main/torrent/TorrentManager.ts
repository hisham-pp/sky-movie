import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { app, shell, Notification } from 'electron';
import type {
  AddMagnetRequest,
  TorrentGlobalStats,
  TorrentInfo,
  TorrentMoveRequest,
  TorrentSearchRequest,
  TorrentSearchResult,
  TorrentSettings,
} from '../../shared/ipc';
import { renameTorrentFile } from './TorrentRenamer';
import { YtsProvider } from './providers/YtsProvider';
import { TpbProvider } from './providers/TpbProvider';
import { EztvProvider } from './providers/EztvProvider';
import type { TorrentProvider } from './providers/TorrentProvider';
import type { TorrentService } from './TorrentService';

const SETTINGS_FILE = 'torrent-settings.json';
const STATE_FILE    = 'torrent-state.json';

interface PersistedState {
  completed: TorrentInfo[];
}

export class TorrentManager {
  /** Populated lazily — null until first torrent IPC call. */
  private service: TorrentService | null = null;
  /** Resolves when service is fully ready; avoids double-init on concurrent calls. */
  private initPromise: Promise<void> | null = null;

  private readonly providers: TorrentProvider[];
  private readonly stateDir: string;
  private settings: TorrentSettings;
  private completedTorrents: TorrentInfo[] = [];
  private progressListeners: Array<(info: TorrentInfo) => void> = [];

  constructor(stateDir: string) {
    this.stateDir = stateDir;
    mkdirSync(stateDir, { recursive: true });

    // Settings and state load synchronously — cheap, no WebTorrent yet.
    this.settings  = this.loadSettings();
    this.loadState();

    // Search providers are pure HTTP — also fine to create eagerly.
    this.providers = [new YtsProvider(), new TpbProvider(), new EztvProvider()];

    console.log('[TorrentManager] created (torrent engine NOT started yet)');
  }

  /**
   * Boots WebTorrent the first time any torrent action is needed.
   * Subsequent calls return immediately once the engine is running.
   */
  private ensureInit(): Promise<void> {
    if (this.service) return Promise.resolve();

    if (!this.initPromise) {
      this.initPromise = this.bootEngine();
    }

    return this.initPromise;
  }

  private async bootEngine(): Promise<void> {
    console.log('[TorrentManager] lazily starting WebTorrent engine…');

    // Dynamic import keeps WebTorrent out of the cold-start require graph.
    const { TorrentService } = await import('./TorrentService');
    const svc = new TorrentService(this.settings);
    await svc.init();

    svc.on('done', (info: TorrentInfo) => {
      const renameResult = renameTorrentFile(info);
      if (renameResult) {
        console.log(`[TorrentManager] renamed → "${renameResult.newName}"`);
        for (const f of info.files) {
          if (f.path.endsWith(renameResult.originalPath.split(/[\\/]/).pop() ?? '')) {
            f.path = renameResult.renamedPath.replace(info.savePath, '').replace(/^[\\/]/, '');
            f.name = renameResult.newName;
          }
        }
        info.name = renameResult.newName.replace(/\.[^.]+$/, '');
      }

      this.completedTorrents.unshift(info);
      this.saveState();
      new Notification({ title: 'Download Complete', body: info.name }).show();
    });

    svc.on('progress', (info: TorrentInfo) => {
      for (const cb of this.progressListeners) cb(info);
    });

    this.service = svc;
    console.log('[TorrentManager] WebTorrent engine ready');
  }

  // ── Search (no engine needed — pure HTTP) ──────────────────────────────────

  async search(req: TorrentSearchRequest): Promise<TorrentSearchResult[]> {
    const settled = await Promise.allSettled(this.providers.map((p) => p.search(req)));

    const results: TorrentSearchResult[] = [];
    for (const s of settled) {
      if (s.status === 'fulfilled') results.push(...s.value);
    }

    const seen = new Set<string>();
    return results.filter((r) => {
      const hash = this.extractHash(r.magnetUri);
      if (seen.has(hash)) return false;
      seen.add(hash);
      return true;
    });
  }

  // ── Download control (engine required) ────────────────────────────────────

  async addMagnet(req: AddMagnetRequest): Promise<TorrentInfo> {
    await this.ensureInit();
    const info = await this.service!.addMagnet(req.magnetUri, {
      savePath:   req.savePath ?? this.settings.downloadPath,
      sequential: req.sequential,
      category:   req.category,
      paused:     req.paused ?? !this.settings.autoStart,
    });
    new Notification({ title: 'Download Started', body: info.name }).show();
    return info;
  }

  async pause(id: string): Promise<void> {
    await this.ensureInit();
    this.service!.pause(id);
  }

  async resume(id: string): Promise<void> {
    await this.ensureInit();
    this.service!.resume(id);
  }

  async remove(id: string): Promise<void> {
    await this.ensureInit();
    await this.service!.remove(id, false);
    this.completedTorrents = this.completedTorrents.filter((t) => t.id !== id);
    this.saveState();
  }

  async deleteFiles(id: string): Promise<void> {
    await this.ensureInit();
    await this.service!.remove(id, true);
    this.completedTorrents = this.completedTorrents.filter((t) => t.id !== id);
    this.saveState();
  }

  move(_req: TorrentMoveRequest): void {
    console.warn('[TorrentManager] move not fully implemented yet');
  }

  async recheck(id: string): Promise<void> {
    await this.ensureInit();
    this.service!.pause(id);
    setTimeout(() => this.service!.resume(id), 500);
  }

  openFolder(id: string): void {
    const info = this.list().find((t) => t.id === id)
      ?? this.completedTorrents.find((t) => t.id === id);
    if (info) shell.openPath(info.savePath);
  }

  // ── Queries ────────────────────────────────────────────────────────────────

  list(): TorrentInfo[] {
    // Engine not started yet — active list is empty, that's correct.
    return this.service?.list() ?? [];
  }

  completedList(): TorrentInfo[] {
    return this.completedTorrents;
  }

  stats(): TorrentGlobalStats {
    const gs   = this.service?.globalStats() ?? { downloadSpeed: 0, uploadSpeed: 0 };
    const all  = this.list();
    return {
      ...gs,
      activeTorrents: all.filter((t) => t.status === 'downloading').length,
      totalTorrents:  all.length + this.completedTorrents.length,
    };
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  getSettings(): TorrentSettings { return this.settings; }

  updateSettings(patch: Partial<TorrentSettings>): TorrentSettings {
    this.settings = { ...this.settings, ...patch };
    this.service?.updateSettings(this.settings);
    this.saveSettings();
    return this.settings;
  }

  // ── Progress listeners ─────────────────────────────────────────────────────

  onProgress(cb: (info: TorrentInfo) => void): () => void {
    this.progressListeners.push(cb);
    return () => {
      this.progressListeners = this.progressListeners.filter((l) => l !== cb);
    };
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  async destroy(): Promise<void> {
    this.progressListeners = [];
    if (this.service) await this.service.destroy();
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private settingsPath(): string { return join(this.stateDir, SETTINGS_FILE); }
  private statePath():    string { return join(this.stateDir, STATE_FILE); }

  private loadSettings(): TorrentSettings {
    const defaults: TorrentSettings = {
      downloadPath:             join(app.getPath('downloads'), 'Sky Movie'),
      maxSimultaneousDownloads: 3,
      maxActiveTorrents:        5,
      downloadSpeedLimit:       0,
      uploadSpeedLimit:         0,
      sequentialDownload:       true,
      enableDht:                true,
      enablePex:                true,
      enableLsd:                true,
      autoStart:                true,
      autoSeed:                 false,
      seedRatio:                2,
      autoDelete:               false,
      moveCompleted:            false,
      completedPath:            join(app.getPath('downloads'), 'Sky Movie', 'Completed'),
      diskCacheSizeMb:          64,
      port:                     6881,
      maxConnections:           200,
    };

    try {
      if (existsSync(this.settingsPath())) {
        const saved = JSON.parse(readFileSync(this.settingsPath(), 'utf8')) as Partial<TorrentSettings>;
        return { ...defaults, ...saved };
      }
    } catch { /* ignore corrupt file */ }

    return defaults;
  }

  private saveSettings(): void {
    try {
      writeFileSync(this.settingsPath(), JSON.stringify(this.settings, null, 2));
    } catch (e) {
      console.error('[TorrentManager] failed to save settings', e);
    }
  }

  private loadState(): void {
    try {
      if (existsSync(this.statePath())) {
        const s: PersistedState = JSON.parse(readFileSync(this.statePath(), 'utf8'));
        this.completedTorrents = s.completed ?? [];
      }
    } catch { /* ignore */ }
  }

  private saveState(): void {
    try {
      writeFileSync(this.statePath(), JSON.stringify({ completed: this.completedTorrents }, null, 2));
    } catch (e) {
      console.error('[TorrentManager] failed to save state', e);
    }
  }

  private extractHash(magnetUri: string): string {
    const m = magnetUri.match(/xt=urn:btih:([a-fA-F0-9]+)/i);
    return m ? m[1].toLowerCase() : magnetUri;
  }
}
