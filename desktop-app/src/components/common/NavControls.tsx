'use client';

import { memo, useState, useCallback, ReactNode, ButtonHTMLAttributes } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, RotateCw } from 'lucide-react';
import { Tooltip } from './Tooltip';

export type NavButtonPosition = 'back' | 'refresh' | 'forward' | 'single' | 'first' | 'middle' | 'last';

export interface NavButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  position?: NavButtonPosition;
  icon?: ReactNode;
  tooltip?: ReactNode;
}

/**
 * Reusable pill navigation button.
 * Supports split-pill positions ('back'/'first', 'refresh'/'middle', 'forward'/'last', or 'single').
 */
export const NavButton = memo(function NavButton({
  position = 'single',
  icon,
  tooltip,
  className = '',
  children,
  ...props
}: NavButtonProps) {
  const posClass =
    position === 'back' || position === 'first'
      ? 'nav-btn--back'
      : position === 'forward' || position === 'last'
      ? 'nav-btn--forward'
      : position === 'refresh' || position === 'middle'
      ? 'nav-btn--refresh'
      : 'nav-btn--single';

  const button = (
    <button className={`nav-btn ${posClass} ${className}`.trim()} {...props}>
      {icon}
      {children}
    </button>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{button}</Tooltip>;
  }

  return button;
});

export interface NavControlsProps {
  onBack?: () => void;
  onForward?: () => void;
  onRefresh?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  showBack?: boolean;
  showRefresh?: boolean;
  showForward?: boolean;
  className?: string;
}

/**
 * Reusable segmented navigation controls group (Go Back, Reload, Go Forward).
 * Uses dark-glass styling matching the search bar with flat meeting borders and tooltips.
 */
export const NavControls = memo(function NavControls({
  onBack,
  onForward,
  onRefresh,
  canGoBack = true,
  canGoForward = true,
  showBack = true,
  showRefresh = true,
  showForward = true,
  className = '',
}: NavControlsProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  }, [onBack, router]);

  const handleForward = useCallback(() => {
    if (onForward) {
      onForward();
    } else {
      router.forward();
    }
  }, [onForward, router]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
    setTimeout(() => setIsRefreshing(false), 600);
  }, [onRefresh]);

  return (
    <div className={`nav-controls ${className}`.trim()}>
      {showBack && (
        <Tooltip content="Go back (Alt+←)">
          <button
            className="nav-btn nav-btn--back"
            onClick={handleBack}
            disabled={!canGoBack}
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
          </button>
        </Tooltip>
      )}

      {showRefresh && (
        <Tooltip content="Reload (Ctrl+R)">
          <button
            className="nav-btn nav-btn--refresh"
            onClick={handleRefresh}
            aria-label="Reload page"
          >
            <RotateCw size={16} className={isRefreshing ? 'nav-btn-icon--spin' : ''} />
          </button>
        </Tooltip>
      )}

      {showForward && (
        <Tooltip content="Go forward (Alt+→)">
          <button
            className="nav-btn nav-btn--forward"
            onClick={handleForward}
            disabled={!canGoForward}
            aria-label="Go forward"
          >
            <ArrowRight size={16} />
          </button>
        </Tooltip>
      )}
    </div>
  );
});
