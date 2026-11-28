'use client';

import { memo, ReactNode, ButtonHTMLAttributes } from 'react';
import { Tooltip } from './Tooltip';

export type PillButtonPosition =
  | 'first'
  | 'middle'
  | 'last'
  | 'single'
  | 'back'
  | 'refresh'
  | 'forward'
  | 'minimize'
  | 'maximize'
  | 'restore'
  | 'close';

export interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Position in a segmented pill group:
   * - 'first' | 'back' | 'minimize': Pill radius on left, flat on right
   * - 'middle' | 'refresh' | 'maximize' | 'restore': Flat (0 radius) on all sides
   * - 'last' | 'forward' | 'close': Flat on left, pill radius on right
   * - 'single': Full pill radius on all 4 corners
   */
  position?: PillButtonPosition;
  /** Primary icon inside the button */
  icon?: ReactNode;
  /** Hover tooltip content */
  tooltip?: ReactNode;
  /** Visual variant: 'default' (glass hover), 'primary' (brand purple), or 'danger' (red accent hover for close) */
  variant?: 'default' | 'primary' | 'danger';
}

/**
 * Reusable dark-glass split-pill button.
 * Matches the exact color, blur, border, and interaction physics of the search bar.
 */
export const PillButton = memo(function PillButton({
  position = 'single',
  icon,
  tooltip,
  variant = 'default',
  className = '',
  children,
  ...props
}: PillButtonProps) {
  let posClass = 'pill-btn--single';
  if (position === 'first' || position === 'back' || position === 'minimize') {
    posClass = 'pill-btn--first';
  } else if (position === 'middle' || position === 'refresh' || position === 'maximize' || position === 'restore') {
    posClass = 'pill-btn--middle';
  } else if (position === 'last' || position === 'forward' || position === 'close') {
    posClass = 'pill-btn--last';
  }

  const variantClass =
    variant === 'primary' ? 'pill-btn--primary' : variant === 'danger' ? 'pill-btn--danger' : '';
  const fullClassName = `pill-btn ${posClass} ${variantClass} ${className}`.trim();

  const button = (
    <button className={fullClassName} {...props}>
      {icon}
      {children}
    </button>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{button}</Tooltip>;
  }

  return button;
});

export type PillChipPosition = 'first' | 'middle' | 'last' | 'single';

export interface PillChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  position?: PillChipPosition;
  variant?: 'default' | 'primary';
  children: ReactNode;
}

/**
 * Reusable metadata chip matching the split-pill design.
 * Used for movie/show details (Year, Runtime, Rating) with flat meeting borders.
 */
export const PillChip = memo(function PillChip({
  position = 'middle',
  variant = 'default',
  className = '',
  children,
  ...props
}: PillChipProps) {
  let posClass = 'pill-chip--single';
  if (position === 'first') {
    posClass = 'pill-chip--first';
  } else if (position === 'middle') {
    posClass = 'pill-chip--middle';
  } else if (position === 'last') {
    posClass = 'pill-chip--last';
  }

  const variantClass = variant === 'primary' ? 'pill-chip--primary' : '';
  const fullClassName = `pill-chip ${posClass} ${variantClass} ${className}`.trim();

  return (
    <span className={fullClassName} {...props}>
      {children}
    </span>
  );
});

export interface PillButtonGroupProps {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}

/**
 * Reusable segmented group container with 6px gap and no-drag region.
 */
export const PillButtonGroup = memo(function PillButtonGroup({
  children,
  className = '',
  'aria-label': ariaLabel,
}: PillButtonGroupProps) {
  return (
    <div className={`pill-group ${className}`.trim()} role="group" aria-label={ariaLabel}>
      {children}
    </div>
  );
});
