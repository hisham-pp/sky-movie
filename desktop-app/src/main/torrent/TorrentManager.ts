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
import { MalayalamProvider } from './providers/MalayalamProvider';
import { HindiProvider } from './providers/HindiProvider';
import type { TorrentProvider } from './providers/TorrentProvider';
import type { TorrentService } from './TorrentService';

const SETTINGS_FILE = 'torrent-settings.json';
const STATE_FILE    = 'torrent-state.json';

// Strong adult/NSFW signal tokens — deliberately specific so mainstream
// titles ("Sex Education", "Blackadder") are not caught. Matched case-
// insensitively against a result's title / uploader / source.
const ADULT_PATTERNS = [
  /\bxxx\b/i, /\bporn/i, /\bhentai\b/i, /\bmilf\b/i, /\banal\b/i, /\bbdsm\b/i,
  /\bgangbang\b/i, /\bcreampie\b/i, /\bcumshot\b/i, /\bdeepthroat\b/i,
  /\bblowjob\b/i, /\bhardcore\b/i, /\bbrazzers\b/i, /\bnaughtyamerica\b/i,
  /\bonlyfans\b/i, /\bpornhub\b/i, /\bxvideos\b/i, /\bxnxx\b/i, /\bredtube\b/i,
  /\bblacked\b/i, /\btushy\b/i, /\bbangbros\b/i, /\bjav\b/i, /\bsextape\b/i,
  /\bnsfw\b/i, /\b18\+/, /\berotica?\b/i,
];

function isAdultResult(r: TorrentSearchResult): boolean {
  const haystack = `${r.title} ${r.uploader ?? ''} ${r.source ?? ''}`;
  return ADULT_PATTERNS.some((re) => re.test(haystack));
}

/** Minimum info needed to restore an active torrent across restarts. */
interface PersistedActiveTorrent {
  magnetUri: string;
  savePath:  string;
  category:  TorrentInfo['category'];
  addedAt:   string;
}

interface PersistedState {
  active:    PersistedActiveTorrent[];
  completed: TorrentInfo[];
}

export class TorrentManager {
  private service: TorrentService | null = null;
  private initPromise: Promise<void> | null = null;

  private readonly providers: TorrentProvider[];
  private readonly stateDir: string;
  private settings: TorrentSettings;

  /** Active entries persisted to disk (survives restarts). */
  private activePersisted: PersistedActiveTorrent[] = [];
  /** Completed entries persisted to disk. */
  private completedTorrents: TorrentInfo[] = [];

  private progressListeners: Array<(info: TorrentInfo) => void> = [];

  /** True while a video is playing — transfer limits are capped to protect playback. */
  private playbackThrottleActive = false;

  constructor(stateDir: string) {
    this.stateDir  = stateDir;
    mkdirSync(stateDir, { recursive: true });
    this.settings  = this.loadSettings();
    this.providers = [new YtsProvider(), new TpbProvider(), new EztvProvider(), new HindiProvider(), new MalayalamProvider()];
    this.loadState();
    console.log('[TorrentManager] created — engine not started yet');

    // Boot immediately if there are active torrents waiting to be restored
    if (this.activePersisted.length > 0) {
      console.log(`[TorrentManager] ${this.activePersisted.length} active torrent(s) pending restore — booting engine early`);
      this.ensureInit().catch((err) => console.error('[TorrentManager] early boot failed', err));
    }
  }

  // ── Lazy engine init ───────────────────────────────────────────────────────

  private ensureInit(): Promise<void> {
    if (this.service) return Promise.resolve();
    if (!this.initPromise) this.initPromise = this.bootEngine();
    return this.initPromise;
  }

