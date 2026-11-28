const urlCache = new Map<string, string>();
const MAX_CACHE_SIZE = 1000;

/**
 * Safely prepares an image URL for rendering in the Next.js UI.
 * Converts legacy `sky-image://local/<encoded-path>` or `file://` URLs to
 * the Next.js `/api/images?path=<encoded-path>` route so standard web browsers
 * can load cached artwork cleanly.
 */
export function toDisplayImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const s = String(url).trim();
  if (!s) return null;

  const cached = urlCache.get(s);
  if (cached !== undefined) return cached;

  let result = s;
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/api/images')) {
    result = s;
  } else if (s.startsWith('sky-image://local/')) {
    result = `/api/images?path=${s.slice('sky-image://local/'.length)}`;
  } else if (s.startsWith('file:///')) {
    const decoded = decodeURIComponent(s.slice(8)).replace(/\//g, '\\');
    result = `/api/images?path=${encodeURIComponent(decoded)}`;
  } else if (s.startsWith('file://')) {
    const decoded = decodeURIComponent(s.slice(7)).replace(/\//g, '\\');
    result = `/api/images?path=${encodeURIComponent(decoded)}`;
  } else if (s.includes(':\\') || s.startsWith('/') || s.startsWith('\\')) {
    result = `/api/images?path=${encodeURIComponent(s)}`;
  }

  if (urlCache.size >= MAX_CACHE_SIZE) {
    const firstKey = urlCache.keys().next().value;
    if (firstKey) urlCache.delete(firstKey);
  }
  urlCache.set(s, result);

  return result;
}
