import type { ReactNode } from 'react';

export function DetailStat({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="detail-stat">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