  private async bootEngine(): Promise<void> {
    console.log('[TorrentManager] booting WebTorrent engine…');
    const { TorrentService } = await import('./TorrentService');
    const svc = new TorrentService(this.settings);
    await svc.init();

    svc.on('done', (info: TorrentInfo) => {
      // Rename file to match app naming convention
      const renamed = renameTorrentFile(info);
      if (renamed) {
        console.log(`[TorrentManager] renamed → "${renamed.newName}"`);
        for (const f of info.files) {
          if (f.path.endsWith(renamed.originalPath.split(/[\\/]/).pop() ?? '')) {
            f.path = renamed.renamedPath.replace(info.savePath, '').replace(/^[\\/]/, '');
            f.name = renamed.newName;
          }
        }
        info.name = renamed.newName.replace(/\.[^.]+$/, '');
      }

      // Move from active → completed persistence (cap at 200 most-recent)
      this.activePersisted = this.activePersisted.filter((a) => !info.magnetUri.includes(a.magnetUri) && !a.magnetUri.includes(info.infoHash));
      this.completedTorrents.unshift(info);
      if (this.completedTorrents.length > 200) this.completedTorrents = this.completedTorrents.slice(0, 200);
      this.saveState();

      new Notification({ title: 'Download Complete', body: info.name }).show();
    });

    svc.on('progress', (info: TorrentInfo) => {
      for (const cb of this.progressListeners) cb(info);
    });

    this.service = svc;

    // A video may already be playing (engine boots lazily) — apply caps now
    if (this.playbackThrottleActive) this.applyEffectiveLimits();

    // Restore active torrents from previous session
    if (this.activePersisted.length > 0) {
      // Guard: if a torrent already completed (possibly in a prior session that
      // crashed before saveState ran), skip it and clean up the stale entry.
      const completedHashes = new Set(
        this.completedTorrents.map((t) => t.infoHash.toLowerCase())
      );
      let staleRemoved = false;
      const toRestore = this.activePersisted.filter((entry) => {
        const hash = this.extractHash(entry.magnetUri);
        if (completedHashes.has(hash)) {
          console.log(`[TorrentManager] skipping already-completed torrent ${hash}`);
          this.activePersisted = this.activePersisted.filter((a) => a !== entry);
          staleRemoved = true;
          return false;
        }
        return true;
      });
      if (staleRemoved) this.saveState();

      console.log(`[TorrentManager] restoring ${toRestore.length} active torrent(s)…`);
      for (const entry of toRestore) {
        svc.addMagnet(entry.magnetUri, {
          savePath:  entry.savePath,
          category:  entry.category,
          paused:    false,
          addedAt:   entry.addedAt,
        }).catch((err) => {
          console.error('[TorrentManager] failed to restore torrent', err);
          this.activePersisted = this.activePersisted.filter((a) => a.magnetUri !== entry.magnetUri);
          this.saveState();
        });
      }
    }

    console.log('[TorrentManager] engine ready');
  }

  // ── Search (no engine needed) ──────────────────────────────────────────────

  async search(req: TorrentSearchRequest): Promise<TorrentSearchResult[]> {
    const settled = await Promise.allSettled(this.providers.map((p) => p.search(req)));
    const results: TorrentSearchResult[] = [];
    for (const s of settled) {
      if (s.status === 'fulfilled') results.push(...s.value);
    }
    const hideAdult = !this.settings.showAdultContent;
    const seen = new Set<string>();
    return results.filter((r) => {
      if (hideAdult && isAdultResult(r)) return false;
      const hash = this.extractHash(r.magnetUri);
      if (seen.has(hash)) return false;
      seen.add(hash);
      return true;
    });
  }

  // ── Download control ───────────────────────────────────────────────────────

  async addMagnet(req: AddMagnetRequest): Promise<TorrentInfo> {
    await this.ensureInit();

    const savePath = req.savePath ?? this.settings.downloadPath;
    const category = req.category ?? 'other';

    const info = await this.service!.addMagnet(req.magnetUri, {
      savePath,
      category,
      paused:  req.paused ?? !this.settings.autoStart,
    });

    // Persist so we can restore after restart
    const already = this.activePersisted.some((a) => a.magnetUri === req.magnetUri || req.magnetUri.includes(info.infoHash));
    if (!already) {
      this.activePersisted.push({ magnetUri: req.magnetUri, savePath, category, addedAt: info.addedAt });
      this.saveState();
    }

    new Notification({ title: 'Download Started', body: info.name }).show();
    return info;
  }

