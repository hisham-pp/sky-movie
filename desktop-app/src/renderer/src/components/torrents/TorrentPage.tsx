import { useState } from 'react';
import { Search, Download, CheckCircle2, Settings } from 'lucide-react';
import { SearchTab }            from './SearchTab';
import { DownloadsTab }         from './DownloadsTab';
import { DownloadedTab }        from './DownloadedTab';
import { TorrentSettingsTab }   from './TorrentSettingsTab';

type Tab = 'search' | 'downloads' | 'downloaded' | 'settings';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'search',     label: 'Search',      icon: <Search size={14} /> },
  { id: 'downloads',  label: 'Downloads',   icon: <Download size={14} /> },
  { id: 'downloaded', label: 'Downloaded',  icon: <CheckCircle2 size={14} /> },
  { id: 'settings',   label: 'Settings',    icon: <Settings size={14} /> },
];

export function TorrentPage() {
  const [activeTab, setActiveTab] = useState<Tab>('search');

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Tab bar */}
      <div className="flex items-center border-b border-white/5 px-4 pt-12">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all mr-1 ${
              activeTab === tab.id
                ? 'border-[var(--color-primary)] text-white'
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
