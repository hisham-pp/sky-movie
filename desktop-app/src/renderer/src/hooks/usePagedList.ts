import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

const PAGE_SIZE = 100;

/**
 * Client-side paging for large lists with automatic loading: a sentinel
 * element (attach `sentinelRef` to the load-more row) grows the visible
 * window whenever it scrolls near the viewport, so the manual button is
 * only a fallback when IntersectionObserver is unavailable.
 */
export function usePagedList<T>(items: T[]) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [items]);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;
  const remaining = Math.max(0, items.length - visibleCount);
  const loadMore = useCallback(() => setVisibleCount((c) => c + PAGE_SIZE), []);

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