  async pause(id: string): Promise<void>  { await this.ensureInit(); this.service!.pause(id); }
  async resume(id: string): Promise<void> { await this.ensureInit(); this.service!.resume(id); }

  async remove(id: string): Promise<void> {
    await this.ensureInit();
    await this.service!.remove(id, false);
    this.removePersisted(id);
    this.completedTorrents = this.completedTorrents.filter((t) => t.id !== id);
    this.saveState();
  }

  async deleteFiles(id: string): Promise<void> {
    await this.ensureInit();
    await this.service!.remove(id, true);
    this.removePersisted(id);
    this.completedTorrents = this.completedTorrents.filter((t) => t.id !== id);
    this.saveState();
  }

  move(_req: TorrentMoveRequest): void {
    console.warn('[TorrentManager] move not yet implemented');
  }

  async recheck(id: string): Promise<void> {
    await this.ensureInit();
    this.service!.pause(id);
    setTimeout(() => this.service!.resume(id), 500);
  }

  openFolder(id: string): void {
    const info = this.list().find((t) => t.id === id);
    if (info) shell.openPath(info.savePath);
  }

  // ── Queries ────────────────────────────────────────────────────────────────

  /**
   * Returns ALL torrents — active (from engine) + completed (from disk).
   * This is the single source of truth for the UI.
   */
  list(): TorrentInfo[] {
    const active = this.service?.list() ?? [];
    const activeIds = new Set(active.map((t) => t.id));

    // While the engine is still booting, surface persisted active torrents as
    // placeholder entries so the UI shows them immediately instead of blank.
    const restoringStubs: TorrentInfo[] = this.service
      ? []
      : this.activePersisted
          .filter((a) => !activeIds.has(this.extractHash(a.magnetUri)))
          .map((a) => this.stubFromPersisted(a));

    const completed = this.completedTorrents.filter((t) => !activeIds.has(t.id));
    return [...active, ...restoringStubs, ...completed];
  }

  private stubFromPersisted(a: PersistedActiveTorrent): TorrentInfo {
    const hash = this.extractHash(a.magnetUri);
    return {
      id:            hash,
      name:          hash,
      infoHash:      hash,
      magnetUri:     a.magnetUri,
      savePath:      a.savePath,
      category:      a.category,
      addedAt:       a.addedAt,
      completedAt:   null,
      status:        'metadata',
      progress:      0,
      downloadSpeed: 0,
      uploadSpeed:   0,
      downloaded:    0,
      uploaded:      0,
      totalSize:     0,
      numPeers:      0,
      numSeeds:      0,
      eta:           0,
      ratio:         0,
      files:         [],
      error:         null,
      posterPath:    null,
      tmdbId:        null,
    };
  }

