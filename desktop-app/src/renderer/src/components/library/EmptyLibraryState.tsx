import { ReactNode } from 'react';

export function EmptyLibraryState({
  icon,
  label,
  title,
  description
}: {
  icon: ReactNode;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="library-empty-state">
      <div className="empty-orbit" aria-hidden="true">
        {icon}
      </div>
      <span>{label}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
