'use client';

import { useState } from "react";

type ReleasePlatform = "windows" | "macos" | "linux" | "unknown";

interface ReleaseArtifact {
  platform: ReleasePlatform;
  arch: string;
  kind: string;
  fileName: string;
  size: number;
  sha256: string;
  driveFileId: string;
  downloadUrl: string;
  webViewUrl: string;
}

interface ReleaseEntry {
  version: string;
  releasedAt: string | null;
  storageProvider?: string;
  driveFolderId?: string | null;
  driveFolderUrl?: string | null;
  storageFolderUrl?: string | null;
  sourceCommit?: {
    sha: string | null;
    message: string | null;
  };
  notes: string;
  changes?: string[];
  artifacts: ReleaseArtifact[];
}

interface WhatsNewClientProps {
  releases: ReleaseEntry[];
  latestVersion: string;
}

export default function WhatsNewClient({ releases, latestVersion }: WhatsNewClientProps) {
  const [showAllVersions, setShowAllVersions] = useState(false);
  
  const latestRelease = releases[0];
  const olderReleases = releases.slice(1);
  
  return (
    <section className="section">
      <div className="section-inner release-timeline">
        {/* Latest Release */}
        {latestRelease && (
          <article className="release-card" key={latestRelease.version}>
            <div className="release-card-header">
              <div>
                <span className="release-eyebrow">Latest release</span>
                <h2>Sky Movie {latestRelease.version}</h2>
                <p>{latestRelease.notes}</p>
              </div>
              <div className="release-date-pill">{formatReleaseDate(latestRelease.releasedAt)}</div>
            </div>

            <div className="release-detail-grid">
              <div className="release-changes">
                <h3>Changes</h3>
                {latestRelease.changes?.length ? (
                  <ul>
                    {latestRelease.changes.map((change, idx) => (
                      <li key={`${latestRelease.version}-change-${idx}`}>{change}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No change notes were recorded for this release.</p>
                )}
              </div>

              <aside className="release-source-card">
                <span>Source commit</span>
                <strong>{shortSha(latestRelease.sourceCommit?.sha)}</strong>
                <p>{latestRelease.sourceCommit?.message ?? "Pending release commit"}</p>
                {latestRelease.sourceCommit?.sha && (
                  <a href={`https://github.com/hisham-pp/sky-movie/commit/${latestRelease.sourceCommit.sha}`} target="_blank" rel="noopener noreferrer">
                    View commit
                  </a>
                )}
              </aside>
            </div>

            <div className="release-artifacts">
              <div className="section-title-row">
                <h3>Downloads</h3>
                {(latestRelease.storageFolderUrl || latestRelease.driveFolderUrl) && (
                  <a href={(latestRelease.storageFolderUrl || latestRelease.driveFolderUrl)!} target="_blank" rel="noopener noreferrer">
                    {latestRelease.storageProvider === 'github-releases' ? 'View on GitHub' : 'Open folder'}
                  </a>
                )}
              </div>

              {latestRelease.artifacts.length ? (
                <div className="artifact-table">
                  {latestRelease.artifacts.map((artifact, idx) => (
                    <a className="artifact-row" href={artifact.downloadUrl} key={artifact.driveFileId || `${artifact.fileName}-${idx}`} download>
                      <span>{formatPlatform(artifact.platform)}</span>
                      <strong>{artifact.fileName}</strong>
                      <small>{artifact.kind} / {artifact.arch} / {formatArtifactSize(artifact.size)}</small>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="muted-copy">No files uploaded for this release yet.</p>
              )}
            </div>
          </article>
        )}

        {/* Older Releases Toggle */}
        {olderReleases.length > 0 && (
          <>
            <div style={{ margin: '2rem 0', textAlign: 'center' }}>
              <button 
                onClick={() => setShowAllVersions(!showAllVersions)}
                className="button secondary"
                style={{ cursor: 'pointer' }}
              >
                {showAllVersions ? 'Hide older versions' : `Show ${olderReleases.length} older version${olderReleases.length > 1 ? 's' : ''}`}
              </button>
            </div>

            {/* Older Releases */}
            {showAllVersions && olderReleases.map((release) => (
              <article className="release-card" key={release.version}>
                <div className="release-card-header">
                  <div>
                    <span className="release-eyebrow">Release</span>
                    <h2>Sky Movie {release.version}</h2>
                    <p>{release.notes}</p>
                  </div>
                  <div className="release-date-pill">{formatReleaseDate(release.releasedAt)}</div>
                </div>

                <div className="release-detail-grid">
                  <div className="release-changes">
                    <h3>Changes</h3>
                    {release.changes?.length ? (
                      <ul>
                        {release.changes.map((change, idx) => (
                          <li key={`${release.version}-change-${idx}`}>{change}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No change notes were recorded for this release.</p>
                    )}
                  </div>

                  <aside className="release-source-card">
                    <span>Source commit</span>
                    <strong>{shortSha(release.sourceCommit?.sha)}</strong>
                    <p>{release.sourceCommit?.message ?? "Pending release commit"}</p>
                    {release.sourceCommit?.sha && (
                      <a href={`https://github.com/hisham-pp/sky-movie/commit/${release.sourceCommit.sha}`} target="_blank" rel="noopener noreferrer">
                        View commit
                      </a>
                    )}
                  </aside>
                </div>

                <div className="release-artifacts">
                  <div className="section-title-row">
                    <h3>Downloads</h3>
                    {(release.storageFolderUrl || release.driveFolderUrl) && (
                      <a href={(release.storageFolderUrl || release.driveFolderUrl)!} target="_blank" rel="noopener noreferrer">
                        {release.storageProvider === 'github-releases' ? 'View on GitHub' : 'Open folder'}
                      </a>
                    )}
                  </div>

                  {release.artifacts.length ? (
                    <div className="artifact-table">
                      {release.artifacts.map((artifact, idx) => (
                        <a className="artifact-row" href={artifact.downloadUrl} key={artifact.driveFileId || `${artifact.fileName}-${idx}`} download>
                          <span>{formatPlatform(artifact.platform)}</span>
                          <strong>{artifact.fileName}</strong>
                          <small>{artifact.kind} / {artifact.arch} / {formatArtifactSize(artifact.size)}</small>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="muted-copy">No files uploaded for this release yet.</p>
                  )}
                </div>
              </article>
            ))}
          </>
        )}
      </div>
    </section>
  );
}

function formatReleaseDate(value: string | null | undefined) {
  if (!value) {
    return "Not released yet";
  }
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function shortSha(value: string | null | undefined) {
  return value ? value.slice(0, 12) : "pending";
}

function formatArtifactSize(size: number) {
  const units = ["B", "KB", "MB", "GB"];
  let nextSize = size;
  let unitIndex = 0;
  while (nextSize >= 1024 && unitIndex < units.length - 1) {
    nextSize /= 1024;
    unitIndex += 1;
  }
  return `${nextSize.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatPlatform(platform: ReleasePlatform) {
  switch (platform) {
    case "windows":
      return "Windows";
    case "macos":
      return "macOS";
    case "linux":
      return "Linux";
    default:
      return "Other";
  }
}
