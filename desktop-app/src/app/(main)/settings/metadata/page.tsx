'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MetadataRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/settings/library#metadata');
  }, [router]);
  return null;
}
