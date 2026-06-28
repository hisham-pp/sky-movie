declare module 'webtorrent' {
  import { EventEmitter } from 'node:events';

  export interface TorrentFile {
    name: string;
    path: string;
    length: number;
    progress: number;
  }

  export interface Torrent extends EventEmitter {
    infoHash: string;
    name: string;
    magnetURI: string;
    files: TorrentFile[];
    length: number;
    progress: number;
    downloaded: number;
    uploaded: number;
    downloadSpeed: number;
    uploadSpeed: number;
    numPeers: number;
    ratio: number;
    timeRemaining: number;
    done: boolean;
    pause(): void;
    resume(): void;
    destroy(opts?: { destroyStore?: boolean }, cb?: () => void): void;
    on(event: 'metadata' | 'ready' | 'done', listener: () => void): this;
    on(event: 'error', listener: (err: Error | string) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }

  export interface WebTorrentOptions {
    dht?: boolean;
    lsd?: boolean;
    pex?: boolean;
    maxConns?: number;
    downloadLimit?: number;
    uploadLimit?: number;
  }

  export interface AddTorrentOptions {
    path?: string;
    so?: string;
    paused?: boolean;
  }

  class WebTorrent extends EventEmitter {
    constructor(opts?: WebTorrentOptions);
    torrents: Torrent[];
    downloadSpeed: number;
    uploadSpeed: number;
    add(torrentId: string | Buffer, opts?: AddTorrentOptions): Torrent;
    remove(torrentId: string, opts?: { destroyStore?: boolean }, cb?: () => void): void;
    destroy(cb?: (err?: Error) => void): void;
    throttleDownload(rate: number): void;
    throttleUpload(rate: number): void;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }

  export default WebTorrent;
}
