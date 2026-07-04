import * as torrentApi from '@renderer/queries/torrents';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AddMagnetRequest,
  TorrentGlobalStats,
  TorrentInfo,
  TorrentProgressEvent,
  TorrentSearchRequest,
  TorrentSearchResult,
  TorrentSettings,
} from '@shared/ipc';


// ── Active downloads hook ──────────────────────────────────────────────────

export function useTorrentDownloads() {
  const [torrents, setTorrents] = useState<TorrentInfo[]>([]);
  const [stats, setStats] = useState<TorrentGlobalStats>({ downloadSpeed: 0, uploadSpeed: 0, activeTorrents: 0, totalTorrents: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [list, globalStats] = await Promise.all([
      torrentApi.torrentList(),
      torrentApi.torrentStats(),
    ]);
    setTorrents(list);
    setStats(globalStats);
  }, []);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));

    const unsub = torrentApi.onTorrentProgress((ev: TorrentProgressEvent) => {
      setTorrents((prev) =>
        prev.map((t) =>
          t.id === ev.id
            ? {
                ...t,
                progress:      ev.progress,
                downloadSpeed: ev.downloadSpeed,
                uploadSpeed:   ev.uploadSpeed,
                downloaded:    ev.downloaded,
                uploaded:      ev.uploaded,
                numPeers:      ev.numPeers,
                numSeeds:      ev.numSeeds,
                eta:           ev.eta,
                ratio:         ev.ratio,
                status:        ev.status,
              }
            : t
        )
      );
    });

    const pollId = setInterval(refresh, 5_000);

    return () => {
      unsub();
      clearInterval(pollId);
    };
  }, [refresh]);

  const pause         = useCallback((id: string) => torrentApi.torrentPause(id).then(refresh), [refresh]);
  const resume        = useCallback((id: string) => torrentApi.torrentResume(id).then(refresh), [refresh]);
  const remove        = useCallback((id: string) => torrentApi.torrentRemove(id).then(refresh), [refresh]);
  const deleteFiles   = useCallback((id: string) => torrentApi.torrentDeleteFiles(id).then(refresh), [refresh]);
  const openFolder    = useCallback((id: string) => torrentApi.torrentOpenFolder(id), []);
  const recheck       = useCallback((id: string) => torrentApi.torrentRecheck(id).then(refresh), [refresh]);
  const addMagnet     = useCallback(async (req: AddMagnetRequest) => {
    const info = await torrentApi.torrentAddMagnet(req);
    await refresh();
    return info;
  }, [refresh]);

  return { torrents, stats, loading, refresh, pause, resume, remove, deleteFiles, openFolder, recheck, addMagnet };
}

// ── Search hook ────────────────────────────────────────────────────────────

export function useTorrentSearch() {
  const [results, setResults] = useState<TorrentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((req: TorrentSearchRequest) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!req.query.trim()) { setResults([]); return; }
      setLoading(true);
      setError(null);
      try {
        const res = await torrentApi.torrentSearch(req);
        setResults(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  return { results, loading, error, search };
}

// ── Settings hook ──────────────────────────────────────────────────────────

export function useTorrentSettings() {
  const [settings, setSettings] = useState<TorrentSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    torrentApi.torrentGetSettings().then(setSettings);
  }, []);

  const update = useCallback(async (patch: Partial<TorrentSettings>) => {
    setSaving(true);
    try {
      const updated = await torrentApi.torrentUpdateSettings(patch);
      setSettings(updated);
    } finally {
      setSaving(false);
    }
  }, []);

  return { settings, saving, update };
}
