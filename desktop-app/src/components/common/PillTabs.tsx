'use client';

import { useRef, useState, useLayoutEffect, useCallback, type ReactNode } from 'react';
import { Tooltip } from './Tooltip';

export interface PillTab<T extends string = string> {
  id: T;
  label?: ReactNode;
  icon?: ReactNode;
  badge?: number;
  tooltip?: ReactNode;
  ariaLabel?: string;
}

export type PillTabsOrientation = 'horizontal' | 'vertical';
export type PillTabsVariant = 'primary' | 'subtle';
export type PillTabsSize = 'small' | 'medium';

interface PillTabsProps<T extends string = string> {
  tabs: PillTab<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  size?: PillTabsSize;
  orientation?: PillTabsOrientation;
  variant?: PillTabsVariant;
  ariaLabel?: string;
}

/**
 * Sliding Pill Tabs with organic squash-and-stretch physics.
 *
 * Supports:
 * • Horizontal & Vertical orientations (`orientation="horizontal" | "vertical"`)
 * • Primary & Subtle visual variants (`variant="primary" | "subtle"`)
 * • Medium & Small sizes (`size="medium" | "small"`)
 * • Built-in tooltips on individual tabs
 * • GPU-accelerated slide (`translate`) with fluid decelerate curve (no bounce)
 * • Axis-aware squash & stretch micro-animation (stretches along travel axis, squashes across it)
 * • Full directional arrow key navigation
 */
export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
  className = '',
  size = 'medium',
  orientation = 'horizontal',
  variant = 'primary',
  ariaLabel = 'Navigation tabs',
}: PillTabsProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<T, HTMLButtonElement>>(new Map());

  const isVertical = orientation === 'vertical';
  const activeIndex = tabs.findIndex((t) => t.id === value);
  const prevIndexRef = useRef(activeIndex);
  const isFirstMount = useRef(true);

  const [thumb, setThumb] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>({ left: 0, top: 0, width: 0, height: 0 });

  // Measure active button offset & dimensions inside the track
  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const btn = tabRefs.current.get(value);
    if (!btn) return;

    const trackRect = track.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    setThumb({
      left: btnRect.left - trackRect.left,
      top: btnRect.top - trackRect.top,
      width: btnRect.width,
      height: btnRect.height,
    });
  }, [value]);

  // Keep thumb aligned on value change or tab content updates
  useLayoutEffect(() => {
    measure();
  }, [measure]);

  // Re-measure on window/container resize
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(track);
    return () => ro.disconnect();
  }, [measure]);

  // Squash-and-stretch micro-animation on tab change (Web Animations API)
  useLayoutEffect(() => {
    const prevIndex = prevIndexRef.current;
    prevIndexRef.current = activeIndex;

    // Skip on first mount or if clicking the same tab
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (prevIndex === activeIndex || activeIndex < 0) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const thumbEl = thumbRef.current;
    if (!thumbEl) return;

    // Travel distance factor (longer slides stretch a bit more)
    const distance = Math.abs(activeIndex - prevIndex);
    const stretchFactor = distance > 1 ? 1.13 : 1.09;
    const squashFactor = distance > 1 ? 0.86 : 0.90;

    // Axis-aware stretch: whichever axis is the travel direction stretches, perpendicular squashes
    const keyframes = isVertical
      ? [
          { scale: '1 1' },
          { scale: `${squashFactor} ${stretchFactor}`, offset: 0.35 },
          { scale: '1.02 0.97', offset: 0.70 },
          { scale: '1 1' },
        ]
      : [
          { scale: '1 1' },
          { scale: `${stretchFactor} ${squashFactor}`, offset: 0.35 },
          { scale: '0.97 1.02', offset: 0.70 },
          { scale: '1 1' },
        ];

    thumbEl.animate(keyframes, {
      duration: 480,
      easing: 'ease-out',
      fill: 'none',
    });
  }, [activeIndex, isVertical]);

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

    if (event.key === nextKey || (!isVertical && event.key === 'ArrowDown')) {
      event.preventDefault();
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === prevKey || (!isVertical && event.key === 'ArrowUp')) {
      event.preventDefault();
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    const nextTab = tabs[nextIndex];
    if (nextTab && nextTab.id !== value) {
      onChange(nextTab.id);
      tabRefs.current.get(nextTab.id)?.focus();
    }
  };

  const classes = [
    'pill-tabs',
    size === 'small' ? 'pill-tabs--small' : 'pill-tabs--medium',
    isVertical ? 'pill-tabs--vertical' : 'pill-tabs--horizontal',
    variant === 'subtle' ? 'pill-tabs--subtle' : 'pill-tabs--primary',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={trackRef}
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation={orientation}
      className={classes}
    >
      {/* Sliding and squashing thumb indicator */}
      <div
        ref={thumbRef}
        aria-hidden="true"
        className="pill-indicator"
        style={{
          width: `${thumb.width}px`,
          height: `${thumb.height}px`,
          transform: `translate(${thumb.left}px, ${thumb.top}px)`,
          opacity: thumb.width > 0 && thumb.height > 0 ? 1 : 0,
        }}
      />

      {/* Tab Buttons */}
      {tabs.map((tab, index) => {
        const isActive = tab.id === value;
        const isIconOnly = !tab.label && !!tab.icon;

        const buttonElement = (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el);
              else tabRefs.current.delete(tab.id);
            }}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.ariaLabel ?? (typeof tab.label === 'string' ? tab.label : undefined)}
            tabIndex={isActive ? 0 : -1}
            className={`pill-tab ${isActive ? 'pill-tab--active' : ''} ${
              isIconOnly ? 'pill-tab--icon-only' : ''
            }`}
            onClick={() => {
              if (tab.id !== value) {
                onChange(tab.id);
              }
            }}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {tab.icon && <span className="pill-tab-icon">{tab.icon}</span>}
            {tab.label && <span className="pill-tab-label">{tab.label}</span>}
            {typeof tab.badge === 'number' && tab.badge > 0 && (
              <span className="pill-tab-badge">{tab.badge}</span>
            )}
          </button>
        );

        return tab.tooltip ? (
          <Tooltip key={tab.id} content={tab.tooltip}>
            {buttonElement}
          </Tooltip>
        ) : (
          buttonElement
        );
      })}
    </div>
  );
}
