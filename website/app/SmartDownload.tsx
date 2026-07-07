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

// Every user-facing build shown as a card, in display order.
const CARD_DEFS: Array<{ os: OS; kind: string }> = [
  { os: "macos",   kind: "dmg" },
  { os: "windows", kind: "installer" },
  { os: "linux",   kind: "appimage" },
  { os: "linux",   kind: "deb" },
];

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

function archNote(arch: string): string {
  const n = normArch(arch);
  if (n === "arm64") return "Apple Silicon / ARM64";
  if (n === "x64") return "64-bit";
  if (n === "x86") return "32-bit";
  return arch;
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

/** Best artifact for an (os, kind), preferring a target arch then x64 then anything. */
function bestArtifact(
  artifacts: DownloadArtifact[],
  os: OS,
  kind: string,
  preferArch?: Arch,
): DownloadArtifact | null {
  const list = artifacts.filter((a) => a.platform === os && a.kind.toLowerCase() === kind);
  if (list.length === 0) return null;
  if (preferArch) {
    const m = list.find((a) => normArch(a.arch) === preferArch);
    if (m) return m;
  }
  return list.find((a) => normArch(a.arch) === "x64") ?? list.find((a) => normArch(a.arch) === "arm64") ?? list[0];
}

/** The recommended (os, kind) for the visitor, walking the OS's kind order. */
function pickRecommendedKind(artifacts: DownloadArtifact[], os: OS, arch: Arch): string | null {
  for (const kind of OS_META[os].kinds) {
    if (bestArtifact(artifacts, os, kind, arch)) return kind;
  }
  return null;
}

interface Card {
  os: OS;
  kind: string;
  artifact: DownloadArtifact;
  recommended: boolean;
}

export function SmartDownload({ artifacts }: { artifacts: DownloadArtifact[] }) {
  const [detected, setDetected] = useState<OS | null>(null);
  const [arch, setArch] = useState<Arch | null>(null);

  useEffect(() => {
    setDetected(detectOS());
    void detectArch().then(setArch);
  }, []);

  // Build a card for every available build, then flag + hoist the one that
  // matches the visitor's system. Everything stays listed either way.
  const recommendedKind = detected ? pickRecommendedKind(artifacts, detected, arch ?? "x64") : null;

  const cards: Card[] = CARD_DEFS.map((def) => {
    const isRec = detected === def.os && recommendedKind === def.kind;
    const artifact = bestArtifact(artifacts, def.os, def.kind, isRec ? (arch ?? "x64") : undefined);
    if (!artifact) return null;
    return { os: def.os, kind: def.kind, artifact, recommended: isRec };
  }).filter((c): c is Card => c !== null);

  // Recommended first; original order otherwise preserved.
  cards.sort((a, b) => Number(b.recommended) - Number(a.recommended));

  return (
    <div className="flex flex-wrap items-stretch justify-center md:justify-end gap-3 w-full md:max-w-md">
      {cards.map((card) => {
        const meta = OS_META[card.os];
        return (
          <a
            key={card.artifact.downloadUrl}
            href={card.artifact.downloadUrl}
            download
            className={`group relative flex items-center gap-3 rounded-2xl px-5 py-3.5 transition-all ${
              card.recommended
                ? "bg-primary/12 border border-primary/50 ring-1 ring-primary/40 shadow-lg shadow-primary/10 hover:bg-primary/20"
                : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
            }`}
          >
            <span
              className={`material-symbols-outlined ${card.recommended ? "text-primary" : "text-secondary group-hover:text-white"}`}
            >
              {meta.icon}
            </span>
            <span className="flex flex-col leading-tight">
              <span className="flex items-center gap-2 font-label-md text-white">
                {meta.label}
                {card.recommended && (
                  <span className="text-[9px] uppercase font-bold tracking-wide text-primary bg-primary/15 border border-primary/30 px-1.5 py-0.5 rounded-full">
                    Your system
                  </span>
                )}
              </span>
              <span className="text-xs text-secondary">
                {kindLabel(card.kind)} · {archNote(card.artifact.arch)}
              </span>
            </span>
            <span
              className={`material-symbols-outlined text-base ml-1 ${
                card.recommended ? "text-primary" : "text-secondary group-hover:text-white"
              }`}
            >
              download
            </span>
          </a>
        );
      })}
    </div>
  );
}
