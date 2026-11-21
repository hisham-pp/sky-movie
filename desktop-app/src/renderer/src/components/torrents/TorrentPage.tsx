import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Download, CheckCircle2, Settings, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { SearchTab } from './SearchTab';
import { DownloadsTab } from './DownloadsTab';
import { DownloadedTab } from './DownloadedTab';
import { TorrentSettingsTab } from './TorrentSettingsTab';
import { useTorrentDownloads } from '../../hooks/useTorrent';
import { formatSpeed } from './utils';
import { PillTabs, type PillTab } from '../common';

type Tab = 'search' | 'downloads' | 'downloaded' | 'settings';
const VALID_TABS: Tab[] = ['search', 'downloads', 'downloaded', 'settings'];
const LS_KEY = 'sky-movie:torrent-tab';

const BASE_TABS: PillTab<Tab>[] = [
  { id: 'search', label: 'Search', icon: <Search size={14} /> },
  { id: 'downloads', label: 'Downloads', icon: <Download size={14} /> },
  { id: 'downloaded', label: 'Downloaded', icon: <CheckCircle2 size={14} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={14} /> },
];

export function TorrentPage() {
  const { stats } = useTorrentDownloads();
  const [searchParams] = useSearchParams();
  const paramTab = searchParams.get('tab') as Tab | null;
  const initialTab: Tab = (paramTab && VALID_TABS.includes(paramTab))
    ? paramTab
    : ((localStorage.getItem(LS_KEY) as Tab | null) ?? 'search');

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Sync URL param changes (e.g. from search modal deep-link)
  useEffect(() => {
    if (paramTab && VALID_TABS.includes(paramTab) && paramTab !== activeTab) {
      setActiveTab(paramTab);
    }
  }, [paramTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    localStorage.setItem(LS_KEY, tab);
  };

  // Build tabs with live badge counts
  const pillTabs = useMemo<PillTab<Tab>[]>(() =>
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
            <span className="section-badge">
              <ArrowDownToLine size={13} className="text-emerald-400 mr-1 inline" />
              {formatSpeed(stats.downloadSpeed)}
            </span>
            <span className="section-badge">
              <ArrowUpFromLine size={13} className="text-blue-400 mr-1 inline" />
              {formatSpeed(stats.uploadSpeed)}
            </span>
            {stats.activeTorrents > 0 && (
              <span className="section-badge">
                {stats.activeTorrents} active
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
          {activeTab === 'search' && <SearchTab />}
          {activeTab === 'downloads' && <DownloadsTab />}
          {activeTab === 'downloaded' && <DownloadedTab />}
          {activeTab === 'settings' && <TorrentSettingsTab />}
        </div>
      </section>
    </div>
  );
}
