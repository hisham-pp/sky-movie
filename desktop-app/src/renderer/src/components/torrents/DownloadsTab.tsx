import { useState } from 'react';
import {
  Pause, Play, Trash2, FolderOpen, RotateCcw, StopCircle,
  ArrowDownToLine, ArrowUpFromLine
} from 'lucide-react';
import type { TorrentInfo } from '@shared/ipc';
import { useTorrentDownloads } from '../../hooks/useTorrent';
import { formatBytes, formatSpeed, formatEta, statusLabel, statusColor } from './utils';

export function DownloadsTab() {
  const { torrents, stats, loading, pause, resume, remove, deleteFiles, openFolder, recheck } = useTorrentDownloads();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; withFiles: boolean } | null>(null);

  const activeTorrents = torrents.filter((t) => t.status !== 'completed');

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: string, withFiles: boolean) => {
    setConfirmDelete(null);
    if (withFiles) await deleteFiles(id);
    else await remove(id);
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-white/30">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mr-3" />
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Global stats bar */}
      <div className="flex items-center gap-6 px-4 py-2.5 border-b border-white/5 text-xs text-white/50">
        <span className="flex items-center gap-1.5">
          <ArrowDownToLine size={12} className="text-emerald-400" />
          {formatSpeed(stats.downloadSpeed)}
        </span>
        <span className="flex items-center gap-1.5">
          <ArrowUpFromLine size={12} className="text-blue-400" />
          {formatSpeed(stats.uploadSpeed)}
        </span>
        <span>{stats.activeTorrents} active · {stats.totalTorrents} total</span>
      </div>

      {activeTorrents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-white/20">
          <ArrowDownToLine size={44} className="mb-3 opacity-30" />
          <p className="text-sm">No active downloads</p>
          <p className="text-xs mt-1 opacity-70">Use Search to add torrents</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {activeTorrents.map((torrent) => (
            <TorrentCard
              key={torrent.id}
              torrent={torrent}
              selected={selected.has(torrent.id)}
              onSelect={() => toggleSelect(torrent.id)}
              onPause={() => pause(torrent.id)}
              onResume={() => resume(torrent.id)}
              onDelete={() => setConfirmDelete({ id: torrent.id, withFiles: false })}
              onDeleteFiles={() => setConfirmDelete({ id: torrent.id, withFiles: true })}
              onOpenFolder={() => openFolder(torrent.id)}
              onRecheck={() => recheck(torrent.id)}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1d23] border border-white/10 rounded-2xl p-6 w-80 shadow-2xl">
            <h3 className="font-semibold text-white mb-2">Remove torrent?</h3>
            <p className="text-sm text-white/50 mb-5">
              {confirmDelete.withFiles
                ? 'This will remove the torrent and permanently delete all downloaded files.'
                : 'This will remove the torrent. Downloaded files will be kept.'}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id, confirmDelete.withFiles)}
                className="px-4 py-2 rounded-lg text-sm bg-red-500/80 hover:bg-red-500 text-white font-medium transition-colors"
              >
                {confirmDelete.withFiles ? 'Delete files' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TorrentCardProps {
  torrent: TorrentInfo;
  selected: boolean;
  onSelect(): void;
  onPause(): void;
  onResume(): void;
  onDelete(): void;
  onDeleteFiles(): void;
  onOpenFolder(): void;
  onRecheck(): void;
}

function TorrentCard({ torrent, selected, onSelect, onPause, onResume, onDelete, onDeleteFiles, onOpenFolder, onRecheck }: TorrentCardProps) {
  const isPaused    = torrent.status === 'paused';
  const isCompleted = torrent.status === 'completed';
  const pct         = Math.round(torrent.progress * 100);

  return (
    <div
      className={`rounded-xl border p-3 transition-all cursor-pointer ${
        selected
          ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30'
          : 'bg-white/[0.03] hover:bg-white/[0.05] border-white/5 hover:border-white/10'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Poster placeholder */}
        <div className="flex-shrink-0 w-9 h-12 rounded-md bg-white/5 flex items-center justify-center text-white/15 text-[10px]">
          {torrent.category[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-white/85 font-medium leading-tight truncate">{torrent.name}</p>
            <span className={`text-xs font-medium flex-shrink-0 ${statusColor(torrent.status)}`}>
              {statusLabel(torrent.status)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: isCompleted ? '#3b82f6' : 'var(--primary)' }}
            />
          </div>

          {/* Stats row */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-white/40">
            <span>{pct}%</span>
            <span className="text-emerald-400/80">↓ {formatSpeed(torrent.downloadSpeed)}</span>
            <span className="text-blue-400/80">↑ {formatSpeed(torrent.uploadSpeed)}</span>
            <span>ETA {formatEta(torrent.eta)}</span>
            <span>{formatBytes(torrent.downloaded)} / {formatBytes(torrent.totalSize)}</span>
            <span>{torrent.numPeers}P · {torrent.numSeeds}S</span>
            <span>Ratio {torrent.ratio.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div
        className="flex items-center gap-1 mt-2.5 pt-2 border-t border-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        {isPaused ? (
          <ActionBtn onClick={onResume} title="Resume"><Play size={13} /></ActionBtn>
        ) : (
          <ActionBtn onClick={onPause} title="Pause"><Pause size={13} /></ActionBtn>
        )}
        <ActionBtn onClick={onRecheck} title="Recheck"><RotateCcw size={13} /></ActionBtn>
        <ActionBtn onClick={onOpenFolder} title="Open folder"><FolderOpen size={13} /></ActionBtn>
        <div className="flex-1" />
        <ActionBtn onClick={onDelete} title="Remove" danger><StopCircle size={13} /></ActionBtn>
        <ActionBtn onClick={onDeleteFiles} title="Delete files" danger><Trash2 size={13} /></ActionBtn>
      </div>
    </div>
  );
}

function ActionBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick(): void; title: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${
        danger
          ? 'text-red-400/50 hover:text-red-400 hover:bg-red-500/10'
          : 'text-white/40 hover:text-white/75 hover:bg-white/8'
      }`}
    >
      {children}
    </button>
  );
}
