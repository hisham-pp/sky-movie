'use client';

import { useState, useEffect, type ReactNode } from 'react';
import Select from 'react-select';

export interface GlassSelectOption<T> {
  value: T;
  label: string;
}

/**
 * Themed react-select wrapper used for filter/sort dropdowns.
 * The menu renders in a portal on document.body so it is never clipped by
 * scroll containers — colors therefore use fallbacks, not only theme vars.
 */
export function GlassSelect<T>({
  options,
  value,
  onChange,
  icon,
  ariaLabel,
  size = 'md',
  className
}: {
  options: GlassSelectOption<T>[];
  value: T;
  onChange(value: T): void;
  icon?: ReactNode;
  ariaLabel?: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const selected = options.find((option) => Object.is(option.value, value)) ?? null;

  return (
    <div className={`glass-select glass-select--${size}${icon ? ' has-icon' : ''}${className ? ` ${className}` : ''}`}>
      {icon && <span className="glass-select-icon">{icon}</span>}
      <Select<GlassSelectOption<T>>
        classNamePrefix="gs"
        options={options}
        value={selected}
        onChange={(option) => { if (option) onChange(option.value); }}
        isSearchable={false}
        unstyled
        menuPortalTarget={mounted && typeof document !== 'undefined' ? document.body : undefined}
        menuPlacement="auto"
        styles={{ menuPortal: (base) => ({ ...base, zIndex: 10000 }) }}
        aria-label={ariaLabel}
      />
    </div>
  );
}
