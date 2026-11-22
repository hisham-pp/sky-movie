'use client';

import { memo, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, RotateCw } from 'lucide-react';
import { PillButton, PillButtonGroup, PillButtonProps } from './PillButton';

export type NavButtonPosition = PillButtonProps['position'];
export type NavButtonProps = PillButtonProps;
export const NavButton = PillButton;

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
 * Built with PillButtonGroup and PillButton with flat inner meeting borders and tooltips.
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
    <PillButtonGroup className={`nav-controls ${className}`.trim()} aria-label="Navigation controls">
      {showBack && (
        <PillButton
          position="first"
          onClick={handleBack}
          disabled={!canGoBack}
          tooltip="Go back (Alt+←)"
          aria-label="Go back"
          icon={<ArrowLeft size={16} />}
        />
      )}

      {showRefresh && (
        <PillButton
          position="middle"
          onClick={handleRefresh}
          tooltip="Reload (Ctrl+R)"
          aria-label="Reload page"
          icon={<RotateCw size={16} className={isRefreshing ? 'nav-btn-icon--spin' : ''} />}
        />
      )}

      {showForward && (
        <PillButton
          position="last"
          onClick={handleForward}
          disabled={!canGoForward}
          tooltip="Go forward (Alt+→)"
          aria-label="Go forward"
          icon={<ArrowRight size={16} />}
        />
      )}
    </PillButtonGroup>
  );
});
