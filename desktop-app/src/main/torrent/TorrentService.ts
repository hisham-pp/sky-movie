import { EventEmitter } from 'node:events';
import { mkdirSync, existsSync } from 'node:fs';
import WebTorrent, { type Torrent, type TorrentFile } from 'webtorrent';
import type { TorrentFileInfo, TorrentInfo, TorrentSettings, TorrentStatus } from '../../shared/ipc';
import { EXTRA_TRACKERS_QUERY } from './trackers';

function injectTrackers(magnetUri: string): string {
  return magnetUri + EXTRA_TRACKERS_QUERY;
}

export class TorrentService extends EventEmitter {
  private client: WebTorrent | null = null;
  private infoMap = new Map<string, TorrentInfo>();
  private progressTimers = new Map<string, ReturnType<typeof setInterval>>();
  private pendingByHash = new Map<string, Promise<TorrentInfo>>();
  private settings: TorrentSettings;

  constructor(settings: TorrentSettings) {
    super();
    this.settings = settings;
    // Prevent Node from throwing on unhandled 'error' events from this emitter
    this.on('error', (err) => console.error('[TorrentService] unhandled error event', err));
  }

  async init(): Promise<void> {
    this.client = new WebTorrent({
      dht:           this.settings.enableDht,
      lsd:           this.settings.enableLsd,
      pex:           this.settings.enablePex,
      maxConns:      this.settings.maxConnections,
      downloadLimit: this.settings.downloadSpeedLimit > 0 ? this.settings.downloadSpeedLimit : -1,
      uploadLimit:   this.settings.uploadSpeedLimit   > 0 ? this.settings.uploadSpeedLimit   : -1,
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

    const incomingHash = this.hashFromMagnet(magnetUri);

    // If already resolving this hash, return the same promise (handles boot-restore races)
    const pending = this.pendingByHash.get(incomingHash);
    if (pending) {
      console.log(`[TorrentService] ${incomingHash.slice(0, 8)}… already pending, awaiting existing promise`);
      return pending;
    }

    // Already fully added — return immediately
    if (incomingHash) {
      const existingTorrent = this.client.torrents.find(
        (t) => t.infoHash?.toLowerCase() === incomingHash
      );
      if (existingTorrent) {
        const existing = this.infoMap.get(existingTorrent.infoHash);
        if (existing) {
          console.log(`[TorrentService] ${incomingHash.slice(0, 8)}… already active, returning existing info`);
          return existing;
        }
      }
    }

    console.log(`[TorrentService] adding magnet hash=${incomingHash.slice(0, 8)}… savePath=${savePath}`);

    const promise = new Promise<TorrentInfo>((resolve, reject) => {
      // Inject extra trackers for better peer discovery and speed
      const enrichedMagnet = injectTrackers(magnetUri);
      // NOTE: do NOT pass `so` (select-only) — invalid in WebTorrent v3 and breaks the add
      const torrent: Torrent = this.client!.add(enrichedMagnet, { path: savePath });

      let resolved = false;

      const doResolve = (status: TorrentStatus) => {
        if (resolved) return;
        resolved = true;
        const info = this.buildInfo(torrent, opts.category ?? 'other', savePath, status, opts.addedAt);
        this.infoMap.set(torrent.infoHash, info);
        this.pendingByHash.delete(incomingHash);
        this.startProgressPolling(torrent, torrent.infoHash);
        console.log(`[TorrentService] ${incomingHash.slice(0, 8)}… resolved with status=${status} name="${info.name}"`);
        resolve(info);
        this.emit('added', info);
      };

      torrent.on('metadata', () => {
        console.log(`[TorrentService] ${incomingHash.slice(0, 8)}… metadata received name="${torrent.name}" size=${torrent.length}`);
        doResolve('metadata');
      });

      torrent.on('ready', () => {
        const isPaused = opts.paused ?? false;
        const status: TorrentStatus = isPaused ? 'paused' : 'downloading';
        console.log(`[TorrentService] ${incomingHash.slice(0, 8)}… ready event paused=${isPaused} → status=${status}`);

        const info = this.infoMap.get(torrent.infoHash);
        if (info) {
          info.name      = torrent.name || info.name;
          info.totalSize = torrent.length ?? info.totalSize;
          info.status    = status;
          info.files     = this.buildFiles(torrent);
          this.emit('progress', { ...info });
        } else {
          doResolve(status);
        }

        if (isPaused) torrent.pause();
      });

      torrent.on('done', () => {
        const info = this.infoMap.get(torrent.infoHash);
        console.log(`[TorrentService] ${incomingHash.slice(0, 8)}… done name="${info?.name}"`);
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
        console.error(`[TorrentService] ${incomingHash.slice(0, 8)}… torrent error: ${msg}`);

        // WebTorrent detected a duplicate — return existing info if available
        if (msg.toLowerCase().includes('cannot add duplicate')) {
          const hash = torrent.infoHash ?? incomingHash;
          const existing = hash ? this.infoMap.get(hash) : undefined;
          if (!resolved) {
            resolved = true;
            this.pendingByHash.delete(incomingHash);
            if (existing) { resolve(existing); return; }
            // Still pending from restore — wait for it
            const restorePending = this.pendingByHash.get(hash);
            if (restorePending) { restorePending.then(resolve, reject); return; }
          }
        }

        const info = this.infoMap.get(torrent.infoHash);
        if (info) { info.status = 'error'; info.error = msg; }
        this.emit('torrent-error', torrent.infoHash ?? 'unknown', msg);
        if (!resolved) {
          resolved = true;
          this.pendingByHash.delete(incomingHash);
          reject(new Error(msg));
        }
      });

      // Resolve with placeholder after 10s if metadata never arrives (dead / no peers)
      setTimeout(() => {
        if (!resolved) {
          console.warn(`[TorrentService] ${incomingHash.slice(0, 8)}… metadata timeout — no peers yet, staying in metadata state`);
          doResolve('metadata');
        }
      }, 10_000);
    });

    if (incomingHash) this.pendingByHash.set(incomingHash, promise);
    return promise;
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
    if (this.client) {
      this.client.throttleDownload(settings.downloadSpeedLimit > 0 ? settings.downloadSpeedLimit : -1);
      this.client.throttleUpload(settings.uploadSpeedLimit   > 0 ? settings.uploadSpeedLimit   : -1);
    }
  }

  applyDownloadLimit(rate: number): void {
    if (this.client) this.client.throttleDownload(rate);
  }

  applyUploadLimit(rate: number): void {
    if (this.client) this.client.throttleUpload(rate);
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
    let lastStatus  = '';
    let lastPeers   = -1;
    let stalledSecs = 0;

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

      // Stall detection
      const isStalled = info.status !== 'paused' && info.status !== 'completed'
        && info.downloadSpeed === 0 && info.numPeers === 0;

      if (isStalled) {
        stalledSecs++;
        if (info.status !== 'stalled') info.status = 'stalled';
      } else {
        stalledSecs = 0;
        if (info.status === 'stalled') info.status = 'downloading';
      }

      // Auto-retry: force a tracker reannounce every 60s of stall
      if (stalledSecs > 0 && stalledSecs % 60 === 0) {
        console.log(`[TorrentService] ${id.slice(0, 8)}… stalled ${stalledSecs}s — forcing reannounce`);
        try {
          // WebTorrent internal: trigger a fresh DHT/tracker announce
          (torrent as unknown as { _discovery?: { tracker?: { update?(): void }; dht?: { lookup?(ih: string): void } } })
            ._discovery?.tracker?.update?.();
        } catch { /* ignore */ }
      }

      // Log on status or peer-count change
      if (info.status !== lastStatus || info.numPeers !== lastPeers) {
        console.log(`[TorrentService] ${id.slice(0, 8)}… status=${info.status} peers=${info.numPeers} dl=${Math.round(info.downloadSpeed / 1024)}KB/s progress=${(info.progress * 100).toFixed(1)}%`);
        lastStatus = info.status;
        lastPeers  = info.numPeers;
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

  private hashFromMagnet(magnetUri: string): string {
    const m = magnetUri.match(/xt=urn:btih:([a-fA-F0-9]{40})/i);
    return m ? m[1].toLowerCase() : '';
  }
}
