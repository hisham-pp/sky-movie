import type { TorrentSearchRequest, TorrentSearchResult } from '../../../shared/ipc';
import type { TorrentProvider } from './TorrentProvider';

interface YtsMovie {
  id: number;
  title: string;
  year: number;
  imdb_code: string;
  runtime: number;
  medium_cover_image: string;
  torrents: YtsTorrent[];
}

interface YtsTorrent {
  hash: string;
  quality: string;
  type: string;
  seeds: number;
  peers: number;
  size_bytes: number;
  date_uploaded: string;
  url: string;
}

interface YtsResponse {
  status: string;
  data: {
    movies?: YtsMovie[];
    movie_count: number;
  };
}

export class YtsProvider implements TorrentProvider {
  readonly name = 'YTS';
  private readonly baseUrl = 'https://yts.mx/api/v2';

  async search(req: TorrentSearchRequest): Promise<TorrentSearchResult[]> {
    if (req.category && req.category !== 'all' && req.category !== 'movie') {
      return [];
    }

    const params = new URLSearchParams({
      query_term: req.query,
      limit: '20',
      sort_by: this.mapSort(req.sortBy),
      order_by: req.sortOrder ?? 'desc',
    });

    if (req.quality && req.quality !== 'all') {
      params.set('quality', req.quality);
    }

    const res = await fetch(`${this.baseUrl}/list_movies.json?${params}`, {
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) throw new Error(`YTS API error: ${res.status}`);

    const json: YtsResponse = await res.json();
    const movies = json.data.movies ?? [];

    const results: TorrentSearchResult[] = [];

    for (const movie of movies) {
      for (const torrent of movie.torrents) {
        results.push({
          id: `yts-${movie.id}-${torrent.hash}`,
          title: `${movie.title} (${movie.year}) [${torrent.quality}] [${torrent.type}]`,
          year: movie.year,
          size: torrent.size_bytes,
          seeds: torrent.seeds,
          leeches: torrent.peers,
          magnetUri: this.buildMagnet(torrent.hash, movie.title),
          torrentUrl: torrent.url,
          quality: torrent.quality,
          source: torrent.type,
          uploader: 'YTS',
          category: 'movie',
          provider: this.name,
          posterUrl: movie.medium_cover_image,
          imdbId: movie.imdb_code,
          runtimeMinutes: movie.runtime || null,
          addedAt: torrent.date_uploaded,
        });
      }
    }

    return results;
  }

  private mapSort(sortBy?: string): string {
    switch (sortBy) {
      case 'seeds':  return 'seeds';
      case 'size':   return 'size';
      case 'date':   return 'date_added';
      case 'peers':  return 'peers';
      default:       return 'seeds';
    }
  }

  private buildMagnet(hash: string, title: string): string {
    const trackers = [
      'udp://open.demonii.com:1337/announce',
      'udp://tracker.openbittorrent.com:80',
      'udp://tracker.coppersurfer.tk:6969',
      'udp://glotorrents.pw:6969/announce',
      'udp://tracker.opentrackr.org:1337/announce',
      'udp://torrent.gresille.org:80/announce',
      'udp://p4p.arenabg.com:1337',
      'udp://tracker.leechers-paradise.org:6969',
    ]
      .map((t) => `&tr=${encodeURIComponent(t)}`)
      .join('');

    return `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(title)}${trackers}`;
  }
}
