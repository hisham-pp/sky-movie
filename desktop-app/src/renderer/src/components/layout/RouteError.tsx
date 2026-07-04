import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();

  const status = isRouteErrorResponse(error) ? error.status : null;
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : 'Something went wrong';

  return (
    <div className="route-error">
      <div className="route-error-card">
        <div className="route-error-icon">
          <AlertTriangle size={32} />
        </div>

        {status && <div className="route-error-status">{status}</div>}
        <h2 className="route-error-title">
          {status === 404 ? 'Page not found' : 'Unexpected error'}
        </h2>
        <p className="route-error-message">{message}</p>

        <div className="route-error-actions">
          <button className="route-error-btn" onClick={() => navigate('/movies')}>
            <Home size={15} /> Go home
          </button>
          <button className="route-error-btn route-error-btn--ghost" onClick={() => window.location.reload()}>
            <RefreshCw size={15} /> Reload
          </button>
        </div>
      </div>
    </div>
  );
}
