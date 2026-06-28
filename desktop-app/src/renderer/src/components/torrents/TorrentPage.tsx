import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Download, CheckCircle2, Settings } from 'lucide-react';
import { SearchTab }            from './SearchTab';
import { DownloadsTab }         from './DownloadsTab';
import { DownloadedTab }        from './DownloadedTab';
import { TorrentSettingsTab }   from './TorrentSettingsTab';

type Tab = 'search' | 'downloads' | 'downloaded' | 'settings';
const VALID_TABS: Tab[] = ['search', 'downloads', 'downloaded', 'settings'];
const LS_KEY = 'sky-movie:torrent-tab';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'search',     label: 'Search',      icon: <Search size={14} /> },
  { id: 'downloads',  label: 'Downloads',   icon: <Download size={14} /> },
  { id: 'downloaded', label: 'Downloaded',  icon: <CheckCircle2 size={14} /> },
  { id: 'settings',   label: 'Settings',    icon: <Settings size={14} /> },
];

export function TorrentPage() {
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

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Tab bar */}
      <div className="flex items-center border-b border-white/5 px-4 pt-12">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all mr-1 ${
              activeTab === tab.id
                ? 'border-[var(--primary)] text-white'
                : 'border-transparent text-white/40 hover:text-white/65 hover:border-white/20'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'search'     && <SearchTab />}
        {activeTab === 'downloads'  && <DownloadsTab />}
        {activeTab === 'downloaded' && <DownloadedTab />}
        {activeTab === 'settings'   && <TorrentSettingsTab />}
      </div>
    </div>
  );
}
