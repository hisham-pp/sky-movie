/**
 * Safely prepares an image URL for rendering in the Electron UI.
 * If a legacy `file:///` URL is encountered, it converts it to the privileged
 * `sky-image://local/<encoded-path>` scheme so Chromium does not block it
 * with "Not allowed to load local resource" in development or production.
 */
export function toDisplayImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const s = String(url).trim();
  if (!s) return null;

  if (s.startsWith('sky-image://')) return s;

  if (s.startsWith('file:///')) {
    // Strip file:/// and decode path characters
    const decoded = decodeURIComponent(s.slice(8)).replace(/\//g, '\\');
    return `sky-image://local/${encodeURIComponent(decoded)}`;
  }

  if (s.startsWith('file://')) {
    const decoded = decodeURIComponent(s.slice(7)).replace(/\//g, '\\');
    return `sky-image://local/${encodeURIComponent(decoded)}`;
  }

  return s;
}
