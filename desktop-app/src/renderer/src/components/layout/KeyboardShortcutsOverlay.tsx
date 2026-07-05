import { useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';
import { KEYBOARD_SHORTCUTS } from '../../config/keyboardShortcuts';
import { Tooltip } from '../common';

export function KeyboardShortcutsOverlay({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose(): void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <header className="shortcuts-header">
          <Keyboard size={18} />
          <h3>Keyboard Shortcuts</h3>
          <Tooltip content="Close (Esc)">
            <button className="shortcuts-close" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </Tooltip>
        </header>

        <div className="shortcuts-sections">
          {KEYBOARD_SHORTCUTS.map((section) => (
            <section key={section.title} className="shortcuts-section">
              <h4>{section.title}</h4>
              {section.shortcuts.map((s) => (
                <div key={`${section.title}-${s.keys.join('+')}-${s.description}`} className="shortcuts-row">
                  <span className="shortcuts-desc">{s.description}</span>
                  <span className="shortcuts-keys">
                    {s.keys.map((key, i) => (
                      <kbd key={i}>{key}</kbd>
                    ))}
                  </span>
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
