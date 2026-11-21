import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

// In-memory session store so browse-page UI state (filters, sort, pagination,
// scroll offset) survives route changes. Deliberately not persisted to disk:
// an app relaunch or F5 refresh starts clean.
const sessionStore = new Map<string, unknown>();

export function getSessionValue<T>(key: string, fallback: T): T {
  return sessionStore.has(key) ? (sessionStore.get(key) as T) : fallback;
}

export function setSessionValue<T>(key: string, value: T): void {
  sessionStore.set(key, value);
}

/**
 * Drop-in replacement for useState whose value survives unmount for the
 * lifetime of the renderer session, keyed globally by `key`.
 */
export function useSessionState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => getSessionValue(key, initial));

  const set = useCallback<Dispatch<SetStateAction<T>>>((action) => {
    setValue((prev) => {
      const next = typeof action === 'function' ? (action as (p: T) => T)(prev) : action;
      sessionStore.set(key, next);
      return next;
    });
  }, [key]);

  return [value, set];
}

/**
 * Attach the returned ref to a scrollable element to restore its scrollTop on
 * mount and keep the stored offset up to date while the user scrolls.
 */
export function useSessionScroll(key: string) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = getSessionValue(key, 0);
    const onScroll = () => sessionStore.set(key, el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [key]);

  return ref;
}
