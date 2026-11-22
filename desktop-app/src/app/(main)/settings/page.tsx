'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const VALID_TABS = ['appearance', 'library', 'updates', 'help'];
const SUB_TAB_MAP: Record<string, string> = {
  metadata: 'library',
  backups: 'library',
  downloads: 'library',
  'local-data': 'library',
};

function SettingsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const paramTab = searchParams.get('tab');
    if (paramTab) {
      if (VALID_TABS.includes(paramTab)) {
        router.replace(`/settings/${paramTab}`);
        return;
      }
      if (paramTab in SUB_TAB_MAP) {
        router.replace(`/settings/${SUB_TAB_MAP[paramTab]}`);
        return;
      }
    }
    const stored = typeof window !== 'undefined' ? localStorage.getItem('sky-movie:settings-tab') : null;
    const target = stored && VALID_TABS.includes(stored) ? stored : 'appearance';
    router.replace(`/settings/${target}`);
  }, [router, searchParams]);

  return null;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsRedirect />
    </Suspense>
  );
}
