import Link from 'next/link';
import { Film } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="route-error">
      <div className="route-error-card">
        <div className="route-error-icon">
          <Film size={32} />
        </div>
        <h2 className="route-error-title">Page not found</h2>
        <p className="route-error-message">The requested page does not exist.</p>
        <div className="route-error-actions">
          <Link href="/movies" className="route-error-btn">
            Back to Movies
          </Link>
        </div>
      </div>
    </div>
  );
}
