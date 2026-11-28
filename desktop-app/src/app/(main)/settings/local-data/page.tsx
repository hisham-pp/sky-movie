'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LocalDataRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/settings/library#local-data');
  }, [router]);
  return null;
}
