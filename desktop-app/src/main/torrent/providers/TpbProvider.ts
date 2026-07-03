import type { TorrentCategory, TorrentSearchRequest, TorrentSearchResult } from '../../../shared/ipc';
import { imdbPosterUrl, type TorrentProvider } from './TorrentProvider';

interface TpbResult {
  id: string;
  name: string;
  info_hash: string;
  leechers: string;
  seeders: string;
  num_files: string;
  size: string;
  username: string;
  added: string;
  status: string;
  category: string;
  imdb: string;
}

// TPB category IDs
const CATEGORY_MAP: Record<string, string> = {
  movie: '201,207',
  tv:    '205,208',
  anime: '212',
};

export class TpbProvider implements TorrentProvider {
  readonly name = 'TPB';
  private readonly baseUrl = 'https://apibay.org';

  async search(req: TorrentSearchRequest): Promise<TorrentSearchResult[]> {
    // Malayalam category is handled exclusively by MalayalamProvider
    if (req.category === 'malayalam') return [];

    const cat = req.category && req.category !== 'all' ? (CATEGORY_MAP[req.category] ?? '0') : '0';

    const res = await fetch(
      `${this.baseUrl}/q.php?q=${encodeURIComponent(req.query)}&cat=${cat}`,
      { signal: AbortSignal.timeout(10_000) }
    );

    if (!res.ok) throw new Error(`TPB API error: ${res.status}`);

    const items: TpbResult[] = await res.json();

    if (!Array.isArray(items) || (items.length === 1 && items[0].name === 'No results returned')) {
      return [];
    }

    return items
      .map((item): TorrentSearchResult => ({
        id: `tpb-${item.info_hash}`,
        title: item.name,
        year: null,
        size: Number(item.size),
        seeds: Number(item.seeders),
        leeches: Number(item.leechers),
        magnetUri: this.buildMagnet(item.info_hash, item.name),
        torrentUrl: null,
        quality: this.detectQuality(item.name),
        source: this.detectSource(item.name),
        uploader: item.username,
        category: this.mapCategory(item.category),
        provider: this.name,
        posterUrl: imdbPosterUrl(item.imdb),
        imdbId: item.imdb || null,
        runtimeMinutes: null,
        addedAt: new Date(Number(item.added) * 1000).toISOString(),
      }))
      .sort((a, b) => {
        if (req.sortBy === 'size') return b.size - a.size;
        if (req.sortBy === 'date') return (b.addedAt ?? '').localeCompare(a.addedAt ?? '');
        return b.seeds - a.seeds;
      });
  }

  private buildMagnet(hash: string, name: string): string {
    const trackers = [
      'udp://tracker.opentrackr.org:1337/announce',
      'udp://open.tracker.cl:1337/announce',
      'udp://9.rarbg.com:2810/announce',
      'udp://tracker.openbittorrent.com:6969/announce',
    ]
      .map((t) => `&tr=${encodeURIComponent(t)}`)
      .join('');

    return `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(name)}${trackers}`;
  }

  private detectQuality(name: string): string | null {
    const n = name.toUpperCase();
    if (n.includes('2160P') || n.includes('4K')) return '2160p';
    if (n.includes('1080P')) return '1080p';
    if (n.includes('720P'))  return '720p';
    if (n.includes('480P'))  return '480p';
    return null;
  }

  private detectSource(name: string): string | null {
    const n = name.toUpperCase();
    if (n.includes('BLURAY') || n.includes('BLU-RAY')) return 'BluRay';
    if (n.includes('WEBRIP'))  return 'WEBRip';
    if (n.includes('WEB-DL') || n.includes('WEBDL')) return 'WEB-DL';
    if (n.includes('HDTV'))    return 'HDTV';
    if (n.includes('DVDRIP'))  return 'DVDRip';
    return null;
  }

  private mapCategory(cat: string): TorrentCategory {
    const n = Number(cat);
    if (n >= 200 && n < 300) return 'movie';
    if (n >= 200 && n < 300) return 'tv';
    if (n === 205 || n === 208) return 'tv';
    if (n === 212) return 'anime';
    return 'other';
  }
}
