'use client';

import { useState } from "react";

type ReleasePlatform = "windows" | "macos" | "linux" | "unknown";

interface ReleaseArtifact {
  platform: ReleasePlatform;
  arch: string;
  kind: string;
  fileName: string;
  size: number;
  sha256: string | null;
  driveFileId?: string | null;
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
  
  const isBetaVersion = (version: string) => {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!match) return false;
    const major = parseInt(match[1]);
    return major < 1;
  };
  
  return (
    <section className="max-w-5xl mx-auto">
      <div className="space-y-8">
        {/* Latest Release */}
        {latestRelease && (
          <article className="glass-panel p-8 rounded-3xl" key={latestRelease.version}>
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
              <div>
                <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-3">
                  {isBetaVersion(latestRelease.version) ? 'Latest Beta Release' : 'Latest Release'}
                </p>
                <h2 className="text-3xl font-bold text-white mb-3 flex items-center gap-3 flex-wrap">
                  Sky Movie {latestRelease.version}
                  {isBetaVersion(latestRelease.version) && (
                    <span className="bg-orange-500/10 text-orange-400 text-xs uppercase font-bold px-3 py-1 rounded-full border border-orange-500/20">Beta</span>
                  )}
                </h2>
                <p className="text-secondary text-base">{latestRelease.notes}</p>
              </div>
              <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm font-medium whitespace-nowrap">
                {formatReleaseDate(latestRelease.releasedAt)}
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2">
                <h3 className="text-xl font-semibold text-white mb-4">Changes</h3>
                {latestRelease.changes?.length ? (
                  <ul className="space-y-2 text-secondary text-sm">
                    {latestRelease.changes.map((change, idx) => (
                      <li key={`${latestRelease.version}-change-${idx}`} className="flex gap-3">
                        <span className="text-primary mt-1">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-secondary">No change notes were recorded for this release.</p>
                )}
              </div>

              <aside className="bg-surface-container-low p-6 rounded-2xl border border-white/5">
                <p className="text-xs text-secondary uppercase tracking-widest mb-2">Source Commit</p>
                <p className="text-primary font-mono text-sm mb-3">{shortSha(latestRelease.sourceCommit?.sha)}</p>
                <p className="text-secondary text-sm mb-4 line-clamp-3">{latestRelease.sourceCommit?.message ?? "Pending release commit"}</p>
                {latestRelease.sourceCommit?.sha && (
                  <a 
                    href={`https://github.com/hisham-pp/sky-movie/commit/${latestRelease.sourceCommit.sha}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-container text-sm flex items-center gap-1 transition-colors"
                  >
                    View commit
                    <span className="material-symbols-outlined text-sm">arrow_outward</span>
                  </a>
                )}
              </aside>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Downloads</h3>
                {(latestRelease.storageFolderUrl || latestRelease.driveFolderUrl) && (
                  <a 
                    href={(latestRelease.storageFolderUrl || latestRelease.driveFolderUrl)!} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-container text-sm flex items-center gap-1 transition-colors"
                  >
                    {latestRelease.storageProvider === 'github-releases' ? 'View on GitHub' : 'Open folder'}
                    <span className="material-symbols-outlined text-sm">arrow_outward</span>
                  </a>
                )}
              </div>

              {latestRelease.artifacts.length ? (
                <div className="space-y-2">
                  {latestRelease.artifacts.map((artifact, idx) => (
                    <a 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface-container rounded-xl border border-white/5 hover:border-primary/40 transition-all group gap-2" 
                      href={artifact.downloadUrl} 
                      key={artifact.driveFileId || `${artifact.fileName}-${idx}`} 
                      download
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                          <span className="material-symbols-outlined text-xl">download</span>
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{artifact.fileName}</p>
                          <p className="text-secondary text-xs">{formatPlatform(artifact.platform)} • {artifact.kind} • {artifact.arch}</p>
                        </div>
                      </div>
                      <span className="text-secondary text-sm font-mono">{formatArtifactSize(artifact.size)}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-secondary text-center py-8">No files uploaded for this release yet.</p>
              )}
            </div>
          </article>
        )}

        {/* Older Releases Toggle */}
        {olderReleases.length > 0 && (
          <>
            <div className="text-center my-8">
              <button 
                onClick={() => setShowAllVersions(!showAllVersions)}
                className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 hover:border-primary/40 transition-all"
              >
                {showAllVersions ? 'Hide older versions' : `Show ${olderReleases.length} older version${olderReleases.length > 1 ? 's' : ''}`}
              </button>
            </div>

            {/* Older Releases */}
            {showAllVersions && olderReleases.map((release) => (
              <article className="glass-panel p-8 rounded-3xl opacity-80 hover:opacity-100 transition-opacity" key={release.version}>
                <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
                  <div>
                    <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-3">
                      {isBetaVersion(release.version) ? 'Beta Release' : 'Release'}
                    </p>
                    <h2 className="text-3xl font-bold text-white mb-3 flex items-center gap-3 flex-wrap">
                      Sky Movie {release.version}
                      {isBetaVersion(release.version) && (
                        <span className="bg-orange-500/10 text-orange-400 text-xs uppercase font-bold px-3 py-1 rounded-full border border-orange-500/20">Beta</span>
                      )}
                    </h2>
                    <p className="text-secondary text-base">{release.notes}</p>
                  </div>
                  <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-secondary text-sm font-medium whitespace-nowrap">
                    {formatReleaseDate(release.releasedAt)}
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 mb-8">
                  <div className="lg:col-span-2">
                    <h3 className="text-xl font-semibold text-white mb-4">Changes</h3>
                    {release.changes?.length ? (
                      <ul className="space-y-2 text-secondary text-sm">
                        {release.changes.map((change, idx) => (
                          <li key={`${release.version}-change-${idx}`} className="flex gap-3">
                            <span className="text-primary mt-1">•</span>
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-secondary">No change notes were recorded for this release.</p>
                    )}
                  </div>

                  <aside className="bg-surface-container-low p-6 rounded-2xl border border-white/5">
                    <p className="text-xs text-secondary uppercase tracking-widest mb-2">Source Commit</p>
                    <p className="text-primary font-mono text-sm mb-3">{shortSha(release.sourceCommit?.sha)}</p>
                    <p className="text-secondary text-sm mb-4 line-clamp-3">{release.sourceCommit?.message ?? "Pending release commit"}</p>
                    {release.sourceCommit?.sha && (
                      <a 
                        href={`https://github.com/hisham-pp/sky-movie/commit/${release.sourceCommit.sha}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-container text-sm flex items-center gap-1 transition-colors"
                      >
                        View commit
                        <span className="material-symbols-outlined text-sm">arrow_outward</span>
                      </a>
                    )}
                  </aside>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">Downloads</h3>
                    {(release.storageFolderUrl || release.driveFolderUrl) && (
                      <a 
                        href={(release.storageFolderUrl || release.driveFolderUrl)!} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-container text-sm flex items-center gap-1 transition-colors"
                      >
                        {release.storageProvider === 'github-releases' ? 'View on GitHub' : 'Open folder'}
                        <span className="material-symbols-outlined text-sm">arrow_outward</span>
                      </a>
                    )}
                  </div>

                  {release.artifacts.length ? (
                    <div className="space-y-2">
                      {release.artifacts.map((artifact, idx) => (
                        <a 
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface-container rounded-xl border border-white/5 hover:border-primary/40 transition-all group gap-2" 
                          href={artifact.downloadUrl} 
                          key={artifact.driveFileId || `${artifact.fileName}-${idx}`} 
                          download
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                              <span className="material-symbols-outlined text-xl">download</span>
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">{artifact.fileName}</p>
                              <p className="text-secondary text-xs">{formatPlatform(artifact.platform)} • {artifact.kind} • {artifact.arch}</p>
                            </div>
                          </div>
                          <span className="text-secondary text-sm font-mono">{formatArtifactSize(artifact.size)}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary text-center py-8">No files uploaded for this release yet.</p>
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
