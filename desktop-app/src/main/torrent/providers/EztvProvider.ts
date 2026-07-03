import type { TorrentSearchRequest, TorrentSearchResult } from '../../../shared/ipc';
import { imdbPosterUrl, type TorrentProvider } from './TorrentProvider';

interface EztvTorrent {
  id: number;
  hash: string;
  filename: string;
  episode_url: string;
  torrent_url: string;
  magnet_url: string;
  title: string;
  imdb_id: string;
  season: string;
  episode: string;
  small_screenshot: string;
  seeds: number;
  peers: number;
  size_bytes: string;
  date_released_unix: number;
}

interface EztvResponse {
  torrents?: EztvTorrent[];
  torrents_count: number;
}

export class EztvProvider implements TorrentProvider {
  readonly name = 'EZTV';
  private readonly baseUrl = 'https://eztv.re/api';

  async search(req: TorrentSearchRequest): Promise<TorrentSearchResult[]> {
    if (req.category && req.category !== 'all' && req.category !== 'tv' && req.category !== 'anime') {
      return [];
    }

    const res = await fetch(
      `${this.baseUrl}/get-torrents?imdb_id=0&limit=50&page=1&q=${encodeURIComponent(req.query)}`,
      { signal: AbortSignal.timeout(10_000) }
    );

    if (!res.ok) throw new Error(`EZTV API error: ${res.status}`);

    const json: EztvResponse = await res.json();
    const items = json.torrents ?? [];

    return items.map((item): TorrentSearchResult => ({
      id: `eztv-${item.id}`,
      title: item.title,
      year: null,
      size: Number(item.size_bytes),
      seeds: item.seeds,
      leeches: item.peers,
      magnetUri: item.magnet_url,
      torrentUrl: item.torrent_url,
      quality: this.detectQuality(item.title),
      source: null,
      uploader: 'EZTV',
      category: 'tv',
      provider: this.name,
      posterUrl: imdbPosterUrl(item.imdb_id) ?? this.screenshotUrl(item.small_screenshot),
      imdbId: item.imdb_id && item.imdb_id !== '0' ? `tt${item.imdb_id}` : null,
      runtimeMinutes: null,
      addedAt: item.date_released_unix
        ? new Date(item.date_released_unix * 1000).toISOString()
        : null,
    }));
  }

  /** EZTV screenshot URLs are protocol-relative ("//ezimg.ch/…"). */
  private screenshotUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    return url.startsWith('//') ? `https:${url}` : url;
  }

  private detectQuality(name: string): string | null {
    const n = name.toUpperCase();
    if (n.includes('2160P') || n.includes('4K')) return '2160p';
    if (n.includes('1080P')) return '1080p';
    if (n.includes('720P'))  return '720p';
    if (n.includes('480P'))  return '480p';
    return null;
  }
}
