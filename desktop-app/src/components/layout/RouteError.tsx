'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export function RouteError({
  error,
  reset
}: {
  error?: Error;
  reset?: () => void;
}) {
  const router = useRouter();
  const message = error?.message || 'Something went wrong';

  return (
    <div className="route-error">
      <div className="route-error-card">
        <div className="route-error-icon">
          <AlertTriangle size={32} />
        </div>

        <h2 className="route-error-title">Unexpected error</h2>
        <p className="route-error-message">{message}</p>

        <div className="route-error-actions">
          <button className="route-error-btn" onClick={() => router.push('/movies')}>
            <Home size={15} /> Go home
          </button>
          <button
            className="route-error-btn route-error-btn--ghost"
            onClick={() => reset ? reset() : window.location.reload()}
          >
            <RefreshCw size={15} /> Reload
          </button>
        </div>
      </div>
    </div>
  );
}
