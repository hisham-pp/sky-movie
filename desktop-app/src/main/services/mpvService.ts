/**
 * MpvService — wraps the libmpv N-API addon.
 *
 * Architecture (v2 — background render thread in C++):
 *  - C++ render thread calls mpv_render_context_render() off the Node.js main thread
 *  - onFrameReady(buf, w, h) is called with a pre-rendered RGBA buffer
 *  - This service only does: throttle → JPEG encode → IPC send  (all lightweight)
 *  - The Node.js main thread is NEVER blocked by mpv rendering
 */

import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, nativeImage, type WebContents } from 'electron';
import { logger } from '../utils/logger';

const log = logger('MpvService');

// ── Addon types ──────────────────────────────────────────────────────────────

interface MpvPlayerAddon {
  loadFile(path: string): void;
  play(): void;
  pause(): void;
  stop(): void;
  seek(seconds: number): void;
  setVolume(percent: number): void;
  setAudioTrack(id: number): void;
  setSubTrack(id: number): void;
  setSpeed(speed: number): void;
  setProperty(name: string, value: string | number | boolean): void;
  getProperty(name: string): string | number | null;
  resize(width: number, height: number): void;
  destroy(): void;
}

interface MpvAddonModule {
  MpvPlayer: new (opts: {
    width: number;
    height: number;
    onEvent: (ev: MpvEvent) => void;
    // Pre-rendered RGBA buffer delivered from the C++ render thread.
    // The main thread must NOT call renderFrame() — the buffer arrives here directly.
    onFrameReady: (buf: Buffer, width: number, height: number) => void;
  }) => MpvPlayerAddon;
}

export interface MpvEvent {
  type: 'property' | 'end-file' | 'start-file' | 'file-loaded';
  name?: string;
  value?: number | boolean | string | null;
}

export interface MpvTrack {
  id: number;
  type: 'audio' | 'sub' | 'video';
  title?: string;
  lang?: string;
  codec?: string;
  default?: boolean;
  selected?: boolean;
}

// ── Session state ────────────────────────────────────────────────────────────

interface RenderSession {
  player: MpvPlayerAddon;
  webContents: WebContents;
  width: number;
  height: number;
  lastSendMs: number;
  framesReceived: number;
  framesSent: number;
  slowEncodes: number;
  sessionStartMs: number;
}

// ── MpvService ───────────────────────────────────────────────────────────────

export class MpvService {
  private addon: MpvAddonModule | null = null;
  private session: RenderSession | null = null;
  private addonLoaded = false;

  constructor() {
    this.loadAddon();
  }

  get isAvailable(): boolean {
    return this.addonLoaded && this.addon !== null;
  }

  private loadAddon(): void {
    try {
      const addonPath = this.resolveAddonPath();
      log.info('[MpvService] Loading addon from:', addonPath);
      const req = createRequire(import.meta.url);
      this.addon = req(addonPath) as MpvAddonModule;
      this.addonLoaded = true;
      log.info('[MpvService] Addon loaded OK');
    } catch (err) {
      log.warn('[MpvService] Addon not available — fallback to Artplayer:', err);
      this.addonLoaded = false;
    }
  }

