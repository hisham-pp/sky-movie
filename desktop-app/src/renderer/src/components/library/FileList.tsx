import { Play, FolderOpen, Trash2, FolderSearch } from 'lucide-react';
import type { MediaFile } from '@shared/ipc';
import { formatBytes } from '../../utils/format';

export function FileList({
  files,
  emptyLabel,
  onPlay,
  onDelete,
  onShowInFolder
}: {
  files: MediaFile[];
  emptyLabel: string;
  onPlay(file: MediaFile): void;
  onDelete(file: MediaFile): void;
  onShowInFolder(file: MediaFile): void;
}) {
  return (
    <section className="detail-card">
      <div className="section-title">
        <h2>Local Files</h2>
        <span>{files.length} files</span>
      </div>
      <div className="file-list">
        {files.map((file) => (
          <div key={file.id} className="file-row">
            <button title={file.fileName} onClick={() => onPlay(file)} className="file-play-button">
              <Play size={16} />
              <span>{file.fileName}</span>
              <small>{formatBytes(file.fileSize)}</small>
            </button>
            <div className="file-actions">
              <button 
                title="Show in file manager" 
                onClick={() => onShowInFolder(file)}
                className="file-action-button"
              >
                <FolderOpen size={16} />
              </button>
              <button 
                title="Delete file" 
                onClick={() => onDelete(file)}
                className="file-action-button file-delete-button"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {!files.length ? (
          <div className="detail-empty">
            <FolderSearch size={22} />
            <span>{emptyLabel}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
