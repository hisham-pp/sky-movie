const urlCache = new Map<string, string>();
const MAX_CACHE_SIZE = 1000;

/**
 * Safely prepares an image URL for rendering in the Electron UI.
 * If a legacy `file:///` URL is encountered, it converts it to the privileged
 * `sky-image://local/<encoded-path>` scheme so Chromium does not block it
 * with "Not allowed to load local resource" in development or production.
 *
 * Results are cached in memory to avoid repetitive decode/encode operations.
 */
export function toDisplayImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const s = String(url).trim();
  if (!s) return null;

  const cached = urlCache.get(s);
  if (cached !== undefined) return cached;

  let result = s;
  if (s.startsWith('sky-image://')) {
    result = s;
  } else if (s.startsWith('file:///')) {
    const decoded = decodeURIComponent(s.slice(8)).replace(/\//g, '\\');
    result = `sky-image://local/${encodeURIComponent(decoded)}`;
  } else if (s.startsWith('file://')) {
    const decoded = decodeURIComponent(s.slice(7)).replace(/\//g, '\\');
    result = `sky-image://local/${encodeURIComponent(decoded)}`;
  }

  if (urlCache.size >= MAX_CACHE_SIZE) {
    const firstKey = urlCache.keys().next().value;
    if (firstKey) urlCache.delete(firstKey);
  }
  urlCache.set(s, result);

  return result;
}
