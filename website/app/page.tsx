import releaseManifestJson from "../public/releases.json";
import Link from "next/link";
import Image from "next/image";
import { PlayerCarousel } from "./PlayerCarousel";
import { AppShowcase } from "./AppShowcase";
import { SmartDownload } from "./SmartDownload";

const repoUrl = "https://github.com/hisham-pp/sky-movie";
const siteUrl = "https://sky-movie-website.vercel.app";

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
      arch: string;
      kind: string;
      fileName: string;
      downloadUrl: string;
    }>;
  }>;
}

const releaseManifest = releaseManifestJson as ReleaseManifest;

const faqItems = [
  {
    question: "What is Sky Movie and how does it work?",
    answer:
      "Sky Movie is a free, local-first desktop application designed to organize, manage, and play your personal movie and TV show library on Windows, macOS, and Linux. Built with Electron, React, SQLite, and a native libmpv player addon, Sky Movie scans your local storage folders, automatically downloads rich metadata and posters from TMDB, and plays any video format without requiring external codecs or cloud servers.",
  },
  {
    question: "Is Sky Movie open-source and free to use?",
    answer:
      "Yes. Sky Movie is 100% free software released under the permissive MIT License. There are no subscriptions, paywalls, premium tiers, or hidden fees. The complete source code is publicly accessible on GitHub.",
  },
  {
    question: "Does Sky Movie require an internet connection or cloud account?",
    answer:
      "No. Sky Movie is architected around a strict local-first MVP philosophy. All movie records, playback history, and playlists are stored directly in a local SQLite database on your computer. An internet connection is only needed when initially fetching TMDB posters/metadata, downloading YouTube videos via yt-dlp, or searching torrents.",
  },
  {
    question: "What video formats and codecs are supported by the media player?",
    answer:
      "Sky Movie uses a native libmpv playback engine with full hardware decoding support. It natively plays MKV, MP4, AVI, WebM, TS, and MOV containers, along with H.264, HEVC (H.265), VP9, and AV1 codecs. It also supports 4K UHD, HDR10+, Dolby Vision, ASS/SSA stylized subtitles, and multi-track audio switching with up to 200% volume boost.",
  },
  {
    question: "How does YouTube video downloading work in Sky Movie?",
    answer:
      "Sky Movie integrates yt-dlp to allow downloading supported YouTube videos and educational lectures directly to your local drive. Downloaded videos are automatically cataloged into your local library, allowing offline playback and playlist management with zero buffering or streaming lag.",
  },
  {
    question: "How do I install Sky Movie on Windows, macOS, and Linux?",
    answer:
      "On Windows, download and run the 64-bit installer (.exe). On macOS, download the .dmg package (native builds available for Apple Silicon M1/M2/M3 and Intel). On Linux, you can use the standalone .AppImage (make executable with chmod +x and run) or install the .deb package on Debian/Ubuntu systems.",
  },
  {
    question: "How does watch history and playback progress tracking work?",
    answer:
      "Playback position is automatically saved to the local SQLite database every 10 seconds and upon window closing. When you return to any movie or episode, Sky Movie automatically prompts or resumes from the exact millisecond you left off.",
  },
];

