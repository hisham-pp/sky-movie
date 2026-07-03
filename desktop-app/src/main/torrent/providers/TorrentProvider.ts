import type { TorrentSearchRequest, TorrentSearchResult } from '../../../shared/ipc';

export interface TorrentProvider {
  readonly name: string;
  search(req: TorrentSearchRequest): Promise<TorrentSearchResult[]>;
}

/**
 * Poster URL derived from an IMDb id via the metahub image CDN (keyless).
 * Accepts "tt1234567" or bare digits; returns null when no usable id.
 */
export function imdbPosterUrl(imdbId: string | null | undefined): string | null {
  if (!imdbId) return null;
  const id = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;
  if (!/^tt\d+$/.test(id) || /^tt0+$/.test(id)) return null;
  return `https://images.metahub.space/poster/small/${id}/img`;
}
