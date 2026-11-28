'use client';

import { memo, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { LAUNCH_ONBOARDING_EVENT } from '@/config/events';

export const HelpSettings = memo(function HelpSettings() {
  const handleLaunchTour = useCallback(() => {
    window.dispatchEvent(new CustomEvent(LAUNCH_ONBOARDING_EVENT));
  }, []);

  return (
    <div className="settings-sections">
      <div className="settings-section">
        <div className="settings-section-heading">
          <div>
            <h3>Welcome Tour</h3>
            <p>Replay the guided setup that introduces media folders, player settings, and app features.</p>
          </div>
        </div>
        <div className="settings-actions left">
          <button onClick={handleLaunchTour}>
            <Sparkles size={16} />
            Launch Welcome Tour
          </button>
        </div>
        <p className="settings-hint">
          The tour opens over your library. You can skip or exit it at any time.
        </p>
      </div>
    </div>
  );
});
