"use client";

import { useEffect, useState } from "react";

export interface DownloadArtifact {
  platform: string; // 'macos' | 'windows' | 'linux'
  arch: string;     // 'x64' | 'arm64' | 'ia32' | …
  kind: string;     // 'dmg' | 'installer' | 'deb' | 'appimage' | …
  fileName: string;
  downloadUrl: string;
}

type OS = "macos" | "windows" | "linux";
type Arch = "x64" | "arm64";

const OS_META: Record<OS, { label: string; icon: string; kinds: string[] }> = {
  macos:   { label: "macOS",   icon: "desktop_mac", kinds: ["dmg"] },
  windows: { label: "Windows", icon: "window",      kinds: ["installer"] },
  linux:   { label: "Linux",   icon: "terminal",    kinds: ["appimage", "deb"] },
};

function kindLabel(kind: string): string {
  const k = kind.toLowerCase();
  if (k === "installer") return ".exe";
  if (k === "dmg") return ".dmg";
  if (k === "appimage") return ".AppImage";
  if (k === "deb") return ".deb";
  if (k === "rpm") return ".rpm";
  if (k === "tar.gz") return ".tar.gz";
  return `.${k}`;
}

function normArch(arch: string): "x64" | "arm64" | "x86" | "other" {
  const a = arch.toLowerCase();
  if (a === "x64" || a === "amd64" || a === "x86_64") return "x64";
  if (a === "arm64" || a === "aarch64") return "arm64";
  if (a === "ia32" || a === "x86") return "x86";
  return "other";
}

function detectOS(): OS | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent.toLowerCase();
  const plat = (navigator.platform || "").toLowerCase();
  if (/mac/.test(ua) || /mac/.test(plat)) return "macos";
  if (/win/.test(ua) || /win/.test(plat)) return "windows";
  if (/linux|x11|ubuntu|debian|fedora|cros/.test(ua)) return "linux";
  return null;
}

async function detectArch(): Promise<Arch | null> {
  if (typeof navigator === "undefined") return null;
  const uaData = (navigator as unknown as {
    userAgentData?: { getHighEntropyValues?(k: string[]): Promise<{ architecture?: string }> };
  }).userAgentData;
  if (uaData?.getHighEntropyValues) {
    try {
      const hev = await uaData.getHighEntropyValues(["architecture"]);
      if (hev.architecture === "arm") return "arm64";
      if (hev.architecture === "x86") return "x64";
    } catch {
      /* not available — fall through */
    }
  }
  if (/arm64|aarch64/.test(navigator.userAgent.toLowerCase())) return "arm64";
  return null;
}

/** Pick the best artifact for an OS + target arch, walking the OS's kind order. */
function pickRecommended(artifacts: DownloadArtifact[], os: OS, target: Arch): DownloadArtifact | null {
  for (const kind of OS_META[os].kinds) {
    const hit = artifacts.find(
      (a) => a.platform === os && a.kind.toLowerCase() === kind && normArch(a.arch) === target,
    );
    if (hit) return hit;
  }
  // No build for the target arch in any preferred kind — relax to any arch.
  for (const kind of OS_META[os].kinds) {
    const hit = artifacts.find((a) => a.platform === os && a.kind.toLowerCase() === kind);
    if (hit) return hit;
  }
  return null;
}

function DownloadLink({
  artifact,
  primary,
}: {
  artifact: DownloadArtifact;
  primary?: boolean;
}) {
  const os = artifact.platform as OS;
  const icon = OS_META[os]?.icon ?? "download";
  if (primary) {
    return (
      <a
        href={artifact.downloadUrl}
        download
        className="w-full sm:w-auto px-8 py-4 bg-primary text-on-primary font-label-md text-base rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
      >
        <span className="material-symbols-outlined">download</span>
        <span className="flex flex-col items-start leading-tight">
          <span>Download for {OS_META[os]?.label ?? "your system"}</span>
          <span className="text-xs font-normal opacity-80">
            {kindLabel(artifact.kind)}
            {normArch(artifact.arch) === "arm64" ? " · Apple Silicon / ARM64" : normArch(artifact.arch) === "x64" ? " · 64-bit" : ""}
          </span>
        </span>
      </a>
    );
  }
  return (
    <a
      href={artifact.downloadUrl}
      download
      className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-label-md hover:bg-primary hover:text-on-primary transition-all flex items-center gap-2"
    >
      <span className="material-symbols-outlined text-base">{icon}</span>
      {kindLabel(artifact.kind)}
    </a>
  );
}

export function SmartDownload({ artifacts }: { artifacts: DownloadArtifact[] }) {
  const [detected, setDetected] = useState<OS | null>(null);
  const [arch, setArch] = useState<Arch | null>(null);

  useEffect(() => {
    setDetected(detectOS());
    void detectArch().then(setArch);
  }, []);

  // The canonical flat list (one button per user-facing kind), matching the
  // builds the site has always offered. Used for SSR / no-detection fallback
  // and for the "other platforms" row.
  const canonical: DownloadArtifact[] = [
    artifacts.find((a) => a.kind.toLowerCase() === "dmg"),
    artifacts.find((a) => a.kind.toLowerCase() === "installer"),
    artifacts.find((a) => a.kind.toLowerCase() === "deb" && a.fileName.includes("amd64")),
    artifacts.find((a) => a.kind.toLowerCase() === "appimage"),
  ].filter((a): a is DownloadArtifact => Boolean(a));

  const recommended = detected ? pickRecommended(artifacts, detected, arch ?? "x64") : null;

  // Fallback: no OS detected (SSR or unknown) → original equal button row.
  if (!recommended) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
        {canonical.map((a) => (
          <DownloadLink key={a.downloadUrl} artifact={a} />
        ))}
      </div>
    );
  }

  // Same-OS alternates (e.g. Linux .deb when we recommend .AppImage) shown as
  // small chips; other operating systems shown as secondary buttons.
  const sameOsAlternates = canonical.filter(
    (a) => a.platform === recommended.platform && a.downloadUrl !== recommended.downloadUrl,
  );
  const otherOs = canonical.filter((a) => a.platform !== recommended.platform);

  return (
    <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <DownloadLink artifact={recommended} primary />
        {sameOsAlternates.map((a) => (
          <DownloadLink key={a.downloadUrl} artifact={a} />
        ))}
      </div>
      {otherOs.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-secondary text-xs mr-1">Other platforms:</span>
          {otherOs.map((a) => (
            <a
              key={a.downloadUrl}
              href={a.downloadUrl}
              download
              className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-secondary text-sm hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">{OS_META[a.platform as OS]?.icon ?? "download"}</span>
              {OS_META[a.platform as OS]?.label ?? a.platform} ({kindLabel(a.kind)})
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
