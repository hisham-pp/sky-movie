'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DownloadsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/settings/library#downloads');
  }, [router]);
  return null;
}