  stats(): TorrentGlobalStats {
    const gs  = this.service?.globalStats() ?? { downloadSpeed: 0, uploadSpeed: 0 };
    const all = this.list();
    return {
      ...gs,
      activeTorrents: all.filter((t) => t.status === 'downloading' || t.status === 'metadata').length,
      totalTorrents:  all.length,
    };
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  getSettings(): TorrentSettings { return this.settings; }

  updateSettings(patch: Partial<TorrentSettings>): TorrentSettings {
    this.settings = { ...this.settings, ...patch };
    this.service?.updateSettings(this.settings);
    // updateSettings applies raw limits — reinstate the playback caps if a video is playing
    if (this.playbackThrottleActive) this.applyEffectiveLimits();
    this.saveSettings();
    return this.settings;
  }

  /** Throttle transfers while video is playing; restore configured limits when done. */
  setPlaybackThrottle(active: boolean): void {
    if (this.playbackThrottleActive === active) return;
    this.playbackThrottleActive = active;
    if (!this.service) return; // engine not booted — nothing to throttle
    this.applyEffectiveLimits();
    console.log(`[TorrentManager] playback throttle ${active ? 'ON' : 'OFF'}`);
  }

  /**
   * Applies download/upload limits, folding in the playback throttle when a
   * video is playing. Upload is capped hard during playback — saturated
   * upstream delays TCP ACKs and stalls both streaming and the download.
   */
  private applyEffectiveLimits(): void {
    // Caps during playback: leave bandwidth and disk I/O for the video
    const playbackDownCap = 512 * 1024; // 512 KB/s
    const playbackUpCap   = 64 * 1024;  // 64 KB/s
    const cfgDown = this.settings.downloadSpeedLimit > 0 ? this.settings.downloadSpeedLimit : -1;
    const cfgUp   = this.settings.uploadSpeedLimit   > 0 ? this.settings.uploadSpeedLimit   : -1;

    const down = this.playbackThrottleActive
      ? (cfgDown === -1 ? playbackDownCap : Math.min(cfgDown, playbackDownCap))
      : cfgDown;
    const up = this.playbackThrottleActive
      ? (cfgUp === -1 ? playbackUpCap : Math.min(cfgUp, playbackUpCap))
      : cfgUp;

    this.service?.applyDownloadLimit(down);
    this.service?.applyUploadLimit(up);
  }

  // ── Progress listeners ─────────────────────────────────────────────────────

  onProgress(cb: (info: TorrentInfo) => void): () => void {
    this.progressListeners.push(cb);
    return () => { this.progressListeners = this.progressListeners.filter((l) => l !== cb); };
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  async destroy(): Promise<void> {
    this.progressListeners = [];
    if (this.service) await this.service.destroy();
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private removePersisted(id: string): void {
    // id is infoHash; active entries only have magnetUri, so check both
    this.activePersisted = this.activePersisted.filter(
      (a) => !a.magnetUri.toLowerCase().includes(id.toLowerCase())
    );
  }

  private settingsPath(): string { return join(this.stateDir, SETTINGS_FILE); }
  private statePath():    string { return join(this.stateDir, STATE_FILE); }

  private loadSettings(): TorrentSettings {
    const defaults: TorrentSettings = {
      downloadPath:             join(app.getPath('downloads'), 'Sky Movie'),
      maxSimultaneousDownloads: 3,
      maxActiveTorrents:        5,
      downloadSpeedLimit:       0,
      uploadSpeedLimit:         0,
      sequentialDownload:       false,
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
      showAdultContent:         false,
    };
    try {
      if (existsSync(this.settingsPath())) {
        const saved = JSON.parse(readFileSync(this.settingsPath(), 'utf8')) as Partial<TorrentSettings>;
        return { ...defaults, ...saved };
      }
    } catch { /* ignore */ }
    return defaults;
  }

  private saveSettings(): void {
    try { writeFileSync(this.settingsPath(), JSON.stringify(this.settings, null, 2)); }
    catch (e) { console.error('[TorrentManager] save settings failed', e); }
  }

  private loadState(): void {
    try {
      if (existsSync(this.statePath())) {
        const s: PersistedState = JSON.parse(readFileSync(this.statePath(), 'utf8'));
        this.activePersisted   = s.active    ?? [];
        this.completedTorrents = s.completed ?? [];
      }
    } catch { /* ignore */ }
  }

  private saveState(): void {
    try {
      writeFileSync(this.statePath(), JSON.stringify({
        active:    this.activePersisted,
        completed: this.completedTorrents,
      } satisfies PersistedState, null, 2));
    } catch (e) { console.error('[TorrentManager] save state failed', e); }
  }

  private extractHash(magnetUri: string): string {
    const m = magnetUri.match(/xt=urn:btih:([a-fA-F0-9]+)/i);
    return m ? m[1].toLowerCase() : magnetUri;
  }
}
