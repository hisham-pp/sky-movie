import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getSessionValue, setSessionValue } from './useSessionState';

const PAGE_SIZE = 100;

/**
 * Client-side paging for large lists with automatic loading: a sentinel
 * element (attach `sentinelRef` to the load-more row) grows the visible
 * window whenever it scrolls near the viewport, so the manual button is
 * only a fallback when IntersectionObserver is unavailable.
 *
 * Pass `persistKey` to keep the visible window across unmounts (session
 * only), so a restored scroll position has content to land on. The window
 * still collapses back to one page whenever the list itself changes.
 */
export function usePagedList<T>(items: T[], persistKey?: string) {
  const [visibleCount, setVisibleCountState] = useState(() =>
    persistKey ? getSessionValue(persistKey, PAGE_SIZE) : PAGE_SIZE
  );

  const setVisibleCount = useCallback((update: number | ((c: number) => number)) => {
    setVisibleCountState((prev) => {
      const next = typeof update === 'function' ? update(prev) : update;
      if (persistKey) setSessionValue(persistKey, next);
      return next;
    });
  }, [persistKey]);

  // Reset to one page when the list changes — but not on the initial mount,
  // which would discard a count restored via persistKey.
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    setVisibleCount(PAGE_SIZE);
  }, [items, setVisibleCount]);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;
  const remaining = Math.max(0, items.length - visibleCount);
  const loadMore = useCallback(() => setVisibleCount((c) => c + PAGE_SIZE), [setVisibleCount]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      // Start loading a screen ahead so scrolling never hits the end.
      { rootMargin: '800px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // visibleCount dependency: re-observe after each page so the initial
    // callback fires again if the sentinel is still within range.
  }, [hasMore, loadMore, visibleCount]);

  return { visibleItems, hasMore, remaining, loadMore, sentinelRef };
}
