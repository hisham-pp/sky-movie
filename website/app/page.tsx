import releaseManifestJson from "../public/releases.json";
import Link from "next/link";
import { ExpandableImage } from "./ExpandableImage";
import { PlayerCarousel } from "./PlayerCarousel";
import { AppShowcase } from "./AppShowcase";

const repoUrl = "https://github.com/hisham-pp/sky-movie";

interface ReleaseManifest {
  latestVersion: string;
  updatedAt: string | null;
  releases: Array<{
    version: string;
    releasedAt: string | null;
    storageProvider?: string;
    storageFolderUrl?: string | null;
    notes: string;
    changes?: string[];
    artifacts: Array<{
      platform: string;
      kind: string;
      fileName: string;
      downloadUrl: string;
    }>;
  }>;
}

const releaseManifest = releaseManifestJson as ReleaseManifest;

export default function Home() {
  const latestRelease = releaseManifest.releases[0];
  const secondRelease = releaseManifest.releases[1];

  const getDmgArtifact = (release: typeof latestRelease) =>
    release?.artifacts.find(a => a.kind === 'dmg');
  const getExeArtifact = (release: typeof latestRelease) =>
    release?.artifacts.find(a => a.kind === 'installer');
  const getDebArtifact = (release: typeof latestRelease) =>
    release?.artifacts.find(a => a.kind === 'deb' && a.fileName.includes('amd64'));
  const getAppImageArtifact = (release: typeof latestRelease) =>
    release?.artifacts.find(a => a.kind === 'appimage');

  const latestDmg = getDmgArtifact(latestRelease);
  const latestExe = getExeArtifact(latestRelease);
  const latestDeb = getDebArtifact(latestRelease);
  const latestAppImage = getAppImageArtifact(latestRelease);

  const formatReleaseDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not released yet';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  const isBetaVersion = (version: string) => {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!match) return false;
    return parseInt(match[1]) < 1;
  };

  return (
    <>
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-surface/40 flex justify-between items-center px-container-padding h-20">
        <div className="flex items-center gap-4">
          <span className="font-display-lg text-headline-sm text-primary tracking-tight">Sky Movie</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a className="text-secondary font-label-md hover:text-primary transition-colors" href="#features">Features</a>
          <a className="text-secondary font-label-md hover:text-primary transition-colors" href="#player">Player</a>
          <a className="text-secondary font-label-md hover:text-primary transition-colors" href="#platforms">Platforms</a>
          <a className="text-secondary font-label-md hover:text-primary transition-colors" href="#downloads">Download</a>
          <Link className="text-secondary font-label-md hover:text-primary transition-colors" href="/docs">Docs</Link>
          <a className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-primary font-label-md transition-all flex items-center gap-2" href={repoUrl}>
            <span className="material-symbols-outlined text-sm">code</span>
            GitHub
          </a>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative pt-40 pb-20 px-container-padding overflow-hidden">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <h1 className="font-display-lg text-[64px] md:text-[80px] leading-[1.1] mb-6 tracking-tight">
              Your Personal Cinema, <span className="gradient-text">Perfected.</span>
            </h1>
            <p className="font-body-lg text-secondary max-w-2xl mx-auto mb-10 text-lg md:text-xl">
              The premium media manager for the cinematic connoisseur. Scan local collections, automate metadata, and experience your library with a native libmpv player — smooth, fast, and gesture-driven.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a className="w-full sm:w-auto px-8 py-4 bg-primary text-on-primary font-label-md text-base rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2" href="#downloads">
                <span className="material-symbols-outlined">download</span>
                Download Free
              </a>
              <Link className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-primary font-label-md text-base rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2" href="/docs">
                View Documentation
              </Link>
            </div>
          </div>
        </section>

        {/* App Showcase */}
        <section className="px-container-padding pb-stack-lg max-w-6xl mx-auto">
          <AppShowcase />
        </section>

        {/* Library Features Grid */}
        <section className="py-24 px-container-padding max-w-7xl mx-auto" id="features">
          <div className="text-center mb-16">
            <h2 className="font-headline-md text-3xl md:text-4xl mb-4">Everything your library needs</h2>
            <p className="text-secondary font-body-lg max-w-xl mx-auto">From scanning to playback, Sky Movie handles your entire collection with zero compromise.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-grid-gutter mb-grid-gutter">
            <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">folder_managed</span>
              </div>
              <h3 className="font-headline-sm text-xl mb-3">Instant Folder Scanning</h3>
              <p className="text-secondary text-sm leading-relaxed">Point to your movie directory and let Sky Movie do the heavy lifting in seconds.</p>
            </div>

            <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">auto_awesome</span>
              </div>
              <h3 className="font-headline-sm text-xl mb-3">Automated Metadata</h3>
              <p className="text-secondary text-sm leading-relaxed">Beautiful posters, backdrops, and cast info fetched automatically for every title.</p>
            </div>

            <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">high_quality</span>
              </div>
              <h3 className="font-headline-sm text-xl mb-3">4K &amp; HDR Support</h3>
              <p className="text-secondary text-sm leading-relaxed">Full technical info for your high-fidelity collection, including HDR10+ and Dolby Vision.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-grid-gutter">
            <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">collections</span>
              </div>
              <h3 className="font-headline-sm text-xl mb-3">Clean Management</h3>
              <p className="text-secondary text-sm leading-relaxed">Organize by genre, year, or rating with a UI that stays out of your way.</p>
            </div>

            <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group border-primary/20">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">search</span>
              </div>
              <h3 className="font-headline-sm text-xl mb-3">Instant Search <span className="text-primary text-sm font-label-md ml-2 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full align-middle">Ctrl+K</span></h3>
              <p className="text-secondary text-sm leading-relaxed mb-4">Search your entire library in milliseconds. Navigate to Movies, TV Shows, Playlists, Scan, or Settings — all from one keystroke. Results prioritize navigation then content.</p>
              <div className="flex flex-wrap gap-2">
                {['Movies', 'TV Shows', 'Playlists', 'Scan', 'Settings'].map(item => (
                  <span key={item} className="text-xs bg-white/5 border border-white/10 text-secondary px-2.5 py-1 rounded-full">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Player Showcase ───────────────────────────────────────────────── */}
        <section className="py-24 px-container-padding relative overflow-hidden" id="player">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent -z-10"></div>
          <div className="max-w-7xl mx-auto">

            {/* Heading */}
            <div className="text-center mb-20">
              <span className="inline-flex items-center gap-2 text-primary text-sm font-label-md bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-6">
                <span className="material-symbols-outlined text-base">play_circle</span>
                Native libmpv Player
              </span>
              <h2 className="font-headline-md text-3xl md:text-5xl mb-6">
                A player built for <span className="gradient-text">real cinephiles.</span>
              </h2>
              <p className="text-secondary font-body-lg max-w-2xl mx-auto text-lg">
                Powered by libmpv under the hood — the same engine behind VLC and MPV. Hardware-decoded, frame-accurate, and gesture-native.
              </p>
            </div>

            {/* Player screenshots carousel */}
            <PlayerCarousel />

            {/* Player feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

              <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">touch_app</span>
                </div>
                <h3 className="font-headline-sm text-lg mb-3">Gesture Controls</h3>
                <ul className="text-secondary text-sm leading-relaxed space-y-2">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>Single click — Play / Pause</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>Double-click left — Rewind 10s</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>Double-click right — Forward 10s</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>Scroll wheel — Volume</li>
                </ul>
              </div>

              <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">volume_up</span>
                </div>
                <h3 className="font-headline-sm text-lg mb-3">Audio Boost up to 200%</h3>
                <p className="text-secondary text-sm leading-relaxed mb-4">Push quiet content beyond 100% with native mpv audio amplification. A top-left OSD instantly shows your volume level whenever you adjust it.</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-primary to-primary/60 rounded-full"></div>
                  </div>
                  <span className="text-primary text-xs font-bold tabular-nums">150%</span>
                </div>
              </div>

              <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">keyboard</span>
                </div>
                <h3 className="font-headline-sm text-lg mb-3">Keyboard Shortcuts</h3>
                <ul className="text-secondary text-sm leading-relaxed space-y-2">
                  <li className="flex justify-between"><span>Space / K</span><kbd className="text-xs bg-white/5 border border-white/10 rounded px-1.5">Play/Pause</kbd></li>
                  <li className="flex justify-between"><span>← / →</span><kbd className="text-xs bg-white/5 border border-white/10 rounded px-1.5">±5 seconds</kbd></li>
                  <li className="flex justify-between"><span>↑ / ↓</span><kbd className="text-xs bg-white/5 border border-white/10 rounded px-1.5">Volume ±5%</kbd></li>
                  <li className="flex justify-between"><span>F</span><kbd className="text-xs bg-white/5 border border-white/10 rounded px-1.5">Fullscreen</kbd></li>
                  <li className="flex justify-between"><span>M</span><kbd className="text-xs bg-white/5 border border-white/10 rounded px-1.5">Mute</kbd></li>
                </ul>
              </div>
            </div>

            {/* Second row: wider cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">tune</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-lg mb-3">Track &amp; Subtitle Control</h3>
                    <p className="text-secondary text-sm leading-relaxed">Switch audio tracks on the fly, toggle subtitles, or load external SRT / ASS files without interrupting playback. Multiple language tracks supported natively.</p>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">speed</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-lg mb-3">Variable Speed &amp; Watch Progress</h3>
                    <p className="text-secondary text-sm leading-relaxed">Playback speeds from 0.25× to 2×. Resume exactly where you left off — progress is saved automatically every 10 seconds and on close.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Downloads */}
        <section className="py-20 bg-surface-container-low px-container-padding relative overflow-hidden" id="downloads">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline-md text-white mb-4">Ready to upgrade your collection?</h2>
              <p className="text-secondary font-body-lg">Download the latest stable release for your operating system.</p>
              {isBetaVersion(latestRelease?.version || '') && (
                <div className="mt-6 max-w-2xl mx-auto p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                  <p className="text-orange-400 text-sm">
                    <strong>⚠️ Beta Software Notice:</strong> Windows may show a security warning because this app is not yet code-signed.
                    Click "More info" → "Run anyway" to install. The app is safe and open source.
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">rocket_launch</span>
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-lg flex items-center gap-2">
                      {latestRelease?.version}
                      {isBetaVersion(latestRelease?.version || '') ? (
                        <span className="bg-orange-500/10 text-orange-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-orange-500/20">Beta</span>
                      ) : (
                        <span className="bg-primary/10 text-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-primary/20">Latest</span>
                      )}
                    </h4>
                    <p className="text-secondary text-sm">Released {formatReleaseDate(latestRelease?.releasedAt)} • macOS, Windows, Linux</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
                  {latestDmg && (
                    <a href={latestDmg.downloadUrl} download className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-label-md hover:bg-primary hover:text-on-primary transition-all flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">desktop_mac</span>
                      .dmg
                    </a>
                  )}
                  {latestExe && (
                    <a href={latestExe.downloadUrl} download className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-label-md hover:bg-primary hover:text-on-primary transition-all flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">window</span>
                      .exe
                    </a>
                  )}
                  {latestDeb && (
                    <a href={latestDeb.downloadUrl} download className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-label-md hover:bg-primary hover:text-on-primary transition-all flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">terminal</span>
                      .deb
                    </a>
                  )}
                  {latestAppImage && (
                    <a href={latestAppImage.downloadUrl} download className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-label-md hover:bg-primary hover:text-on-primary transition-all flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">terminal</span>
                      .AppImage
                    </a>
                  )}
                </div>
              </div>

              {secondRelease && (
                <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 hover:opacity-100 transition-all border-white/5">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined">history</span>
                    </div>
                    <div>
                      <h4 className="font-headline-sm text-lg">{secondRelease.version}</h4>
                      <p className="text-secondary text-sm">Released {formatReleaseDate(secondRelease.releasedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href="/whats-new" className="px-4 py-2 bg-white/5 rounded-lg text-secondary text-sm hover:text-white transition-colors">View Changes</Link>
                    <Link href="/whats-new" className="px-4 py-2 bg-white/5 rounded-lg text-secondary text-sm hover:text-white transition-colors">Download Assets</Link>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-12 text-center">
              <Link href="/whats-new" className="text-primary font-label-md flex items-center justify-center gap-2 group">
                Browse all releases and changelogs
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Supported Platforms */}
        <section className="py-20 px-container-padding max-w-5xl mx-auto" id="platforms">
          <div className="text-center mb-12">
            <h2 className="font-headline-md text-3xl md:text-4xl mb-4">Supported Platforms</h2>
            <p className="text-secondary font-body-lg max-w-xl mx-auto">Sky Movie runs natively on all major desktop operating systems.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* macOS */}
            <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">desktop_mac</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-lg">macOS</h3>
                  <span className="text-primary text-xs font-bold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">✓ Supported</span>
                </div>
              </div>
              <ul className="text-secondary text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                  macOS 11 Big Sur or later
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                  Apple Silicon (M1/M2/M3) — native ARM build
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                  Intel x64 — universal binary
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                  Download as <code className="text-primary">.dmg</code>
                </li>
              </ul>
            </div>

            {/* Windows */}
            <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">window</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-lg">Windows</h3>
                  <span className="text-primary text-xs font-bold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">✓ Supported</span>
                </div>
              </div>
              <ul className="text-secondary text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                  Windows 10 (64-bit) or later
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                  Windows 11 — fully tested
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                  x64 architecture required
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                  Download as <code className="text-primary">.exe</code> installer
                </li>
              </ul>
            </div>

            {/* Linux */}
            <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">terminal</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-lg">Linux</h3>
                  <span className="text-primary text-xs font-bold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">✓ Supported</span>
                </div>
              </div>
              <ul className="text-secondary text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                  Ubuntu 20.04+ / Debian 11+
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                  Fedora 38+, Arch Linux
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                  x64 and ARM64
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                  Download as <code className="text-primary">.deb</code> or <code className="text-primary">.AppImage</code>
                </li>
              </ul>
            </div>

          </div>

          {/* System requirements note */}
          <div className="mt-8 p-5 bg-white/3 border border-white/5 rounded-2xl flex items-start gap-4">
            <span className="material-symbols-outlined text-primary text-xl flex-shrink-0 mt-0.5">info</span>
            <p className="text-secondary text-sm leading-relaxed">
              Sky Movie is built on <strong className="text-white">Electron + libmpv</strong> for native hardware-accelerated playback.
              Minimum <strong className="text-white">4 GB RAM</strong> and <strong className="text-white">200 MB</strong> of disk space required.
              GPU acceleration recommended for 4K / HDR content.
            </p>
          </div>
        </section>

        {/* Documentation Preview */}
        <section className="py-24 px-container-padding max-w-7xl mx-auto" id="docs">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="lg:w-1/3">
              <h2 className="font-headline-md mb-6">Built for enthusiasts, <span className="text-primary">extensible</span> for developers.</h2>
              <p className="text-secondary mb-8">Whether you're just setting up your first library or building a custom integration, our comprehensive docs have you covered.</p>
              <div className="p-1 px-4 bg-primary/5 border border-primary/20 rounded-full inline-flex items-center gap-2 text-primary font-label-sm">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                Docs updated for {latestRelease?.version}
              </div>
            </div>
            <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              <Link className="glass-panel p-8 rounded-3xl border-white/5 hover:bg-white/5 transition-all group" href="/docs#introduction">
                <span className="material-symbols-outlined text-primary mb-4 block">menu_book</span>
                <h4 className="font-headline-sm text-xl mb-2 group-hover:text-primary">Getting Started</h4>
                <p className="text-secondary text-sm">Installation guide and first-time configuration walkthrough.</p>
              </Link>
              <Link className="glass-panel p-8 rounded-3xl border-white/5 hover:bg-white/5 transition-all group" href="/docs#naming-conventions">
                <span className="material-symbols-outlined text-primary mb-4 block">settings_suggest</span>
                <h4 className="font-headline-sm text-xl mb-2 group-hover:text-primary">Library Setup</h4>
                <p className="text-secondary text-sm">Learn how to optimize your folder structure for best scanning results.</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-container-padding text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 -z-10"></div>
          <div className="max-w-3xl mx-auto">
            <h2 className="font-headline-md text-4xl mb-4">Experience Cinema at Home.</h2>
            <p className="text-secondary mb-10 font-body-lg">Native player. Gesture controls. Audio boost. Everything you need, nothing you don't.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#downloads" className="px-10 py-5 bg-primary text-on-primary rounded-2xl font-label-md text-lg hover:shadow-[0_0_40px_rgba(137,206,255,0.3)] transition-all">
                Get Started Now
              </a>
              <a href={repoUrl} className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-label-md text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path></svg>
                Star on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-white/5 pt-20 pb-10 px-container-padding">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1">
            <span className="font-display-lg text-headline-sm text-primary tracking-tight block mb-6">Sky Movie</span>
            <p className="text-secondary text-sm leading-relaxed">The premium open-source movie library manager built for the next generation of cinema lovers.</p>
          </div>
          <div>
            <h5 className="text-white font-label-md mb-6 uppercase tracking-widest text-[10px]">Product</h5>
            <ul className="space-y-4 text-sm text-secondary">
              <li><Link className="hover:text-primary transition-colors" href="/whats-new">Changelog</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/docs">Documentation</Link></li>
              <li><a className="hover:text-primary transition-colors" href="#downloads">Releases</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-label-md mb-6 uppercase tracking-widest text-[10px]">Community</h5>
            <ul className="space-y-4 text-sm text-secondary">
              <li><a className="hover:text-primary transition-colors" href={repoUrl}>GitHub Repository</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Discord Server</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">X / Twitter</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-label-md mb-6 uppercase tracking-widest text-[10px]">Developer</h5>
            <ul className="space-y-4 text-sm text-secondary">
              <li><a className="hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Terms of Service</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Contributor Guide</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-white/5">
          <div className="flex flex-col gap-2">
            <p className="text-secondary text-xs">© 2024 Sky Movie Project. Released under MIT License.</p>
            <p className="text-white/30 text-xs">
              Inspired by{" "}
              <a href="https://seanime.app/" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-primary transition-colors">Seanime</a>
              {" "}—{" "}
              <a href="https://github.com/5rahim/seanime" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-primary transition-colors">GitHub</a>
            </p>
          </div>
          <a className="text-secondary hover:text-white transition-colors" href={repoUrl}>
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path></svg>
          </a>
        </div>
      </footer>
    </>
  );
}
