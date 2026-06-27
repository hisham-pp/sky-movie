import type { TorrentSearchRequest, TorrentSearchResult } from '../../../shared/ipc';

export interface TorrentProvider {
  readonly name: string;
  search(req: TorrentSearchRequest): Promise<TorrentSearchResult[]>;
}
