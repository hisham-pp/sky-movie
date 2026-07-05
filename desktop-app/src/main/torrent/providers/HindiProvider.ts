import type { TorrentCategory, TorrentSearchRequest, TorrentSearchResult } from '../../../shared/ipc';
import { EXTRA_TRACKERS_QUERY } from '../trackers';
import { imdbPosterUrl, type TorrentProvider } from './TorrentProvider';

interface TpbResult {
  id: string;
  name: string;
  info_hash: string;
  leechers: string;
  seeders: string;
  size: string;
  username: string;
  added: string;
  category: string;
  imdb: string;
}

/**
 * Hindi / Bollywood movies and shows via the apibay (TPB) index. Mirrors the
 * Malayalam provider: it appends a language keyword to the query so the public
 * index returns Hindi-tagged releases (which are otherwise buried under the
 * default English results). Downloaded items are still keyed by info_hash in
 * TorrentManager.
 */
export class HindiProvider implements TorrentProvider {
  readonly name = 'Hindi';
  private readonly baseUrl = 'https://apibay.org';

  async search(req: TorrentSearchRequest): Promise<TorrentSearchResult[]> {
    // No dedicated filter: run quietly in the background on general searches so
    // Hindi releases surface alongside the normal results (same as Malayalam).
    if (req.category && req.category !== 'all') {
      return [];
    }

    // Scope the query to Hindi releases unless the user already did.
    const base = req.query.trim();
    if (!base) return [];
    const lower = base.toLowerCase();
    const query = lower.includes('hindi') || lower.includes('bollywood') ? base : `${base} hindi`;

    // cat=200 = Video (all subcategories)
    const res = await fetch(
      `${this.baseUrl}/q.php?q=${encodeURIComponent(query)}&cat=200`,
      { signal: AbortSignal.timeout(10_000) }
    );

    if (!res.ok) throw new Error(`Hindi/TPB API error: ${res.status}`);

    const items: TpbResult[] = await res.json();

    if (!Array.isArray(items) || (items.length === 1 && items[0].name === 'No results returned')) {
      return [];
    }

    return items
      .map((item): TorrentSearchResult => ({
        id:             `hin-${item.info_hash}`,
        title:          item.name,
        year:           this.extractYear(item.name),
        size:           Number(item.size),
        seeds:          Number(item.seeders),
        leeches:        Number(item.leechers),
        magnetUri:      this.buildMagnet(item.info_hash, item.name),
        torrentUrl:     null,
        quality:        this.detectQuality(item.name),
        source:         this.detectSource(item.name),
        uploader:       item.username,
        category:       this.mapCategory(item.category),
        provider:       this.name,
        posterUrl:      imdbPosterUrl(item.imdb),
        imdbId:         item.imdb || null,
        runtimeMinutes: null,
        addedAt:        item.added ? new Date(Number(item.added) * 1000).toISOString() : null,
      }))
      .sort((a, b) => {
        if (req.sortBy === 'size') return b.size - a.size;
        if (req.sortBy === 'date') return (b.addedAt ?? '').localeCompare(a.addedAt ?? '');
        return b.seeds - a.seeds;
      });
  }

  private buildMagnet(hash: string, name: string): string {
    return `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(name)}${EXTRA_TRACKERS_QUERY}`;
  }

  private extractYear(name: string): number | null {
    const m = name.match(/\b((?:19|20)\d{2})\b/);
    return m ? Number(m[1]) : null;
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
    if (n.includes('WEB-DL') || n.includes('WEBDL'))   return 'WEB-DL';
    if (n.includes('HDTV'))    return 'HDTV';
    if (n.includes('DVDRIP'))  return 'DVDRip';
    if (n.includes('HDCAM') || n.includes('CAMRIP'))   return 'CAM';
    return null;
  }

  private mapCategory(cat: string): TorrentCategory {
    const n = Number(cat);
    if (n === 205 || n === 208) return 'tv';
    if (n >= 200 && n < 300)   return 'movie';
    return 'other';
  }
}
