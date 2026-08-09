import { ReactNode, MouseEvent } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: 'small' | 'medium' | 'large' | 'xlarge';
  showCloseButton?: boolean;
  customContent?: boolean; // For fully custom modal content
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'medium',
  showCloseButton = true,
  customContent = false
}: ModalProps) {
  if (!isOpen) return null;

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const maxWidthClass = `modal-${maxWidth}`;

  // If customContent is true, render children directly without wrapper structure
  if (customContent) {
    return (
      <div className="modal-overlay" onClick={handleOverlayClick}>
        {children}
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-content ${maxWidthClass}`} onClick={(e) => e.stopPropagation()}>
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && <h3>{title}</h3>}
            {showCloseButton && (
              <button className="modal-close-button" onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

interface ModalFooterProps {
  children: ReactNode;
}

export function ModalFooter({ children }: ModalFooterProps) {
  return <div className="modal-footer">{children}</div>;
}
