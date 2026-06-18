import type { ReactNode } from 'react';

export function Select({
  value,
  onChange,
  children
}: {
  value: string;
  onChange(value: string): void;
  children: ReactNode;
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {children}
    </select>
  );
}
