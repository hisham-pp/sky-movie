import { EventEmitter } from 'node:events';
import { mkdirSync, existsSync } from 'node:fs';
import WebTorrent, { type Torrent, type TorrentFile } from 'webtorrent';
import type { TorrentFileInfo, TorrentInfo, TorrentSettings, TorrentStatus } from '../../shared/ipc';

export class TorrentService extends EventEmitter {
  private client: WebTorrent | null = null;
  private infoMap = new Map<string, TorrentInfo>();
  private progressTimers = new Map<string, ReturnType<typeof setInterval>>();
  private settings: TorrentSettings;

  constructor(settings: TorrentSettings) {
    super();
    this.settings = settings;
    // Prevent Node from throwing on unhandled 'error' events from this emitter
    this.on('error', (err) => console.error('[TorrentService] unhandled error event', err));
  }

  async init(): Promise<void> {
    this.client = new WebTorrent({
      dht:      this.settings.enableDht,
      lsd:      this.settings.enableLsd,
      pex:      this.settings.enablePex,
      maxConns: this.settings.maxConnections,
    });

    this.client.on('error', (err: Error) => {
      console.error('[TorrentService] client error', err);
    });
  }

  async addMagnet(
    magnetUri: string,
    opts: {
      savePath?:  string;
      category?:  TorrentInfo['category'];
      paused?:    boolean;
      addedAt?:   string;
    } = {}
  ): Promise<TorrentInfo> {
    if (!this.client) throw new Error('TorrentService not initialized');

    const savePath = opts.savePath ?? this.settings.downloadPath;
    if (!existsSync(savePath)) mkdirSync(savePath, { recursive: true });

    // Skip duplicate
    const existingTorrent = this.client.torrents.find((t) => t.magnetURI === magnetUri || magnetUri.includes(t.infoHash));
    if (existingTorrent) {
      const existing = this.infoMap.get(existingTorrent.infoHash);
      if (existing) return existing;
    }

    return new Promise<TorrentInfo>((resolve, reject) => {
      // NOTE: do NOT pass `so` (select-only) — invalid in WebTorrent v3 and breaks the add
      const torrent: Torrent = this.client!.add(magnetUri, { path: savePath });

      let resolved = false;

      const doResolve = (status: TorrentStatus) => {
        if (resolved) return;
        resolved = true;
        const info = this.buildInfo(torrent, opts.category ?? 'other', savePath, status, opts.addedAt);
        this.infoMap.set(torrent.infoHash, info);
        this.startProgressPolling(torrent, torrent.infoHash);
        resolve(info);
        this.emit('added', info);
      };

      torrent.on('metadata', () => doResolve('metadata'));

      torrent.on('ready', () => {
        const isPaused = opts.paused ?? false;
        const status: TorrentStatus = isPaused ? 'paused' : 'downloading';

        const info = this.infoMap.get(torrent.infoHash);
        if (info) {
          // Update with real metadata now available
          info.name      = torrent.name || info.name;
          info.totalSize = torrent.length ?? info.totalSize;
          info.status    = status;
          info.files     = this.buildFiles(torrent);
        } else {
          // metadata event didn't fire first — resolve here
          doResolve(status);
        }

        if (isPaused) torrent.pause();
      });

      torrent.on('done', () => {
        const info = this.infoMap.get(torrent.infoHash);
        if (info) {
          info.status      = 'completed';
          info.completedAt = new Date().toISOString();
          info.progress    = 1;
          this.emit('done', { ...info });
          this.emit('progress', { ...info });
          if (!this.settings.autoSeed) torrent.pause();
        }
      });

      torrent.on('error', (err: Error | string) => {
        const msg = err instanceof Error ? err.message : String(err);
        const info = this.infoMap.get(torrent.infoHash);
        if (info) { info.status = 'error'; info.error = msg; }
        this.emit('torrent-error', torrent.infoHash ?? 'unknown', msg);
        if (!resolved) { resolved = true; reject(new Error(msg)); }
      });

      // Resolve with placeholder after 5s if metadata never fires (dead torrent)
      setTimeout(() => doResolve('metadata'), 5_000);
    });
  }

  pause(id: string): void {
    const t = this.findTorrent(id);
    if (!t) return;
    t.pause();
    const info = this.infoMap.get(id);
    if (info) info.status = 'paused';
  }

  resume(id: string): void {
    const t = this.findTorrent(id);
    if (!t) return;
    t.resume();
    const info = this.infoMap.get(id);
    if (info && info.status === 'paused') {
      info.status = info.progress >= 1 ? 'completed' : 'downloading';
    }
  }

