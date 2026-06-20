import type { Metadata } from "next";
import Link from "next/link";
import releaseManifestJson from "../../public/releases.json";

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
  driveFolderId?: string | null;
  driveFolderUrl?: string | null;
  sourceCommit?: {
    sha: string | null;
    message: string | null;
  };
  notes: string;
  changes?: string[];
  artifacts: ReleaseArtifact[];
}

interface ReleaseManifest {
  latestVersion: string;
  updatedAt: string | null;
  releases: ReleaseEntry[];
}

export const metadata: Metadata = {
  title: "What's New | Sky Movie",
  description: "Release history, desktop download changes, source commit messages, and commit SHAs for Sky Movie."
};

const releaseManifest = releaseManifestJson as ReleaseManifest;

export default function WhatsNewPage() {
  return (
    <main className="whats-new-page">
      <section className="whats-new-hero">
        <div className="section-inner">
          <Link className="button secondary back-home-link" href="/">
            Back to Sky Movie
          </Link>
          <p className="eyebrow">Version history</p>
          <h1>What's new</h1>
          <p className="hero-copy">
            Every desktop release is generated from the release manifest. The Google Drive release script updates this page with changes, download artifacts, commit messages, and commit SHAs.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section-inner release-timeline">
          {releaseManifest.releases.map((release) => (
            <article className="release-card" key={release.version}>
              <div className="release-card-header">
                <div>
                  <span className="release-eyebrow">{release.version === releaseManifest.latestVersion ? "Latest release" : "Release"}</span>
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
                      {release.changes.map((change) => (
                        <li key={change}>{change}</li>
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
                  {release.sourceCommit?.sha ? (
                    <a href={`https://github.com/hisham-pp/sky-movie/commit/${release.sourceCommit.sha}`} target="_blank" rel="noopener noreferrer">
                      View commit
                    </a>
                  ) : null}
                </aside>
              </div>

              <div className="release-artifacts">
                <div className="section-title-row">
                  <h3>Downloads</h3>
                  {release.driveFolderUrl ? (
                    <a href={release.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                      Open Drive folder
                    </a>
                  ) : null}
                </div>

                {release.artifacts.length ? (
                  <div className="artifact-table">
                    {release.artifacts.map((artifact) => (
                      <a className="artifact-row" href={artifact.downloadUrl} key={artifact.driveFileId}>
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
        </div>
      </section>
    </main>
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
