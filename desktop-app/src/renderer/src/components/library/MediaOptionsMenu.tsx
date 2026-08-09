import { memo, useState, useRef, useEffect } from 'react';
import { MoreVertical, Folder, FolderOpen, Trash2 } from 'lucide-react';
import type { MediaFile } from '@shared/ipc';

interface MediaOptionsMenuProps {
  files: MediaFile[];
  onDeleteFiles: (files: MediaFile[]) => void;
  onShowInFolder: (file: MediaFile) => void;
}

export const MediaOptionsMenu = memo(function MediaOptionsMenu({
  files,
  onDeleteFiles,
  onShowInFolder
}: MediaOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOpenDirectory = () => {
    if (files.length > 0) {
      onShowInFolder(files[0]);
    }
    setIsOpen(false);
  };

  const handleDeleteSomeFiles = () => {
    setShowDeleteDialog(true);
    setIsOpen(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const handleConfirmDelete = (selectedFiles: MediaFile[]) => {
    onDeleteFiles(selectedFiles);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="media-options-menu" ref={menuRef}>
        <button
          className="media-options-trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="More options"
        >
          <MoreVertical size={14} />
        </button>

        {isOpen && (
          <div className="media-options-dropdown">
            <button className="menu-item" onClick={handleOpenDirectory} disabled={files.length === 0}>
              <FolderOpen size={16} />
              <span>Open directory</span>
            </button>
            <div className="menu-divider" />
            <div className="menu-section-title">Bulk actions</div>
            <button className="menu-item danger" onClick={handleDeleteSomeFiles} disabled={files.length === 0}>
              <Trash2 size={16} />
              <span>Delete some files</span>
            </button>
          </div>
        )}
      </div>

      {showDeleteDialog && (
        <DeleteFilesDialog
          files={files}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
});

interface DeleteFilesDialogProps {
  files: MediaFile[];
  onCancel: () => void;
  onConfirm: (files: MediaFile[]) => void;
}

const DeleteFilesDialog = memo(function DeleteFilesDialog({
  files,
  onCancel,
  onConfirm
}: DeleteFilesDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());

  const toggleFile = (fileId: number) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const filesToDelete = files.filter((f) => selectedFiles.has(f.id));
    onConfirm(filesToDelete);
  };

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="delete-files-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Delete Files</h3>
          <button className="dialog-close-btn" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>
        <div className="dialog-body">
          <p className="delete-warning">Select files to delete. This action cannot be undone.</p>
          <div className="file-selection-list">
            {files.map((file) => (
              <label key={file.id} className="file-selection-item">
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.id)}
                  onChange={() => toggleFile(file.id)}
                />
                <span className="file-name">{file.fileName}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="dialog-footer">
          <button className="btn btn-secondary btn-medium" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-danger btn-medium"
            onClick={handleConfirm}
            disabled={selectedFiles.size === 0}
          >
            Delete {selectedFiles.size > 0 ? `${selectedFiles.size} file${selectedFiles.size === 1 ? '' : 's'}` : ''}
          </button>
        </div>
      </div>
    </div>
  );
});
