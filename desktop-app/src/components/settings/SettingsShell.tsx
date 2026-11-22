'use client';

import { useMemo, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Palette, Library, Zap, LifeBuoy } from 'lucide-react';
import { PillTabs, type PillTab } from '../common';

export type SettingsTab = 'appearance' | 'library' | 'updates' | 'help';

const LS_KEY = 'sky-movie:settings-tab';

export const SETTINGS_TABS: Array<PillTab<SettingsTab>> = [
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
  { id: 'library', label: 'Library & Data', icon: <Library size={16} /> },
  { id: 'updates', label: 'Updates', icon: <Zap size={16} /> },
  { id: 'help', label: 'Help', icon: <LifeBuoy size={16} /> },
];

export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = useMemo<SettingsTab>(() => {
    if (pathname.startsWith('/settings/library')) return 'library';
    if (pathname.startsWith('/settings/updates')) return 'updates';
    if (pathname.startsWith('/settings/help')) return 'help';
    return 'appearance';
  }, [pathname]);

  const handleTabChange = (tab: SettingsTab) => {
    localStorage.setItem(LS_KEY, tab);
    router.push(`/settings/${tab}`);
  };

  return (
    <div className="settings-page">
      {/* Left sidebar — header + vertical nav */}
      <aside className="settings-nav">
        <div className="settings-nav-header">
          <h2>Settings</h2>
          <p>Manage the local vault, metadata matching, backups, and exports.</p>
        </div>

        <PillTabs
          orientation="vertical"
          variant="subtle"
          tabs={SETTINGS_TABS}
          value={activeTab}
          onChange={handleTabChange}
          ariaLabel="Settings sections"
        />
      </aside>

      {/* Right content area */}
      <main className="settings-content" role="tabpanel">
        {children}
      </main>
    </div>
  );
}
