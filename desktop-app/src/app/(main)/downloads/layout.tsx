'use client';

import { usePathname } from 'next/navigation';
import { TorrentShell } from '@/components/torrents/TorrentShell';

export default function DownloadsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/downloads/stream')) {
    return <>{children}</>;
  }
  return <TorrentShell>{children}</TorrentShell>;
}