  private resolveAddonPath(): string {
    if (app.isPackaged) {
      return join(process.resourcesPath, 'mpv', 'mpv_player.node');
    }
    const currentDir = dirname(fileURLToPath(import.meta.url));
    return join(
      currentDir,
      '..', '..', 'native', 'mpv-player',
      'build', 'Release', 'mpv_player.node'
    );
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  openFile(
    filePath: string,
    webContents: WebContents,
    renderWidth = 1280,
    renderHeight = 720
  ): void {
    if (!this.addon) throw new Error('libmpv addon not loaded');

    // Cap render resolution — higher resolutions give diminishing returns but
    // dramatically increase JPEG encode time on the main thread.
    const w = Math.min(renderWidth,  1280);
    const h = Math.min(renderHeight, 720);

    log.info(`[MpvService] openFile: ${filePath} @ ${w}x${h}`);
    const t0 = Date.now();

    this.closeSession();

    const session: RenderSession = {
      player: null as unknown as MpvPlayerAddon,
      webContents,
      width: w,
      height: h,
      lastSendMs: 0,
      framesReceived: 0,
      framesSent: 0,
      slowEncodes: 0,
      sessionStartMs: Date.now()
    };
    this.session = session;

    const player = new this.addon.MpvPlayer({
      width: w,
      height: h,
      onEvent: (ev) => this.onMpvEvent(ev, webContents),
      // Buffer arrives pre-rendered from the C++ render thread — main thread safe.
      onFrameReady: (buf: Buffer, fw: number, fh: number) =>
        this.onFrameReceived(buf, fw, fh)
    });

    session.player = player;
    log.info(`[MpvService] MpvPlayer constructed in ${Date.now() - t0}ms`);

    player.loadFile(filePath);
    log.info('[MpvService] loadFile dispatched');
  }

  closeSession(): void {
    if (!this.session) return;
    const s = this.session;
    this.session = null;  // null first so onFrameReceived no-ops during teardown

    const elapsed = Date.now() - s.sessionStartMs;
    log.info(
      `[MpvService] closeSession — elapsed: ${elapsed}ms, ` +
      `frames received: ${s.framesReceived}, sent: ${s.framesSent}, ` +
      `slow encodes: ${s.slowEncodes}`
    );

    s.player.destroy();
  }

  play(): void         { log.info('[MpvService] play'); this.session?.player.play(); }
  pause(): void        { log.info('[MpvService] pause'); this.session?.player.pause(); }
  stop(): void         { log.info('[MpvService] stop'); this.session?.player.stop(); }

  seek(seconds: number): void     { this.session?.player.seek(seconds); }
  setVolume(pct: number): void    { this.session?.player.setVolume(pct); }
  setAudioTrack(id: number): void { this.session?.player.setAudioTrack(id); }
  setSubTrack(id: number): void   { this.session?.player.setSubTrack(id); }
  setSpeed(speed: number): void   { this.session?.player.setSpeed(speed); }

  setRenderSize(width: number, height: number): void {
    if (!this.session) return;
    const w = Math.min(width,  1280);
    const h = Math.min(height, 720);
    if (w === this.session.width && h === this.session.height) return;
    log.info(`[MpvService] setRenderSize: ${w}x${h}`);
    this.session.width  = w;
    this.session.height = h;
    this.session.player.resize(w, h);
  }

  getProperty(name: string): string | number | null {
    return this.session?.player.getProperty(name) ?? null;
  }

  setSubFile(path: string): void {
    this.session?.player.setProperty('sub-file', path);
  }

  // ── Frame delivery (runs on Node.js main thread) ───────────────────────────

  private onFrameReceived(rgba: Buffer, width: number, height: number): void {
    const s = this.session;
    if (!s || s.webContents.isDestroyed()) return;

    s.framesReceived++;

    // Log first frame received — useful for diagnosing startup latency
    if (s.framesReceived === 1) {
      log.info(
        `[MpvService] First frame received — ${width}x${height}, ` +
        `${(Date.now() - s.sessionStartMs)}ms after openFile`
      );
    }

    // Throttle to ~30 fps — the C++ render thread may deliver at 60+fps
    const now = Date.now();
    if (now - s.lastSendMs < 33) return;
    s.lastSendMs = now;

    try {
      const t0 = Date.now();
      const img  = nativeImage.createFromBuffer(rgba, { width, height });
      const jpeg = img.toJPEG(75);
      const encMs = Date.now() - t0;

      if (encMs > 20) {
        s.slowEncodes++;
        log.warn(`[MpvService] slow JPEG encode: ${encMs}ms @ ${width}x${height} (total slow: ${s.slowEncodes})`);
      }

      // Log frame throughput every 150 sent frames
      s.framesSent++;
      if (s.framesSent % 150 === 0) {
        const elapsed = (Date.now() - s.sessionStartMs) / 1000;
        log.info(
          `[MpvService] frames sent: ${s.framesSent} in ${elapsed.toFixed(1)}s ` +
          `(~${(s.framesSent / elapsed).toFixed(1)} fps), ` +
          `jpeg size: ${(jpeg.length / 1024).toFixed(0)} KB, ` +
          `slow encodes: ${s.slowEncodes}`
        );
      }

      s.webContents.send('mpv:frame', jpeg);
    } catch (err) {
      log.warn('[MpvService] frame encode/send error:', err);
    }
  }

  // ── Event forwarding ───────────────────────────────────────────────────────

  private onMpvEvent(ev: MpvEvent, wc: WebContents): void {
    if (wc.isDestroyed()) return;

    if (ev.type === 'property') {
      wc.send('mpv:event', ev);
      if (ev.name === 'track-list') {
        this.sendTrackList(wc);
      }
      // Log state-changing properties for debugging
      if (ev.name === 'pause' || ev.name === 'eof-reached') {
        log.info(`[MpvService] property: ${ev.name} = ${ev.value}`);
      }
    } else {
      log.info(`[MpvService] event: ${ev.type}`);
      wc.send('mpv:event', ev);
    }
  }

  private sendTrackList(wc: WebContents): void {
    if (!this.session) return;
    try {
      const raw = this.session.player.getProperty('track-list/count');
      if (raw === null) return;
      const count = Number(raw);
      const tracks: MpvTrack[] = [];
      for (let i = 0; i < count; i++) {
        const type  = this.session.player.getProperty(`track-list/${i}/type`);
        const id    = this.session.player.getProperty(`track-list/${i}/id`);
        const title = this.session.player.getProperty(`track-list/${i}/title`);
        const lang  = this.session.player.getProperty(`track-list/${i}/lang`);
        const codec = this.session.player.getProperty(`track-list/${i}/codec`);
        const def   = this.session.player.getProperty(`track-list/${i}/default`);
        const sel   = this.session.player.getProperty(`track-list/${i}/selected`);
        if (type === 'audio' || type === 'sub') {
          tracks.push({
            id:       Number(id),
            type:     type as 'audio' | 'sub',
            title:    title?.toString(),
            lang:     lang?.toString(),
            codec:    codec?.toString(),
            default:  Boolean(def),
            selected: Boolean(sel)
          });
        }
      }
      log.info(`[MpvService] track-list: ${tracks.length} tracks`);
      wc.send('mpv:tracks', tracks);
    } catch {
      // ignore — fires before file is loaded
    }
  }
}

export default new MpvService();
