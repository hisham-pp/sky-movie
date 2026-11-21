import { useEffect, useRef, useState } from 'react';
import * as queries from '@renderer/queries';

export interface TmdbSuggestion {
  key: string;
  kind: 'movie' | 'tv';
  title: string;
  year: number | null;
  posterUrl: string | null;
  rating: number | null;
}

interface TmdbSuggestionsState {
  suggestions: TmdbSuggestion[];
  loading: boolean;
  /** null while the TMDB key is being resolved, then true/false. */
  tmdbEnabled: boolean;
}

const DEBOUNCE_MS = 280;
const MIN_QUERY_LEN = 2;
const MAX_SUGGESTIONS = 8;

/**
 * Live TMDB title suggestions (movies + TV) for the given query.
 * Only fires when a TMDB API key is configured; otherwise `tmdbEnabled` is
 * false and callers should fall back to local search history. Requests are
 * debounced and tagged with a sequence number so stale responses from earlier
 * keystrokes are discarded rather than clobbering newer results.
 */
export function useTmdbSuggestions(query: string): TmdbSuggestionsState {
  const [suggestions, setSuggestions] = useState<TmdbSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [tmdbEnabled, setTmdbEnabled] = useState(false);
  const seqRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve whether TMDB is configured (once on mount).
  useEffect(() => {
    let cancelled = false;
    queries.getSettings()
      .then((s) => { if (!cancelled) setTmdbEnabled(Boolean(s.tmdbApiKey?.trim())); })
      .catch(() => { if (!cancelled) setTmdbEnabled(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();

    if (!tmdbEnabled || q.length < MIN_QUERY_LEN) {
      // Bump the sequence so any in-flight response is ignored.
      seqRef.current++;
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const seq = ++seqRef.current;
    debounceRef.current = setTimeout(async () => {
      const [movies, shows] = await Promise.all([
        queries.searchMovieMetadata({ query: q }).catch(() => []),
        queries.searchTvMetadata({ query: q }).catch(() => []),
      ]);
      if (seq !== seqRef.current) return; // superseded by a newer keystroke

      const merged: TmdbSuggestion[] = [
        ...movies.map((m) => ({
          key: `movie-${m.providerId}`,
          kind: 'movie' as const,
          title: m.title,
          year: m.releaseYear ?? m.year,
          posterUrl: m.posterUrl,
          rating: m.rating,
        })),
        ...shows.map((s) => ({
          key: `tv-${s.providerId}`,
          kind: 'tv' as const,
          title: s.title,
          year: s.firstAirYear ?? s.year,
          posterUrl: s.posterUrl,
          rating: s.rating,
        })),
      ];

      merged.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.title.localeCompare(b.title));
      setSuggestions(merged.slice(0, MAX_SUGGESTIONS));
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, tmdbEnabled]);

  return { suggestions, loading, tmdbEnabled };
}
