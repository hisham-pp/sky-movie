'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import { Download, ExternalLink, RefreshCw, Zap } from 'lucide-react';
import * as queries from '@/queries';
import type { UpdateCheckResult, UpdateDownloadProgress, UpdateStatus, UpdateProgressEvent } from '@/types';
import { Switch } from '../common';
import { formatBytes } from '@/utils/format';
import { useLibraryControllerContext } from '@/hooks/LibraryControllerContext';

export const UpdatesSettings = memo(function UpdatesSettings() {
  const { settings, saveSettings, busy } = useLibraryControllerContext();
  const [updateCheckResult, setUpdateCheckResult] = useState<UpdateCheckResult | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [downloadProgress, setDownloadProgress] = useState<UpdateDownloadProgress | null>(null);

  // Sync initial status and listen for progress events
  useEffect(() => {
    queries.getUpdateStatus().then((s: UpdateStatus) => setUpdateStatus(s)).catch(() => { });

    return queries.onUpdateProgress((event: UpdateProgressEvent) => {
      if (event.type === 'status') {
        setUpdateStatus(event.status);
        if (event.status !== 'downloading') setDownloadProgress(null);
      } else if (event.type === 'download-progress') {
        setUpdateStatus('downloading');
        setDownloadProgress({ bytesDownloaded: event.bytesDownloaded, totalBytes: event.totalBytes, percentage: event.percentage });
      }
    });
  }, []);

  const handleCheckForUpdates = useCallback(async () => {
    setUpdateStatus('checking');
    try {
      const result = await queries.checkForUpdates();
      setUpdateCheckResult(result);
    } catch {
      setUpdateStatus('error');
    }
  }, []);

  const handleDownloadUpdate = useCallback(async () => {
    try {
      await queries.downloadUpdate();
    } catch {
      // status is set via IPC event
    }
  }, []);

  const handleInstallUpdate = useCallback(async () => {
    try {
      await queries.installUpdate();
    } catch {
      // status is set via IPC event
    }
  }, []);

  const handleOpenReleasePage = useCallback(() => {
    const url = updateCheckResult?.releaseInfo?.webViewUrl;
    if (url) void queries.openExternalUrl(url);
  }, [updateCheckResult]);

  return (
    <div className="settings-sections">
      {/* Auto-download preference */}
      <div className="settings-section">
        <div className="settings-section-heading">
          <div>
            <h3>Auto-Download</h3>
            <p>Automatically download new versions in the background. Installation always requires your confirmation.</p>
          </div>
        </div>
        <div className="settings-form-grid">
          <Switch
            id="setting-auto-download-updates"
            label="Auto-download new versions"
            checked={settings?.autoDownloadUpdates ?? false}
            onChange={(checked) => saveSettings({ autoDownloadUpdates: checked })}
          />
        </div>
      </div>

      {/* Check / download / install */}
      <div className="settings-section">
        <div className="settings-section-heading">
          <div>
            <h3>Updates</h3>
            <p>Check for new versions of Sky Movie.</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="settings-actions left">
          <button
            disabled={updateStatus === 'checking' || updateStatus === 'downloading' || updateStatus === 'installing' || busy}
            onClick={handleCheckForUpdates}
          >
            <RefreshCw size={18} className={updateStatus === 'checking' ? 'spin' : ''} />
            {updateStatus === 'checking' ? 'Checking…' : 'Check for updates'}
          </button>

          {updateCheckResult?.hasUpdate && updateCheckResult.releaseInfo?.directDownload !== false && updateStatus !== 'downloading' && updateStatus !== 'downloaded' && updateStatus !== 'installing' && (
            <button disabled={busy} onClick={handleDownloadUpdate} className="update-download-btn">
              <Download size={18} />
              Download {updateCheckResult.latestVersion}
            </button>
          )}

          {updateCheckResult?.hasUpdate && updateCheckResult.releaseInfo?.directDownload === false && (
            <button disabled={busy} onClick={handleOpenReleasePage} className="update-download-btn">
              <ExternalLink size={18} />
              View {updateCheckResult.latestVersion} on the web
            </button>
          )}

          {updateStatus === 'downloaded' && (
            <button disabled={busy} onClick={handleInstallUpdate} className="update-install-btn">
              <Zap size={18} />
              Install &amp; Restart
            </button>
          )}

          {updateStatus === 'installing' && (
            <span className="update-installing-label">
              <RefreshCw size={16} className="spin" />
              Installing…
            </span>
          )}
        </div>

        {/* Download progress bar */}
        {updateStatus === 'downloading' && (
          <div className="update-download-progress">
            <div className="update-progress-label">
              <span>Downloading update…</span>
              {downloadProgress && <span>{Math.round(downloadProgress.percentage)}%</span>}
            </div>
            <div className="update-progress-bar">
              <div
                className="update-progress-fill"
                style={{ width: downloadProgress ? `${downloadProgress.percentage}%` : '0%' }}
              />
            </div>
            {downloadProgress && downloadProgress.totalBytes > 0 && (
              <span className="update-progress-size">
                {formatBytes(downloadProgress.bytesDownloaded)} / {formatBytes(downloadProgress.totalBytes)}
              </span>
            )}
          </div>
        )}

        {/* Ready-to-install banner */}
        {updateStatus === 'downloaded' && (
          <div className="update-ready-banner">
            <Zap size={15} />
            Update downloaded — click "Install &amp; Restart" to apply it.
          </div>
        )}

        {/* Check result info */}
        {updateCheckResult && (
          <div className="update-check-result">
            {updateCheckResult.hasUpdate ? (
              <div className="update-available">
                <strong>New version available: {updateCheckResult.latestVersion}</strong>
                <p>Current version: {updateCheckResult.currentVersion}</p>
                {updateCheckResult.releaseInfo?.directDownload === false && (
                  <p className="update-note">No in-app installer is published for your platform — use “View on the web” to download it from the release page.</p>
                )}
                {updateCheckResult.releaseInfo && (
                  <div className="release-notes">
                    <p>{updateCheckResult.releaseInfo.notes}</p>
                    {updateCheckResult.releaseInfo.changes.length > 0 && (
                      <ul>
                        {updateCheckResult.releaseInfo.changes.map((change: string, index: number) => (
                          <li key={index}>{change}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="update-current">You're on the latest version ({updateCheckResult.currentVersion})</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
