'use client';

import { useMemo, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Download, CheckCircle2, Settings, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useTorrentDownloads } from '@/hooks/useTorrent';
import { formatSpeed } from './utils';
import { PillTabs, type PillTab } from '../common';

export type TorrentTab = 'search' | 'downloads' | 'downloaded' | 'settings';

const LS_KEY = 'sky-movie:torrent-tab';

const BASE_TABS: PillTab<TorrentTab>[] = [
  { id: 'search', label: 'Search', icon: <Search size={14} /> },
  { id: 'downloads', label: 'Downloads', icon: <Download size={14} /> },
  { id: 'downloaded', label: 'Downloaded', icon: <CheckCircle2 size={14} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={14} /> },
];

export function TorrentShell({ children }: { children: ReactNode }) {
  const { stats } = useTorrentDownloads();
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = useMemo<TorrentTab>(() => {
    if (pathname.includes('/downloads/downloads') || pathname.includes('/downloads/active')) return 'downloads';
    if (pathname.includes('/downloads/downloaded')) return 'downloaded';
    if (pathname.includes('/downloads/settings')) return 'settings';
    return 'search';
  }, [pathname]);

  const handleTabChange = (tab: TorrentTab) => {
    localStorage.setItem(LS_KEY, tab);
    router.push(`/downloads/${tab}`);
  };

  // Build tabs with live badge counts
  const pillTabs = useMemo<PillTab<TorrentTab>[]>(() =>
    BASE_TABS.map((tab) => {
      const badge =
        tab.id === 'downloads'
          ? stats.activeTorrents
          : tab.id === 'downloaded'
            ? (stats.totalTorrents - stats.activeTorrents)
            : undefined;
      return badge && badge > 0 ? { ...tab, badge } : tab;
    }),
    [stats.activeTorrents, stats.totalTorrents],
  );

  return (
    <div className="browse-grid">
      <section className="library-list torrent-page-scroller">
        <div className="torrent-header-clean mt-6 mb-5">
          <div className="torrent-header-title">
            <Download size={26} className="text-[var(--primary)]" />
            <div>
              <span className="playlist-browse-kicker">Transfers</span>
              <h1 className="text-2xl font-bold text-[var(--ink)]">Torrents & Downloads</h1>
            </div>
          </div>

          <div className="torrent-header-stats">
            <span className="torrent-stat-pill">
              <ArrowDownToLine size={13} className="text-emerald-400" />
              <span>{formatSpeed(stats.downloadSpeed)}</span>
            </span>
            <span className="torrent-stat-pill">
              <ArrowUpFromLine size={13} className="text-blue-400" />
              <span>{formatSpeed(stats.uploadSpeed)}</span>
            </span>
            {stats.activeTorrents > 0 && (
              <span className="torrent-stat-pill torrent-stat-pill--active">
                <span className="torrent-stat-active-dot" />
                <span>{stats.activeTorrents} active</span>
              </span>
            )}
          </div>
        </div>

        {/* Cinema Tab Pills */}
        <div className="mb-6">
          <PillTabs tabs={pillTabs} value={activeTab} onChange={handleTabChange} />
        </div>

        {/* Tab content */}
        <div className="torrent-tab-viewport">
          {children}
        </div>
      </section>
    </div>
  );
}
