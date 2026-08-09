import { memo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Folder, FolderOpen, Trash2, X } from 'lucide-react';
import type { MediaFile } from '@shared/ipc';
import { Modal, ModalFooter, Button, Tooltip } from '../common';

interface MediaOptionsMenuProps {
  files: MediaFile[];
  onShowInFolder: (file: MediaFile) => void;
  onDeleteSomeFiles: () => void;
}

export const MediaOptionsMenu = memo(function MediaOptionsMenu({
  files,
  onShowInFolder,
  onDeleteSomeFiles
}: MediaOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current && 
        !menuRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
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
    setIsOpen(false);
    onDeleteSomeFiles();
    // Remove focus from the button
    if (buttonRef.current) {
      const button = buttonRef.current.querySelector('button');
      if (button) {
        button.blur();
      }
    }
  };

  return (
    <>
      <div className="media-options-menu" ref={menuRef}>
        <div ref={buttonRef}>
          <Tooltip content="More options">
            <Button
              variant="secondary"
              size="small"
              icon={<MoreVertical size={14} />}
              onClick={() => setIsOpen(!isOpen)}
            />
          </Tooltip>
        </div>

        {isOpen && createPortal(
          <div 
            ref={dropdownRef}
            className="media-options-dropdown" 
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`
            }}
          >
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
          </div>,
          document.body
        )}
      </div>
    </>
  );
});

interface DeleteFilesDialogProps {
  files: MediaFile[];
  onCancel: () => void;
  onConfirm: (files: MediaFile[]) => void;
}

export const DeleteFilesDialog = memo(function DeleteFilesDialog({
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
    <Modal isOpen={true} onClose={onCancel} title="Delete Files" maxWidth="small">
      <div style={{ pointerEvents: 'auto' }}>
        <p className="delete-warning">Select files to delete. This action cannot be undone.</p>
        <div className="file-selection-list">
          {files.map((file) => (
            <div 
              key={file.id} 
              className="file-selection-item" 
              onClick={(e) => {
                e.stopPropagation();
                toggleFile(file.id);
              }}
              style={{ pointerEvents: 'auto' }}
            >
              <input
                type="checkbox"
                checked={selectedFiles.has(file.id)}
                onChange={() => {}}
                readOnly
                style={{ pointerEvents: 'auto' }}
              />
              <span className="file-name">{file.fileName}</span>
            </div>
          ))}
        </div>
      </div>
      <ModalFooter>
        <Button variant="secondary" size="medium" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="danger"
          size="medium"
          onClick={handleConfirm}
          disabled={selectedFiles.size === 0}
        >
          {selectedFiles.size > 0 
            ? `Delete ${selectedFiles.size} file${selectedFiles.size === 1 ? '' : 's'}` 
            : 'Delete'}
        </Button>
      </ModalFooter>
    </Modal>
  );
});
