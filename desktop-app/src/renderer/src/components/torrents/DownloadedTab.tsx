import { useState, useMemo } from 'react';
import { Search, FolderOpen, Trash2, CheckCircle2, HardDrive } from 'lucide-react';
import type { TorrentInfo } from '@shared/ipc';
import { useTorrentDownloads } from '../../hooks/useTorrent';
import { formatBytes } from './utils';
import { GlassSelect } from '../common';

export function DownloadedTab() {
  const { torrents, remove, deleteFiles, openFolder } = useTorrentDownloads();
  const [query, setQuery]     = useState('');
  const [sortBy, setSortBy]   = useState<'date' | 'name' | 'size'>('date');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const completed = useMemo(() => {
    const all = torrents.filter((t) => t.status === 'completed');
    const filtered = query ? all.filter((t) => t.name.toLowerCase().includes(query.toLowerCase())) : all;
    return filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return b.totalSize - a.totalSize;
      return (b.completedAt ?? b.addedAt).localeCompare(a.completedAt ?? a.addedAt);
    });
  }, [torrents, query, sortBy]);

  const totalSize = useMemo(() => completed.reduce((acc, t) => acc + t.totalSize, 0), [completed]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter completed…"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white/70 placeholder-white/25 focus:outline-none focus:border-white/20"
          />
        </div>
        <GlassSelect
          size="sm"
          ariaLabel="Sort downloads"
          options={[
            { value: 'date' as const, label: 'Recent first' },
            { value: 'name' as const, label: 'Name' },
            { value: 'size' as const, label: 'Size' },
          ]}
          value={sortBy}
          onChange={setSortBy}
        />
        <span className="text-xs text-white/30 flex-shrink-0">
          <HardDrive size={12} className="inline mr-1" />{formatBytes(totalSize)}
        </span>
      </div>

      {completed.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-white/20">
          <CheckCircle2 size={44} className="mb-3 opacity-30" />
          <p className="text-sm">No completed downloads</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {completed.map((t) => (
            <CompletedCard
              key={t.id}
              torrent={t}
              onOpen={() => openFolder(t.id)}
              onRemove={() => setConfirmId(t.id)}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1d23] border border-white/10 rounded-2xl p-6 w-80 shadow-2xl">
            <h3 className="font-semibold text-white mb-2">Remove from library?</h3>
            <p className="text-sm text-white/50 mb-5">Delete files permanently, or just remove the record?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmId(null)} className="px-3 py-1.5 text-sm text-white/50 hover:text-white transition-colors">Cancel</button>
              <button onClick={() => { remove(confirmId); setConfirmId(null); }} className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors">Remove only</button>
              <button onClick={() => { deleteFiles(confirmId); setConfirmId(null); }} className="px-3 py-1.5 text-sm bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors">Delete files</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CompletedCard({ torrent, onOpen, onRemove }: { torrent: TorrentInfo; onOpen(): void; onRemove(): void }) {
  const date = torrent.completedAt
    ? new Date(torrent.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl px-3 py-2.5 transition-all">
      <CheckCircle2 size={16} className="text-blue-400/70 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80 truncate">{torrent.name}</p>
        <p className="text-xs text-white/35 mt-0.5 truncate">
          {formatBytes(torrent.totalSize)} · {torrent.savePath}
          {date && ` · Completed ${date}`}
        </p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={onOpen} title="Open folder" className="p-1.5 rounded-lg text-white/35 hover:text-white/70 hover:bg-white/8 transition-colors">
          <FolderOpen size={14} />
        </button>
        <button onClick={onRemove} title="Remove" className="p-1.5 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
