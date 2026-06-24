import { useRef, useLayoutEffect } from 'react';

/** Returns a ref that always holds the latest value without being a dep. */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