export default function Home() {
  const latestRelease = releaseManifest.releases[0];
  const secondRelease = releaseManifest.releases[1];

  const formatReleaseDate = (dateStr: string | null) => {
    if (!dateStr) return "Not released yet";
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
  };

  const isBetaVersion = (version: string) => {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!match) return false;
    return parseInt(match[1]) < 1;
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-surface/40 flex justify-between items-center px-container-padding h-20 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-display-lg text-headline-sm text-primary tracking-tight hover:opacity-90 transition-opacity">
            Sky Movie
          </Link>
          <span className="hidden lg:inline-block text-xs text-white/40 border border-white/10 px-2.5 py-0.5 rounded-full font-mono">
            v{latestRelease?.version || "0.10.11"}
          </span>
        </div>
        <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-7">
          <a className="text-secondary font-label-md hover:text-primary transition-colors text-sm" href="#features">Features</a>
          <a className="text-secondary font-label-md hover:text-primary transition-colors text-sm" href="#player">Player</a>
          <a className="text-secondary font-label-md hover:text-primary transition-colors text-sm" href="#ytdl">YouTube</a>
          <a className="text-secondary font-label-md hover:text-primary transition-colors text-sm" href="#torrent">Torrents</a>
          <a className="text-secondary font-label-md hover:text-primary transition-colors text-sm" href="#architecture">Architecture</a>
          <a className="text-secondary font-label-md hover:text-primary transition-colors text-sm" href="#platforms">Platforms</a>
          <a className="text-secondary font-label-md hover:text-primary transition-colors text-sm" href="#guides">Guides</a>
          <a className="text-secondary font-label-md hover:text-primary transition-colors text-sm" href="#faq">FAQ</a>
          <Link className="text-secondary font-label-md hover:text-primary transition-colors text-sm" href="/docs">Docs</Link>
          <a className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-primary font-label-md transition-all flex items-center gap-2 text-sm" href={repoUrl} target="_blank" rel="noopener noreferrer">
            <span className="material-symbols-outlined text-sm">code</span>
            GitHub
          </a>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-36 pb-20 px-container-padding overflow-hidden">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            {/* Feature Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                <span className="material-symbols-outlined text-xs">storage</span>
                Local SQLite Storage
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-white/80 border border-white/10">
                <span className="material-symbols-outlined text-xs">play_circle</span>
                Native libmpv Player
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-white/80 border border-white/10">
                <span className="material-symbols-outlined text-xs">download</span>
                yt-dlp Downloader
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="material-symbols-outlined text-xs">verified</span>
                Free &amp; Open Source (MIT)
              </span>
            </div>

            <h1 className="font-display-lg text-4xl sm:text-6xl md:text-7xl leading-[1.1] mb-6 tracking-tight">
              Manage Your Movie and TV Show Library with <span className="gradient-text">Sky Movie</span>
            </h1>
            <p className="font-body-lg text-secondary max-w-3xl mx-auto mb-10 text-lg md:text-xl leading-relaxed">
              The free, local-first desktop application for managing movies and TV shows, tracking playlists and watch history, downloading supported YouTube videos with yt-dlp, and playing high-fidelity media using native libmpv on Windows, macOS, and Linux.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a className="w-full sm:w-auto px-8 py-4 bg-primary text-on-primary font-label-md text-base rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20" href="#downloads">
                <span className="material-symbols-outlined">download</span>
                Download Free for Desktop
              </a>
              <Link className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-primary font-label-md text-base rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2" href="/docs">
                <span className="material-symbols-outlined text-sm">menu_book</span>
                View Documentation
              </Link>
            </div>
            <p className="text-white/40 text-xs mt-4">
              Requires no account • 100% private SQLite database on your disk • Zero telemetry
            </p>
          </div>
        </section>

        {/* App Showcase Gallery */}
        <section className="px-container-padding pb-stack-lg max-w-6xl mx-auto" aria-label="Application Showcase">
          <AppShowcase />
        </section>

        {/* Core Library Features Grid */}
        <section className="py-24 px-container-padding max-w-7xl mx-auto" id="features">
          <div className="text-center mb-16">
            <span className="text-primary text-xs uppercase tracking-widest font-semibold bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
              Desktop Media Management
            </span>
            <h2 className="font-headline-md text-3xl md:text-5xl mt-4 mb-4">
              Everything your local collection needs
            </h2>
            <p className="text-secondary font-body-lg max-w-2xl mx-auto text-base md:text-lg">
              From instant directory scanning to automatic poster art and playback progress, Sky Movie organizes your movies and TV shows with zero cloud overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-grid-gutter mb-grid-gutter">
            {/* Card 1 */}
            <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">folder_managed</span>
              </div>
              <h3 className="font-headline-sm text-xl mb-3">Instant Folder Scanning</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Point Sky Movie to your external drive or local movie folders. The high-throughput scanner indexes thousands of video files in seconds using asynchronous file discovery.
              </p>
            </div>

            {/* Card 2 */}
            <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">auto_awesome</span>
              </div>
              <h3 className="font-headline-sm text-xl mb-3">Automated TMDB Metadata</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Automated token matching scrapes official TMDB posters, high-res backdrops, release dates, plot summaries, and cast information directly into your local database.
              </p>
            </div>

            {/* Card 3 */}
            <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">high_quality</span>
              </div>
              <h3 className="font-headline-sm text-xl mb-3">4K UHD &amp; HDR Support</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Full technical metadata extraction for high-bitrate collections, including HDR10+, Dolby Vision color profiles, surround sound audio tracks, and container specs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-grid-gutter">
            {/* Card 4 */}
            <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">playlist_play</span>
              </div>
              <h3 className="font-headline-sm text-xl mb-3">Playlists &amp; Watch History</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Create custom movie marathons and binge lists. Playback progress is saved every 10 seconds to SQLite, letting you resume seamlessly right where you paused.
              </p>
            </div>

            {/* Card 5 */}
            <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">tv</span>
              </div>
              <h3 className="font-headline-sm text-xl mb-3">TV Shows &amp; Season Guides</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Organize full television series with structured season trees, episode guides, aired dates, and individual episode watch badges.
              </p>
            </div>

            {/* Card 6 */}
            <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group border-primary/20">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">search</span>
              </div>
              <h3 className="font-headline-sm text-xl mb-3">
                Instant Search <span className="text-primary text-xs font-mono ml-2 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full align-middle">Ctrl+K</span>
              </h3>
              <p className="text-secondary text-sm leading-relaxed mb-4">
                Fuzzy search your entire collection in milliseconds. Navigate to Movies, TV Shows, Playlists, Downloads, or Settings with a single keystroke.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["Movies", "TV Shows", "Playlists", "Downloads", "Scan", "Settings"].map((item) => (
                  <span key={item} className="text-[11px] bg-white/5 border border-white/10 text-secondary px-2 py-0.5 rounded-full">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Player Showcase Section */}
        <section className="py-24 px-container-padding relative overflow-hidden" id="player">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent -z-10"></div>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 text-primary text-sm font-label-md bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-6">
                <span className="material-symbols-outlined text-base">play_circle</span>
                Native libmpv Player Engine
              </span>
              <h2 className="font-headline-md text-3xl md:text-5xl mb-6">
                A desktop player built for <span className="gradient-text">real cinephiles.</span>
              </h2>
              <p className="text-secondary font-body-lg max-w-2xl mx-auto text-lg leading-relaxed">
                Powered by a C++ native libmpv background thread. Direct hardware decoding for MKV, HEVC, and 4K HDR without browser codec restrictions or quality loss.
              </p>
            </div>

            <PlayerCarousel />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">touch_app</span>
                </div>
                <h3 className="font-headline-sm text-lg mb-3">Intuitive Gesture Controls</h3>
                <ul className="text-secondary text-sm leading-relaxed space-y-2">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>Single click &mdash; Play / Pause</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>Double-click left &mdash; Rewind 10s</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>Double-click right &mdash; Fast-forward 10s</li>
                </ul>
              </div>

              <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">volume_up</span>
                </div>
                <h3 className="font-headline-sm text-lg mb-3">Audio Boost up to 200%</h3>
                <p className="text-secondary text-sm leading-relaxed mb-4">
                  Amplify quiet audio tracks beyond standard system limits with native mpv amplification and a floating real-time volume OSD.
                </p>
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
                  <li className="flex justify-between"><span>&larr; / &rarr;</span><kbd className="text-xs bg-white/5 border border-white/10 rounded px-1.5">&plusmn;5 seconds</kbd></li>
                  <li className="flex justify-between"><span>&uarr; / &darr;</span><kbd className="text-xs bg-white/5 border border-white/10 rounded px-1.5">Volume &plusmn;5%</kbd></li>
                  <li className="flex justify-between"><span>F</span><kbd className="text-xs bg-white/5 border border-white/10 rounded px-1.5">Fullscreen</kbd></li>
                  <li className="flex justify-between"><span>M</span><kbd className="text-xs bg-white/5 border border-white/10 rounded px-1.5">Mute</kbd></li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">closed_caption</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-lg mb-3">Subtitles &amp; Audio Track Switching</h3>
                    <p className="text-secondary text-sm leading-relaxed">
                      Switch audio tracks seamlessly, toggle internal embedded subtitles, or drag-and-drop external SRT or stylized ASS subtitle files without restarting playback.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">speed</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-lg mb-3">Variable Speed Playback (0.25x &ndash; 2x)</h3>
                    <p className="text-secondary text-sm leading-relaxed">
                      Pitch-corrected speed controls from 0.25x slow motion up to 2.0x acceleration. Ideal for documentaries, foreign language study, or catching up on shows.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* YouTube Video Downloader Section */}
        <section className="py-24 px-container-padding relative overflow-hidden" id="ytdl">
          <div className="max-w-7xl mx-auto">
            <div className="glass-panel p-8 md:p-14 rounded-3xl border-primary/20 relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <span className="inline-flex items-center gap-2 text-primary text-xs font-semibold bg-primary/10 border border-primary/20 px-3.5 py-1 rounded-full mb-6">
                    <span className="material-symbols-outlined text-sm">cloud_download</span>
                    yt-dlp Video Downloader
                  </span>
                  <h2 className="font-headline-md text-3xl md:text-4xl mb-6">
                    Download supported YouTube videos directly to your library.
                  </h2>
                  <p className="text-secondary font-body-lg mb-6 leading-relaxed">
                    Sky Movie integrates yt-dlp to let you save online videos, documentaries, and educational lectures to your local machine for permanent offline viewing.
                  </p>
                  <ul className="space-y-3.5 text-secondary text-sm mb-8">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2"></span>
                      <span><strong>High-Resolution Downloads:</strong> Save videos in 1080p, 1440p, or 4K with audio track matching.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2"></span>
                      <span><strong>Seamless Library Addition:</strong> Downloaded files immediately appear in your library and custom playlists.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2"></span>
                      <span><strong>Zero Streaming Buffer:</strong> Enjoy smooth offline playback with full libmpv hardware decoding and gesture controls.</span>
                    </li>
                  </ul>
                  <div className="flex items-center gap-4">
                    <a href="#downloads" className="px-6 py-3 bg-primary text-on-primary font-label-md rounded-xl text-sm hover:scale-105 active:scale-95 transition-all">
                      Download Sky Movie
                    </a>
                    <Link href="/docs#youtube" className="text-secondary hover:text-white text-sm font-label-md flex items-center gap-1 transition-colors">
                      Learn how it works &rarr;
                    </Link>
                  </div>
                </div>

                <div className="relative">
                  <div className="glass-panel p-2 rounded-2xl border-white/10 shadow-2xl overflow-hidden">
                    <Image
                      src="/screen-shots/yt-player.png"
                      alt="Sky Movie YouTube-style player skin with nested settings and controls"
                      width={1200}
                      height={675}
                      className="w-full h-auto rounded-xl block"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-center text-white/40 text-xs mt-3">
                    YouTube player skin with sleep timer, voice boost, and subtitle controls
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Torrent Download Manager Section */}
        <section className="py-24 px-container-padding relative overflow-hidden" id="torrent">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 text-primary text-sm font-label-md bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-6">
                <span className="material-symbols-outlined text-base">download</span>
                Built-in Torrent Manager
              </span>
              <h2 className="font-headline-md text-3xl md:text-5xl mb-6">
                Find it. Download it. <span className="gradient-text">Watch it.</span>
              </h2>
              <p className="text-secondary font-body-lg max-w-2xl mx-auto text-lg leading-relaxed">
                An embedded WebTorrent client &mdash; search multiple public providers in parallel, download in the background, and have files renamed and added to your library automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <div className="glass-panel p-6 rounded-2xl hover:border-primary/40 transition-all group">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-xl">travel_explore</span>
                </div>
                <h3 className="font-headline-sm text-base mb-2">Multi-Provider Search</h3>
                <p className="text-secondary text-sm leading-relaxed">YTS, The Pirate Bay, EZTV searched concurrently with info-hash deduplication.</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl hover:border-primary/40 transition-all group">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-xl">manage_history</span>
                </div>
                <h3 className="font-headline-sm text-base mb-2">Persistent Downloads</h3>
                <p className="text-secondary text-sm leading-relaxed">Downloads survive app restarts. Active torrents automatically resume when Sky Movie opens.</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl hover:border-primary/40 transition-all group">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-xl">drive_file_rename_outline</span>
                </div>
                <h3 className="font-headline-sm text-base mb-2">Auto File Renaming</h3>
                <p className="text-secondary text-sm leading-relaxed">Completed files are renamed to match standard conventions: <code className="text-primary text-xs font-mono">Title (Year).mkv</code>.</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl hover:border-primary/40 transition-all group">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-xl">tune</span>
                </div>
                <h3 className="font-headline-sm text-base mb-2">Configurable Limits</h3>
                <p className="text-secondary text-sm leading-relaxed">Speed caps, maximum active queues, DHT/PEX toggles, and auto-seed ratio control.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
              <div className="lg:col-span-3 glass-panel p-2 rounded-[24px] shadow-2xl border-white/10 overflow-hidden">
                <Image
                  src="/screen-shots/torrent-search-results.png"
                  alt="Sky Movie torrent search results from multiple providers with quality badges"
                  width={1200}
                  height={675}
                  className="w-full h-auto block rounded-[18px]"
                  loading="lazy"
                />
                <p className="text-center text-white/30 text-xs py-2">Search across YTS, TPB, and EZTV in one centralized interface</p>
              </div>

              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="glass-panel p-2 rounded-[20px] shadow-xl border-white/10 overflow-hidden">
                  <Image
                    src="/screen-shots/torrent-downloading.png"
                    alt="Sky Movie active torrent downloads with real-time transfer speeds and progress bars"
                    width={800}
                    height={450}
                    className="w-full h-auto block rounded-[14px]"
                    loading="lazy"
                  />
                  <p className="text-center text-white/30 text-xs py-2">Real-time progress with pause, resume &amp; delete controls</p>
                </div>
                <div className="glass-panel p-2 rounded-[20px] shadow-xl border-white/10 overflow-hidden">
                  <Image
                    src="/screen-shots/torrent-settings.png"
                    alt="Sky Movie torrent settings configuration panel for speeds and protocols"
                    width={800}
                    height={450}
                    className="w-full h-auto block rounded-[14px]"
                    loading="lazy"
                  />
                  <p className="text-center text-white/30 text-xs py-2">Download speed limits, queue depth, and protocol toggles</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Local-First Architecture Section */}
        <section className="py-24 px-container-padding max-w-7xl mx-auto" id="architecture">
          <div className="text-center mb-16">
            <span className="text-primary text-xs uppercase tracking-widest font-semibold bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
              Privacy &amp; Performance
            </span>
            <h2 className="font-headline-md text-3xl md:text-5xl mt-4 mb-4">
              Local-First Architecture: Zero Servers, 100% Privacy
            </h2>
            <p className="text-secondary font-body-lg max-w-2xl mx-auto text-base md:text-lg">
              Unlike cloud streaming platforms that require user logins and collect viewing telemetry, Sky Movie is built around your PC.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-8 rounded-3xl border-white/5">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-2xl">database</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Local SQLite Database</h3>
              <p className="text-secondary text-sm leading-relaxed">
                All metadata, playlists, settings, and watch history are saved to a clean SQLite database on your local drive. Queries execute in microseconds with zero network lag.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-3xl border-white/5">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-2xl">lock</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Zero Accounts &amp; Telemetry</h3>
              <p className="text-secondary text-sm leading-relaxed">
                No user accounts, no passwords, no email verification, and no usage tracking. What you watch, download, or collect remains strictly between you and your hard drive.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-3xl border-white/5">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-2xl">wifi_off</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">100% Offline Capability</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Take your laptop on flights, trains, or off-grid vacations. Your entire catalog, artwork cache, and media player remain fully functional without an internet connection.
              </p>
            </div>
          </div>
        </section>

        {/* Step-by-Step Guides Section */}
        <section className="py-24 px-container-padding max-w-7xl mx-auto" id="guides">
          <div className="text-center mb-16">
            <span className="text-primary text-xs uppercase tracking-widest font-semibold bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
              Tutorials &amp; Deep Dives
            </span>
            <h2 className="font-headline-md text-3xl md:text-5xl mt-4 mb-4">
              Explore Our Comprehensive Guides
            </h2>
            <p className="text-secondary font-body-lg max-w-2xl mx-auto text-base md:text-lg">
              Practical advice, installation instructions, and technical comparisons written for home cinema enthusiasts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/guides/organize-personal-movie-collection"
              className="glass-panel p-8 rounded-3xl border-white/5 hover:border-primary/40 hover:bg-white/5 transition-all group flex flex-col justify-between"
            >
              <div>
                <span className="material-symbols-outlined text-primary text-3xl mb-4 block group-hover:scale-110 transition-transform">
                  folder_special
                </span>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-primary transition-colors">
                  How to Organize a Movie Collection on PC
                </h3>
                <p className="text-secondary text-sm leading-relaxed mb-6">
                  Learn optimal folder hierarchies, naming conventions for 99%+ TMDB match rates, and TV season organization.
                </p>
              </div>
              <span className="text-primary text-sm font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Read Guide &rarr;
              </span>
            </Link>

            <Link
              href="/guides/sky-movie-vs-media-managers"
              className="glass-panel p-8 rounded-3xl border-white/5 hover:border-primary/40 hover:bg-white/5 transition-all group flex flex-col justify-between"
            >
              <div>
                <span className="material-symbols-outlined text-primary text-3xl mb-4 block group-hover:scale-110 transition-transform">
                  compare_arrows
                </span>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-primary transition-colors">
                  Sky Movie vs Plex, Jellyfin, Kodi &amp; VLC
                </h3>
                <p className="text-secondary text-sm leading-relaxed mb-6">
                  An objective, factual comparison between local-first desktop apps, client-server streamers, and media players.
                </p>
              </div>
              <span className="text-primary text-sm font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Read Comparison &rarr;
              </span>
            </Link>

            <Link
              href="/guides/install-sky-movie-on-linux"
              className="glass-panel p-8 rounded-3xl border-white/5 hover:border-primary/40 hover:bg-white/5 transition-all group flex flex-col justify-between"
            >
              <div>
                <span className="material-symbols-outlined text-primary text-3xl mb-4 block group-hover:scale-110 transition-transform">
                  terminal
                </span>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-primary transition-colors">
                  How to Install Sky Movie on Linux
                </h3>
                <p className="text-secondary text-sm leading-relaxed mb-6">
                  Step-by-step instructions for Ubuntu, Debian, Fedora, and Arch using AppImage and DEB packages with hardware acceleration.
                </p>
              </div>
              <span className="text-primary text-sm font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Read Linux Setup &rarr;
              </span>
            </Link>
          </div>
        </section>

        {/* Supported Platforms Section */}
        <section className="py-20 px-container-padding max-w-5xl mx-auto" id="platforms">
          <div className="text-center mb-12">
            <h2 className="font-headline-md text-3xl md:text-4xl mb-4">Supported Operating Systems</h2>
            <p className="text-secondary font-body-lg max-w-xl mx-auto">
              Sky Movie is packaged and built natively for all major desktop platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  Windows 10 &amp; Windows 11 (64-bit)
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                  x64 architecture
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                  Available as <code className="text-primary font-mono text-xs">.exe</code> installer &amp; portable <code className="text-primary font-mono text-xs">.zip</code>
                </li>
              </ul>
            </div>

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
                  Apple Silicon (M1/M2/M3/M4) native ARM64
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                  Intel x64 binary available as <code className="text-primary font-mono text-xs">.dmg</code>
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
                  Ubuntu, Debian, Fedora, Arch Linux
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                  x64 and ARM64 support
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                  Available as <code className="text-primary font-mono text-xs">.AppImage</code> &amp; <code className="text-primary font-mono text-xs">.deb</code>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-5 bg-white/3 border border-white/5 rounded-2xl flex items-start gap-4">
            <span className="material-symbols-outlined text-primary text-xl flex-shrink-0 mt-0.5">info</span>
            <p className="text-secondary text-sm leading-relaxed">
              Minimum hardware recommendation: <strong className="text-white">4 GB RAM</strong> and <strong className="text-white">200 MB</strong> free storage. Integrated or discrete GPU acceleration recommended for smooth 4K HDR10+ playback.
            </p>
          </div>
        </section>

        {/* Frequently Asked Questions Section */}
        <section className="py-24 px-container-padding max-w-4xl mx-auto" id="faq">
          <div className="text-center mb-16">
            <span className="text-primary text-xs uppercase tracking-widest font-semibold bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
              Got Questions?
            </span>
            <h2 className="font-headline-md text-3xl md:text-5xl mt-4 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-secondary font-body-lg text-base md:text-lg">
              Everything you need to know about Sky Movie, media playback, and offline management.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <details
                key={index}
                className="glass-panel p-6 rounded-2xl border-white/5 group hover:border-white/10 transition-colors [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none text-white font-semibold text-lg gap-4">
                  <span>{faq.question}</span>
                  <span className="material-symbols-outlined text-primary text-xl group-open:rotate-180 transition-transform flex-shrink-0">
                    expand_more
                  </span>
                </summary>
                <div className="mt-4 pt-4 border-t border-white/5 text-secondary text-sm leading-relaxed">
                  <p>{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Downloads Section */}
        <section className="py-24 bg-surface-container-low px-container-padding relative overflow-hidden" id="downloads">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-primary text-xs uppercase tracking-widest font-semibold bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                Get Started
              </span>
              <h2 className="font-headline-md text-3xl md:text-5xl text-white mt-4 mb-4">
                Download Sky Movie for Your Desktop
              </h2>
              <p className="text-secondary font-body-lg max-w-xl mx-auto">
                Download the latest stable release for Windows, macOS, or Linux. Free, open source, and ready to scan your library.
              </p>
              {isBetaVersion(latestRelease?.version || "") && (
                <div className="mt-6 max-w-2xl mx-auto p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                  <p className="text-orange-400 text-sm">
                    <strong>⚠️ Software Notice:</strong> On Windows, you may see a SmartScreen prompt because early releases are not code-signed. Click &quot;More info&quot; &rarr; &quot;Run anyway&quot;. The software is 100% open source under the MIT license.
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
                    <h3 className="font-headline-sm text-lg flex items-center gap-2">
                      Version {latestRelease?.version}
                      {isBetaVersion(latestRelease?.version || "") ? (
                        <span className="bg-orange-500/10 text-orange-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-orange-500/20">Release</span>
                      ) : (
                        <span className="bg-primary/10 text-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-primary/20">Latest</span>
                      )}
                    </h3>
                    <p className="text-secondary text-sm">
                      Released {formatReleaseDate(latestRelease?.releasedAt)} &bull; Windows, macOS, Linux
                    </p>
                  </div>
                </div>
                <SmartDownload artifacts={latestRelease?.artifacts ?? []} />
              </div>

              {secondRelease && (
                <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 opacity-75 hover:opacity-100 transition-all border-white/5">
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
                    <Link href="/whats-new" className="px-4 py-2 bg-white/5 rounded-lg text-secondary text-sm hover:text-white transition-colors">
                      View Changes
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-sm">
              <Link href="/whats-new" className="text-primary font-label-md flex items-center gap-1 group">
                Browse release changelogs
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
              <span className="text-white/20">&bull;</span>
              <a
                href="https://github.com/hisham-pp/sky-movie/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary hover:text-white transition-colors flex items-center gap-1"
              >
                GitHub Releases Page
                <span className="material-symbols-outlined text-xs">open_in_new</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-white/5 pt-20 pb-10 px-container-padding">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1">
            <span className="font-display-lg text-headline-sm text-primary tracking-tight block mb-4">Sky Movie</span>
            <p className="text-secondary text-sm leading-relaxed mb-4">
              The free, local-first desktop movie and TV show library manager. Built for cinephiles with native libmpv hardware playback and SQLite storage.
            </p>
            <span className="text-xs text-white/40 block">
              Released under the MIT License
            </span>
          </div>

          <div>
            <h4 className="text-white font-label-md mb-6 uppercase tracking-widest text-[11px]">Product</h4>
            <ul className="space-y-3.5 text-sm text-secondary">
              <li><a className="hover:text-primary transition-colors" href="#features">Features</a></li>
              <li><a className="hover:text-primary transition-colors" href="#player">Native Player</a></li>
              <li><a className="hover:text-primary transition-colors" href="#ytdl">YouTube Downloader</a></li>
              <li><a className="hover:text-primary transition-colors" href="#torrent">Torrents</a></li>
              <li><a className="hover:text-primary transition-colors" href="#downloads">Downloads</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-label-md mb-6 uppercase tracking-widest text-[11px]">Guides &amp; Docs</h4>
            <ul className="space-y-3.5 text-sm text-secondary">
              <li><Link className="hover:text-primary transition-colors" href="/docs">Documentation</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/guides/organize-personal-movie-collection">Organize Movie Library</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/guides/sky-movie-vs-media-managers">Sky Movie vs Plex/Kodi</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/guides/install-sky-movie-on-linux">Linux Installation Guide</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/whats-new">Release Changelog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-label-md mb-6 uppercase tracking-widest text-[11px]">Open Source</h4>
            <ul className="space-y-3.5 text-sm text-secondary">
              <li>
                <a className="hover:text-primary transition-colors flex items-center gap-1.5" href={repoUrl} target="_blank" rel="noopener noreferrer">
                  GitHub Repository
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="https://github.com/hisham-pp/sky-movie/releases" target="_blank" rel="noopener noreferrer">
                  Releases &amp; Binaries
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="https://github.com/hisham-pp/sky-movie/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">
                  MIT License
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="https://github.com/hisham-pp/sky-movie/issues" target="_blank" rel="noopener noreferrer">
                  Report an Issue
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-white/5">
          <p className="text-secondary text-xs">
            &copy; 2026 Sky Movie Project. Free and open source under the MIT License.
          </p>
          <div className="flex items-center gap-4">
            <a className="text-secondary hover:text-white transition-colors" href={repoUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path></svg>
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
