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
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-surface/40 flex justify-between items-center px-8 lg:px-16 h-20">
        <div className="flex items-center gap-4">
          <span className="font-display-lg text-2xl text-primary tracking-tight">Sky Movie</span>
        </div>
        <Link href="/" className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-primary font-label-md transition-all flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Home
        </Link>
      </header>

      <main className="pt-32 pb-20 px-8 lg:px-16 min-h-screen">
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto mb-16 text-center">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-4">Version History</p>
          <h1 className="font-display-lg text-5xl lg:text-6xl leading-tight mb-6 tracking-tight">
            What's <span className="gradient-text">New</span>
          </h1>
          <p className="text-secondary text-lg max-w-3xl mx-auto leading-relaxed">
            Every desktop release is generated from the release manifest. Download artifacts, view commit messages, and track all changes across versions.
          </p>
        </section>

        <WhatsNewClient releases={releaseManifest.releases} latestVersion={releaseManifest.latestVersion} />
      </main>
    </>
  );
}