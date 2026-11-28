'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BackupsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/settings/library#backups');
  }, [router]);
  return null;
}
