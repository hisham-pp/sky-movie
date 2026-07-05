import { memo, useCallback } from 'react';
import { Play, FolderOpen, Trash2, FolderSearch } from 'lucide-react';
import type { MediaFile } from '@shared/ipc';
import { Tooltip } from '../common';
import { formatBytes } from '../../utils/format';

interface FileRowProps {
  file: MediaFile;
  onPlay(file: MediaFile): void;
  onDelete(file: MediaFile): void;
  onShowInFolder(file: MediaFile): void;
}

const FileRow = memo(function FileRow({ file, onPlay, onDelete, onShowInFolder }: FileRowProps) {
  const handlePlay = useCallback(() => onPlay(file), [file, onPlay]);
  const handleShowInFolder = useCallback(() => onShowInFolder(file), [file, onShowInFolder]);
  const handleDelete = useCallback(() => onDelete(file), [file, onDelete]);

  return (
    <div className="file-row">
      <Tooltip content={file.fileName}>
        <button onClick={handlePlay} className="file-play-button">
          <Play size={16} />
          <span>{file.fileName}</span>
          <small>{formatBytes(file.fileSize)}</small>
        </button>
      </Tooltip>
      <div className="file-actions">
        <Tooltip content="Show in file manager">
          <button aria-label="Show in file manager" onClick={handleShowInFolder} className="file-action-button">
            <FolderOpen size={16} />
          </button>
        </Tooltip>
        <Tooltip content="Delete file">
          <button aria-label="Delete file" onClick={handleDelete} className="file-action-button file-delete-button">
            <Trash2 size={16} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
});

export const FileList = memo(function FileList({
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
          <FileRow key={file.id} file={file} onPlay={onPlay} onDelete={onDelete} onShowInFolder={onShowInFolder} />
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
});
