import { apiFetch } from './client';
import type {
  DetailResult,
  LibrarySummary,
  MediaFile,
  MetadataUpdate,
  Movie,
  MovieMetadataSearchRequest,
  MovieMetadataSearchResult,
  ScanLibrariesRequest,
  ScanLibraryRequest,
  ScanResult,
  TvMetadataSearchRequest,
  TvMetadataSearchResult,
  TvShow,
  ApplyMovieMetadataRequest,
  ApplyTvMetadataRequest,
  GetMediaRelationsAndRecommendationsRequest,
  MediaRelationsAndRecommendationsResult
} from '@/types';

export async function getMovies(query = ''): Promise<Movie[]> {
  return apiFetch<Movie[]>(`/api/movies?query=${encodeURIComponent(query)}`);
}

export async function getMovieById(id: number): Promise<DetailResult<Movie>> {
  return apiFetch<DetailResult<Movie>>(`/api/movies/${id}`);
}

export async function getShows(query = ''): Promise<TvShow[]> {
  return apiFetch<TvShow[]>(`/api/shows?query=${encodeURIComponent(query)}`);
}

export async function getShowById(id: number): Promise<DetailResult<TvShow>> {
  return apiFetch<DetailResult<TvShow>>(`/api/shows/${id}`);
}

export async function getLibrarySummary(): Promise<LibrarySummary> {
  return apiFetch<LibrarySummary>('/api/library/summary');
}

export async function getUnmatchedFiles(): Promise<MediaFile[]> {
  return apiFetch<MediaFile[]>('/api/library/unmatched');
}

export async function scanLibrary(request?: ScanLibraryRequest | string): Promise<ScanResult | null> {
  const body = typeof request === 'string' ? { path: request } : (request ?? {});
  return apiFetch<ScanResult>('/api/library/scan', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function scanLibraries(request?: ScanLibrariesRequest | string[]): Promise<ScanResult[]> {
  const body = Array.isArray(request) ? { paths: request } : (request ?? {});
  return apiFetch<ScanResult[]>('/api/library/scan', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function chooseFolder(_title?: string): Promise<string | null> {
  if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
    try {
      const handle = await (window as any).showDirectoryPicker();
      return handle.name;
    } catch {
      return null;
    }
  }
  const res = await apiFetch<{ current: string; folders: string[] }>('/api/dialog/choose-folders', { method: 'POST' });
  return res.current || null;
}

export async function chooseFolders(_title?: string): Promise<string[]> {
  const folder = await chooseFolder();
  return folder ? [folder] : [];
}

export async function chooseSubtitleFile(_title?: string): Promise<string | null> {
  return null;
}

export async function updateMetadata(update: MetadataUpdate): Promise<void> {
  await apiFetch('/api/metadata/update', {
    method: 'POST',
    body: JSON.stringify(update)
  });
}

export async function searchMovieMetadata(request: MovieMetadataSearchRequest): Promise<MovieMetadataSearchResult[]> {
  return apiFetch<MovieMetadataSearchResult[]>('/api/metadata/search-movie', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}

export async function applyMovieMetadata(request: ApplyMovieMetadataRequest): Promise<Movie> {
  return apiFetch<Movie>('/api/metadata/apply-movie', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}

export async function searchTvMetadata(request: TvMetadataSearchRequest): Promise<TvMetadataSearchResult[]> {
  return apiFetch<TvMetadataSearchResult[]>('/api/metadata/search-tv', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}

export async function applyTvMetadata(request: ApplyTvMetadataRequest): Promise<TvShow> {
  return apiFetch<TvShow>('/api/metadata/apply-tv', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}

export async function getMediaRelationsAndRecommendations(
  request: GetMediaRelationsAndRecommendationsRequest
): Promise<MediaRelationsAndRecommendationsResult> {
  return apiFetch<MediaRelationsAndRecommendationsResult>('/api/metadata/relations', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}

export async function markFileAsIgnored(fileId: number): Promise<void> {
  await apiFetch('/api/metadata/ignore-file', {
    method: 'POST',
    body: JSON.stringify({ fileId, ignored: true })
  });
}

export async function unmarkFileAsIgnored(fileId: number): Promise<void> {
  await apiFetch('/api/metadata/ignore-file', {
    method: 'POST',
    body: JSON.stringify({ fileId, ignored: false })
  });
}

export async function updateFileMatch(fileId: number, matchedMovieId: number | null, matchedShowId: number | null): Promise<void> {
  await apiFetch('/api/metadata/file-match', {
    method: 'POST',
    body: JSON.stringify({ fileId, matchedMovieId, matchedShowId })
  });
}

export async function deleteMediaFile(fileId: number): Promise<void> {
  await apiFetch(`/api/media/${fileId}`, { method: 'DELETE' });
}

export async function showItemInFolder(fileId: number): Promise<void> {
  await apiFetch(`/api/media/${fileId}/reveal`, { method: 'POST' });
}
