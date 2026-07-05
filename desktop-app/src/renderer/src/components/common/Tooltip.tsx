import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { createPortal } from 'react-dom';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

const GAP = 8;           // distance between trigger and tooltip
const VIEWPORT_PAD = 8;  // minimum distance from viewport edges

interface TooltipProps {
  /** Anything renderable: plain text, formatted spans, icons, a component. */
  content: ReactNode;
  children: ReactNode;
  placement?: TooltipPlacement;
  /** Delay before showing, in ms. Hiding is always instant. */
  delay?: number;
  /** Render the trigger without a tooltip (e.g. when a label is redundant). */
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 300,
  disabled = false
}: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; placement: TooltipPlacement } | null>(null);

  const show = useCallback(() => {
    if (showTimer.current) clearTimeout(showTimer.current);
    showTimer.current = setTimeout(() => setOpen(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (showTimer.current) clearTimeout(showTimer.current);
    showTimer.current = null;
    setOpen(false);
    setPos(null);
  }, []);

  // Cancel a pending show and clear on unmount.
  useLayoutEffect(() => hide, [hide]);

  // The tooltip is fixed-positioned, so any scroll or resize would leave it
  // floating away from its trigger — just dismiss it.
  useLayoutEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [open, hide]);

  // Position once both the trigger and the rendered tooltip can be measured;
  // flip to the opposite side when there is no room, then clamp to viewport.
  useLayoutEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const tip = tipRef.current;
    if (!trigger || !tip) return;

    const t = trigger.getBoundingClientRect();
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;

    const fits: Record<TooltipPlacement, boolean> = {
      top:    t.top - h - GAP >= VIEWPORT_PAD,
      bottom: t.bottom + h + GAP <= window.innerHeight - VIEWPORT_PAD,
      left:   t.left - w - GAP >= VIEWPORT_PAD,
      right:  t.right + w + GAP <= window.innerWidth - VIEWPORT_PAD
    };
    const opposite: Record<TooltipPlacement, TooltipPlacement> = {
      top: 'bottom', bottom: 'top', left: 'right', right: 'left'
    };
    const side = fits[placement] || !fits[opposite[placement]] ? placement : opposite[placement];

    let top: number;
    let left: number;
    if (side === 'top' || side === 'bottom') {
      top = side === 'top' ? t.top - h - GAP : t.bottom + GAP;
      left = t.left + t.width / 2 - w / 2;
    } else {
      top = t.top + t.height / 2 - h / 2;
      left = side === 'left' ? t.left - w - GAP : t.right + GAP;
    }
    left = Math.min(Math.max(left, VIEWPORT_PAD), window.innerWidth - w - VIEWPORT_PAD);
    top = Math.min(Math.max(top, VIEWPORT_PAD), window.innerHeight - h - VIEWPORT_PAD);

    setPos({ top, left, placement: side });
  }, [open, placement, content]);

  if (disabled || content == null || content === '') return <>{children}</>;

  const triggerProps = {
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    // Hide as soon as the trigger is used so the tooltip never covers menus
    // or dialogs the click opens.
    onPointerDown: hide
  };

  return (
    <>
      <span className="tooltip-trigger" ref={triggerRef} {...triggerProps}>
        {children}
      </span>
      {open &&
        createPortal(
          <div
            ref={tipRef}
            className={`tooltip tooltip-${pos?.placement ?? placement}${pos ? ' tooltip-visible' : ''}`}
            style={pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0, visibility: 'hidden' }}
            role="tooltip"
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
