import { memo } from 'react';

export const SectionTitle = memo(function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      <span>{count} items</span>
    </div>
  );
});
