'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const VALID_TABS = ['search', 'downloads', 'downloaded', 'settings'];

function DownloadsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const paramTab = searchParams.get('tab');
    if (paramTab && VALID_TABS.includes(paramTab)) {
      router.replace(`/downloads/${paramTab}`);
      return;
    }
    const stored = typeof window !== 'undefined' ? localStorage.getItem('sky-movie:torrent-tab') : null;
    const target = stored && VALID_TABS.includes(stored) ? stored : 'search';
    router.replace(`/downloads/${target}`);
  }, [router, searchParams]);

  return null;
}

export default function DownloadsPage() {
  return (
    <Suspense fallback={null}>
      <DownloadsRedirect />
    </Suspense>
  );
}