  remove(id: string, deleteFiles = false): Promise<void> {
    return new Promise<void>((resolve) => {
      const t = this.findTorrent(id);
      this.clearProgressTimer(id);
      this.infoMap.delete(id);
      if (!t) { resolve(); return; }
      t.destroy({ destroyStore: deleteFiles }, () => resolve());
    });
  }

  list(): TorrentInfo[] {
    return Array.from(this.infoMap.values());
  }

  globalStats(): { downloadSpeed: number; uploadSpeed: number } {
    if (!this.client) return { downloadSpeed: 0, uploadSpeed: 0 };
    return { downloadSpeed: this.client.downloadSpeed, uploadSpeed: this.client.uploadSpeed };
  }

  updateSettings(settings: TorrentSettings): void {
    this.settings = settings;
  }

  async destroy(): Promise<void> {
    for (const id of this.infoMap.keys()) this.clearProgressTimer(id);
    return new Promise<void>((resolve) => {
      if (!this.client) { resolve(); return; }
      this.client.destroy((err) => { if (err) console.error('[TorrentService] destroy error', err); resolve(); });
    });
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private findTorrent(id: string): Torrent | undefined {
    return this.client?.torrents.find((t) => t.infoHash === id);
  }

  private buildInfo(
    torrent: Torrent,
    category: TorrentInfo['category'],
    savePath: string,
    status: TorrentStatus,
    addedAt?: string,
  ): TorrentInfo {
    return {
      id:            torrent.infoHash,
      name:          torrent.name || this.nameFromMagnet(torrent.magnetURI),
      magnetUri:     torrent.magnetURI,
      infoHash:      torrent.infoHash,
      status,
      progress:      torrent.progress ?? 0,
      downloadSpeed: torrent.downloadSpeed ?? 0,
      uploadSpeed:   torrent.uploadSpeed ?? 0,
      downloaded:    torrent.downloaded ?? 0,
      uploaded:      torrent.uploaded ?? 0,
      totalSize:     torrent.length ?? 0,
      numPeers:      torrent.numPeers ?? 0,
      numSeeds:      0,
      ratio:         torrent.ratio ?? 0,
      eta:           torrent.timeRemaining ? torrent.timeRemaining / 1000 : Infinity,
      savePath,
      category,
      addedAt:       addedAt ?? new Date().toISOString(),
      completedAt:   null,
      error:         null,
      files:         this.buildFiles(torrent),
      posterPath:    null,
      tmdbId:        null,
    };
  }

  private buildFiles(torrent: Torrent): TorrentFileInfo[] {
    return (torrent.files ?? []).map((f: TorrentFile) => ({
      name: f.name, path: f.path, size: f.length, progress: f.progress,
    }));
  }

  private startProgressPolling(torrent: Torrent, id: string): void {
    const timer = setInterval(() => {
      const info = this.infoMap.get(id);
      if (!info) { clearInterval(timer); return; }

      info.progress      = torrent.progress ?? 0;
      info.downloadSpeed = torrent.downloadSpeed ?? 0;
      info.uploadSpeed   = torrent.uploadSpeed ?? 0;
      info.downloaded    = torrent.downloaded ?? 0;
      info.uploaded      = torrent.uploaded ?? 0;
      info.numPeers      = torrent.numPeers ?? 0;
      info.ratio         = torrent.ratio ?? 0;
      info.eta           = torrent.timeRemaining ? torrent.timeRemaining / 1000 : Infinity;
      info.files         = this.buildFiles(torrent);

      // Detect stall
      if (info.status === 'downloading' && info.downloadSpeed === 0 && info.numPeers === 0) {
        info.status = 'stalled';
      } else if (info.status === 'stalled' && (info.downloadSpeed > 0 || info.numPeers > 0)) {
        info.status = 'downloading';
      }

      this.emit('progress', { ...info });
    }, 1_000);

    this.progressTimers.set(id, timer);
  }

  private clearProgressTimer(id: string): void {
    const t = this.progressTimers.get(id);
    if (t) { clearInterval(t); this.progressTimers.delete(id); }
  }

  private nameFromMagnet(magnetUri: string): string {
    try {
      return decodeURIComponent(new URLSearchParams(magnetUri.slice(magnetUri.indexOf('?') + 1)).get('dn') ?? '') || 'Unknown';
    } catch { return 'Unknown'; }
  }
}
