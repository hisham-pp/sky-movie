import type { ScanResult } from '@shared/ipc';

export function StatusBar({ status, lastScan }: { status: string; lastScan: ScanResult | null }) {
  return (
    <footer className="statusbar">
      <span>{status}</span>
      {lastScan ? (
        <span>
          {lastScan.movieMatches} movie matches, {lastScan.showMatches} show matches
        </span>
      ) : null}
    </footer>
  );
}
