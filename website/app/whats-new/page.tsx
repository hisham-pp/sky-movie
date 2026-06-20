import type { Metadata } from "next";
import Link from "next/link";
import releaseManifestJson from "../../public/releases.json";
import WhatsNewClient from "./WhatsNewClient";

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

      <WhatsNewClient releases={releaseManifest.releases} latestVersion={releaseManifest.latestVersion} />
    </main>
  );
}