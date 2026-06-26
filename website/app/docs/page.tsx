'use client';

import Link from "next/link";
import { useState, useEffect } from "react";

const repoUrl = "https://github.com/hisham-pp/sky-movie";

const skinClassCode = `import './YourSkin.css';
import { PlayerSkin } from '../PlayerSkin';
import type { PlayerKeyMap, SkinControlsProps } from '../PlayerSkin';

export class YourSkin extends PlayerSkin {
  readonly id = 'your-skin' as const;
  readonly name = 'Your Skin';
  readonly description = 'A short description shown in settings.';

  // Optional: override max volume (default 100)
  readonly volumeMax = 100;

  // Optional: allow audio boost above 100 (set 0 to disable)
  readonly volumeBoostMax = 0;

  readonly keyMap: PlayerKeyMap = {
    togglePlay:              [' ', 'k'],
    seekBack:                ['ArrowLeft'],
    seekForward:             ['ArrowRight'],
    seekBackLarge:           ['j'],
    seekForwardLarge:        ['l'],
    volumeUp:                ['ArrowUp'],
    volumeDown:              ['ArrowDown'],
    toggleMute:              ['m'],
    toggleFullscreen:        ['f', 'F'],
    seekBackSeconds:         5,
    seekForwardSeconds:      5,
    seekBackLargeSeconds:    10,
    seekForwardLargeSeconds: 10,
  };

  renderControls(props: SkinControlsProps) {
    return <YourControls props={props} skin={this} />;
  }
}

function YourControls({ props, skin }: { props: SkinControlsProps; skin: YourSkin }) {
  const { state, isVisible, onTogglePlay, onToggleFullscreen } = props;

  return (
    <div className={\`your-controls\${isVisible ? ' visible' : ''}\`}>
      {/* Build your UI here */}
      <button onClick={onTogglePlay}>
        {state.playing ? 'Pause' : 'Play'}
      </button>
      <button onClick={onToggleFullscreen}>Fullscreen</button>
    </div>
  );
}`;

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<"movies" | "shows">("movies");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("introduction");

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Global Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-surface/40 flex justify-between items-center px-8 lg:px-16 h-20 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-display-lg text-2xl text-primary tracking-tight hover:opacity-80 transition-opacity">
            Sky Movie
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-secondary text-sm font-medium">Documentation</span>
        </div>
        <Link 
          href="/" 
          className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-primary font-label-md transition-all flex items-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Home
        </Link>
      </header>

      {/* Main Layout */}
      <div className="min-h-screen bg-[#0F1115] text-[#e2e2e8] pt-28 pb-20 px-8 lg:px-16 max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
        
        {/* Sticky Sidebar Navigation */}
        <aside className="lg:w-64 flex-shrink-0 lg:sticky lg:top-28 h-fit space-y-2">
          <div className="px-3 mb-4 text-xs font-semibold text-white/40 uppercase tracking-wider">
            Table of Contents
          </div>
          <nav className="space-y-1">
            {[
              { id: "introduction", icon: "info", label: "Introduction" },
              { id: "getting-started", icon: "play_circle", label: "Getting Started" },
              { id: "naming-conventions", icon: "edit_note", label: "Naming Conventions" },
              { id: "folder-structures", icon: "folder_open", label: "Folder Structures" },
              { id: "matching-strategies", icon: "settings_suggest", label: "Matching Strategies" },
              { id: "metadata-tmdb", icon: "auto_awesome", label: "Metadata & TMDB" },
              { id: "playlists", icon: "playlist_play", label: "Playlists" },
              { id: "settings-reference", icon: "tune", label: "Settings Reference" },
              { id: "troubleshooting", icon: "help_outline", label: "Troubleshooting" },
              { id: "player-skins", icon: "palette", label: "Custom Player Skins" },
            ].map(({ id, icon, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all font-medium text-sm ${
                  activeSection === id
                    ? "text-primary bg-primary/10 border border-primary/20"
                    : "text-secondary hover:text-primary hover:bg-white/5"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{icon}</span>
                {label}
              </a>
            ))}
          </nav>

          <hr className="border-white/5 my-6" />

          <div className="px-3">
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-primary font-medium text-sm transition-all"
            >
              <span className="material-symbols-outlined text-lg">code</span>
              View GitHub Repo
            </a>
          </div>
        </aside>

        {/* Documentation Content Area */}
        <main className="flex-1 max-w-4xl space-y-16">
          
          {/* Title & Introduction Section */}
          <section id="introduction" className="scroll-mt-28 space-y-6">
            <div className="p-1.5 px-4 bg-primary/10 border border-primary/20 rounded-full inline-flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              Library Guide
            </div>
            <h1 className="font-display-lg text-4xl lg:text-5xl leading-tight tracking-tight text-white font-bold">
              Organizing Your <span className="gradient-text">Sky Movie Library</span>
            </h1>
            <p className="text-secondary text-base lg:text-lg leading-relaxed">
              Sky Movie features an advanced, multi-threaded parser that runs in your local environment. It extracts titles, years, season numbers, and episode tags from your file structures to find matches on TMDB automatically.
            </p>
            <p className="text-secondary text-base leading-relaxed">
              This guide details the recommended formats to ensure 100% automatic match rates on the first scan, preventing the need for manual linking or duplicates.
            </p>

            {/* App Preview Screenshot */}
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <img
                src="/screen-shots/movies-list.png"
                alt="Sky Movie library view showing movies with poster art and metadata"
                className="w-full object-cover"
              />
            </div>
          </section>

          {/* Getting Started Section */}
          <section id="getting-started" className="scroll-mt-28 space-y-8">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-2xl lg:text-3xl text-white font-bold tracking-tight mb-2">Getting Started</h2>
              <p className="text-secondary text-sm">Set up your library in three steps: add folders, scan, and let Sky Movie do the rest.</p>
            </div>

            <div className="space-y-6">
              <div className="flex gap-5">
                <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 mt-1">1</div>
                <div>
                  <h4 className="text-white font-bold mb-1">Add Your Library Folders</h4>
                  <p className="text-secondary text-sm leading-relaxed">Go to <strong className="text-white">Settings → Library</strong> and click <em>Add Folder</em>. Point Sky Movie at the root directories where your movies or TV shows are stored. You can add as many folders as you need — each folder is scanned independently.</p>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 mt-1">2</div>
                <div>
                  <h4 className="text-white font-bold mb-1">Configure Metadata (Optional but Recommended)</h4>
                  <p className="text-secondary text-sm leading-relaxed">Go to <strong className="text-white">Settings → Metadata</strong> and add your TMDB API key. Without it, scanning still works but no artwork or cast information will be fetched. See the <a href="#metadata-tmdb" className="text-primary hover:underline">Metadata & TMDB</a> section for how to get a free key.</p>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 mt-1">3</div>
                <div>
                  <h4 className="text-white font-bold mb-1">Run a Library Scan</h4>
                  <p className="text-secondary text-sm leading-relaxed">Open the <strong className="text-white">Library Scan</strong> screen from the sidebar. Click <em>Scan All</em> to process all configured folders at once, or scan individual folders separately. Progress is shown in real time in the <em>Last Scan</em> panel.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
              <img
                src="/screen-shots/scan.png"
                alt="Sky Movie library scan screen showing configured folders and scan controls"
                className="w-full object-cover"
              />
            </div>
          </section>

          {/* Naming Conventions Tabbed Widget */}
          <section id="naming-conventions" className="scroll-mt-28 space-y-8">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-2xl lg:text-3xl text-white font-bold tracking-tight mb-2">Naming Conventions</h2>
              <p className="text-secondary text-sm">Select a tab below to see details for different content kinds.</p>
            </div>

            {/* Interactive Tab Switcher */}
            <div className="flex gap-2 p-1 bg-surface-container-lowest/80 border border-white/5 rounded-2xl w-fit">
              <button 
                id="tab-btn-movies"
                onClick={() => setActiveTab("movies")}
                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                  activeTab === "movies" 
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/10" 
                    : "text-secondary hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-lg">movie</span>
                Movies
              </button>
              <button 
                id="tab-btn-shows"
                onClick={() => setActiveTab("shows")}
                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                  activeTab === "shows" 
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/10" 
                    : "text-secondary hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-lg">tv</span>
                TV Shows & Series
              </button>
            </div>

            {/* Movies Content */}
            {activeTab === "movies" && (
              <div className="space-y-6 animate-fadeIn">
                <p className="text-secondary leading-relaxed">
                  For movies, include the <strong>Release Year</strong> in parentheses or brackets at the end of the filename. This ensures the matching scanner distinguishes re-makes and disambiguates the correct title from TMDB.
                </p>

                {/* Example box with copy button */}
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center text-xs font-semibold text-white/40 uppercase">
                    <span>Recommended Format</span>
                    <button 
                      onClick={() => handleCopy("Movie Title (Year).ext", "movie-format")}
                      className="text-primary hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      {copiedText === "movie-format" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <code className="block text-primary text-lg font-mono tracking-tight bg-black/30 p-4 rounded-xl border border-white/5">
                    Movie Title (Year).ext
                  </code>
                </div>

                {/* Comparative Table */}
                <div className="overflow-x-auto rounded-2xl border border-white/5">
                  <table className="w-full text-left border-collapse bg-surface/20">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="p-4 text-xs font-semibold text-white/60 uppercase">File Name on Disk</th>
                        <th className="p-4 text-xs font-semibold text-white/60 uppercase">Cleaned Title</th>
                        <th className="p-4 text-xs font-semibold text-white/60 uppercase">Parsed Year</th>
                        <th className="p-4 text-xs font-semibold text-white/60 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      <tr>
                        <td className="p-4 font-mono text-white/80">Inception (2010).mkv</td>
                        <td className="p-4 font-semibold text-primary">Inception</td>
                        <td className="p-4 text-secondary">2010</td>
                        <td className="p-4 text-emerald-400">Excellent Match</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-mono text-white/80">The.Matrix.1999.1080p.BluRay.mp4</td>
                        <td className="p-4 font-semibold text-primary">The Matrix</td>
                        <td className="p-4 text-secondary">1999</td>
                        <td className="p-4 text-emerald-400">Excellent Match</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-mono text-white/80">01 - Gladiator (2000).mp4</td>
                        <td className="p-4 font-semibold text-primary">Gladiator</td>
                        <td className="p-4 text-secondary">2000</td>
                        <td className="p-4 text-emerald-400">Track Number Stripped</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-mono text-white/80">Avatar.mp4</td>
                        <td className="p-4 font-semibold text-primary">Avatar</td>
                        <td className="p-4 text-white/40">None</td>
                        <td className="p-4 text-orange-400">Unmatched (Needs Review)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-4 p-4 bg-primary/5 border border-primary/20 rounded-2xl text-sm leading-relaxed text-secondary">
                  <span className="material-symbols-outlined text-primary flex-shrink-0">lightbulb</span>
                  <p>
                    <strong>Prefix Stripping:</strong> File names starting with numbers (e.g., track indexes or download lists like <code className="bg-white/5 px-1 rounded text-white font-mono">01 - </code>, <code className="bg-white/5 px-1 rounded text-white font-mono">02. </code>, or <code className="bg-white/5 px-1 rounded text-white font-mono">[12] </code>) are automatically parsed and cleaned. The scanner matches the pure title.
                  </p>
                </div>
              </div>
            )}

            {/* TV Shows Content */}
            {activeTab === "shows" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="rounded-2xl overflow-hidden border border-white/10">
                  <img src="/screen-shots/tv-show-list-selected.png" alt="Sky Movie TV show library view" className="w-full object-cover" />
                </div>
                <p className="text-secondary leading-relaxed">
                  For series, the scanner looks for a <strong>Season and Episode Pattern</strong> (like `S01E01` or `s02e05`) in the filename. The show title is extracted from the prefix preceding this pattern.
                </p>

                {/* Example box with copy button */}
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center text-xs font-semibold text-white/40 uppercase">
                    <span>Recommended Format</span>
                    <button 
                      onClick={() => handleCopy("Show Title - SXXEXX - Episode Name.ext", "show-format")}
                      className="text-primary hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      {copiedText === "show-format" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <code className="block text-primary text-lg font-mono tracking-tight bg-black/30 p-4 rounded-xl border border-white/5">
                    Show Title - SXXEXX - Episode Name.ext
                  </code>
                </div>

                {/* Comparative Table */}
                <div className="overflow-x-auto rounded-2xl border border-white/5">
                  <table className="w-full text-left border-collapse bg-surface/20">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="p-4 text-xs font-semibold text-white/60 uppercase">File Name on Disk</th>
                        <th className="p-4 text-xs font-semibold text-white/60 uppercase">Parsed Show Title</th>
                        <th className="p-4 text-xs font-semibold text-white/60 uppercase">Season / Episode</th>
                        <th className="p-4 text-xs font-semibold text-white/60 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      <tr>
                        <td className="p-4 font-mono text-white/80">Breaking Bad - S01E01 - Pilot.mkv</td>
                        <td className="p-4 font-semibold text-primary">Breaking Bad</td>
                        <td className="p-4 text-secondary">Season 1, Episode 1</td>
                        <td className="p-4 text-emerald-400">Excellent Match</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-mono text-white/80">Stranger_Things_s02e05_1080p.mp4</td>
                        <td className="p-4 font-semibold text-primary">Stranger Things</td>
                        <td className="p-4 text-secondary">Season 2, Episode 5</td>
                        <td className="p-4 text-emerald-400">Excellent Match</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-mono text-white/80">01 - The.Office.S03E12.mkv</td>
                        <td className="p-4 font-semibold text-primary">The Office</td>
                        <td className="p-4 text-secondary">Season 3, Episode 12</td>
                        <td className="p-4 text-emerald-400">Track Number Stripped</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-mono text-white/80">The.Mandalorian.Pilot.mp4</td>
                        <td className="p-4 font-semibold text-primary">The Mandalorian</td>
                        <td className="p-4 text-white/40">S1 E1 (Fallback)</td>
                        <td className="p-4 text-orange-400">Missing SXXEXX pattern</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Folder Structures Section */}
          <section id="folder-structures" className="scroll-mt-28 space-y-8">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-2xl lg:text-3xl text-white font-bold tracking-tight mb-2">Folder Structures</h2>
              <p className="text-secondary text-sm">We recommend segregating your movies and shows into separate folders.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Movies Folder Panel */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">movie</span>
                  Movies Folder
                </h3>
                <div className="bg-black/35 p-4 rounded-xl font-mono text-xs text-white/70 space-y-1 overflow-x-auto leading-relaxed border border-white/5">
                  <div>📁 Movies/</div>
                  <div>├── 📁 Inception (2010)/</div>
                  <div className="text-primary">│   └── 🎥 Inception (2010).mp4</div>
                  <div>└── 📁 The Matrix (1999)/</div>
                  <div className="text-primary">    └── 🎥 The Matrix (1999).mkv</div>
                </div>
                <p className="text-secondary text-xs">
                  Keeping each movie in its own subfolder allows the application to cache metadata posters and external subtitles in the same directory.
                </p>
              </div>

              {/* TV Shows Folder Panel */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">tv</span>
                  TV Shows Folder
                </h3>
                <div className="bg-black/35 p-4 rounded-xl font-mono text-xs text-white/70 space-y-1 overflow-x-auto leading-relaxed border border-white/5">
                  <div>📁 TV Shows/</div>
                  <div>└── 📁 Breaking Bad/</div>
                  <div>    ├── 📁 Season 01/</div>
                  <div className="text-primary">    │   ├── 🎥 Breaking Bad - S01E01.mkv</div>
                  <div className="text-primary">    │   └── 🎥 Breaking Bad - S01E02.mkv</div>
                  <div>    └── 📁 Season 02/</div>
                  <div className="text-primary">        └── 🎥 Breaking Bad - S02E01.mp4</div>
                </div>
                <p className="text-secondary text-xs">
                  Season directories (e.g., `Season 01`) group episodes cleanly and speed up recursive catalog scans.
                </p>
              </div>
            </div>
          </section>

          {/* Matching Strategies Section */}
          <section id="matching-strategies" className="scroll-mt-28 space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-2xl lg:text-3xl text-white font-bold tracking-tight mb-2">Matching Strategies</h2>
              <p className="text-secondary text-sm">Customize how the scanner behaves in your Library Settings panel.</p>
            </div>

            <div className="space-y-4">
              <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl">hdr_auto</span>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-white">Auto Match (Recommended)</h4>
                  <p className="text-secondary text-sm leading-relaxed">
                    Evaluates both file names and directory trees to match shows or movies. Uses a confidence score mapping system to minimize lookup misses.
                  </p>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl">folder</span>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-white">Folder Name Strategy</h4>
                  <p className="text-secondary text-sm leading-relaxed">
                    Extracts metadata using the immediate parent folder name rather than the file name. Best if your movie files have encoded scene names (e.g., <code className="text-xs bg-white/5 px-1 rounded font-mono">matrix_webdl_1080p.mkv</code>) but sit in clean folders.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Metadata & TMDB Section */}
          <section id="metadata-tmdb" className="scroll-mt-28 space-y-8">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-2xl lg:text-3xl text-white font-bold tracking-tight mb-2">Metadata & TMDB</h2>
              <p className="text-secondary text-sm">Sky Movie fetches rich metadata from The Movie Database (TMDB) — posters, backdrops, overviews, genres, cast, and crew.</p>
            </div>

            {/* Screenshot */}
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
              <img
                src="/screen-shots/settings-metadata.png"
                alt="Sky Movie Settings — Metadata tab showing TMDB API key and language fields"
                className="w-full object-cover"
              />
            </div>

            {/* Getting the API key */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Getting a Free TMDB API Key</h3>
              <div className="space-y-3 text-sm text-secondary leading-relaxed">
                <p>TMDB offers free API access for personal projects. Follow these steps:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Create a free account at <span className="text-primary font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">themoviedb.org</span></li>
                  <li>Go to <strong className="text-white">Account Settings → API</strong> and request a new key (choose "Developer" for personal use)</li>
                  <li>Copy the <strong className="text-white">API Key (v3 auth)</strong> — not the Bearer token</li>
                  <li>Paste it into <strong className="text-white">Sky Movie → Settings → Metadata → TMDB API Key</strong></li>
                </ol>
              </div>
            </div>

            {/* What gets fetched */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">What Gets Fetched</h3>
              <p className="text-secondary text-sm leading-relaxed">When Sky Movie applies metadata for a title, it makes two requests to TMDB — a search to find the best match, then a detail fetch to retrieve full information. The following fields are stored locally and shown in the app:</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: "title", label: "Title & Original Title", desc: "Localized title plus the original language title." },
                  { icon: "calendar_month", label: "Release / First Air Year", desc: "Used for disambiguation when multiple titles share a name." },
                  { icon: "description", label: "Overview", desc: "Full plot synopsis from TMDB." },
                  { icon: "image", label: "Poster & Backdrop", desc: "Downloaded and cached locally — no internet needed to display them later." },
                  { icon: "schedule", label: "Runtime", desc: "Movie length in minutes (movies only)." },
                  { icon: "star", label: "Rating", desc: "TMDB community vote average, rounded to one decimal." },
                  { icon: "label", label: "Genres", desc: "All genre tags (Action, Drama, etc.) linked in the local database." },
                  { icon: "people", label: "Cast (top 12)", desc: "Actor names, character names, and profile photos." },
                  { icon: "movie_creation", label: "Crew (top 8)", desc: "Director, Writer, Screenplay, and Creator credits." },
                ].map(({ icon, label, desc }) => (
                  <div key={label} className="glass-panel p-4 rounded-2xl flex gap-4">
                    <span className="material-symbols-outlined text-primary flex-shrink-0 mt-0.5">{icon}</span>
                    <div>
                      <p className="text-white font-semibold text-sm">{label}</p>
                      <p className="text-secondary text-xs mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="glass-panel p-6 rounded-2xl flex gap-4">
              <span className="material-symbols-outlined text-primary flex-shrink-0">translate</span>
              <div className="space-y-1">
                <h4 className="font-bold text-white">Language Setting</h4>
                <p className="text-secondary text-sm leading-relaxed">
                  The <strong className="text-white">TMDB Language</strong> field (default <code className="bg-white/5 px-1 rounded font-mono text-xs">en-US</code>) controls the locale for titles, overviews, and image selections. Use BCP 47 codes such as <code className="bg-white/5 px-1 rounded font-mono text-xs">fr-FR</code>, <code className="bg-white/5 px-1 rounded font-mono text-xs">ja-JP</code>, or <code className="bg-white/5 px-1 rounded font-mono text-xs">ar-SA</code> to get results in your preferred language.
                </p>
              </div>
            </div>

            {/* Image caching */}
            <div className="glass-panel p-6 rounded-2xl flex gap-4">
              <span className="material-symbols-outlined text-primary flex-shrink-0">save</span>
              <div className="space-y-1">
                <h4 className="font-bold text-white">Local Image Cache</h4>
                <p className="text-secondary text-sm leading-relaxed">
                  Posters and backdrops are downloaded once and stored in Sky Movie's app data folder. After the initial fetch, the app displays images entirely offline. Cached files are managed automatically and can be cleared via <strong className="text-white">Settings → Local Data</strong>.
                </p>
              </div>
            </div>

            {/* Movie detail screenshot */}
            <div className="space-y-3">
              <p className="text-secondary text-sm">The movie detail view shows all fetched metadata — overview, genres, cast row, and a sidebar for re-linking to a different TMDB entry.</p>
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                <img
                  src="/screen-shots/movie-view.png"
                  alt="Sky Movie movie detail page showing poster, metadata, and cast"
                  className="w-full object-cover"
                />
              </div>
            </div>
          </section>

          {/* Playlists Section */}
          <section id="playlists" className="scroll-mt-28 space-y-8">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-2xl lg:text-3xl text-white font-bold tracking-tight mb-2">Playlists</h2>
              <p className="text-secondary text-sm">Group movies and TV shows into custom playlists for themed sessions or watch queues.</p>
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
              <img
                src="/screen-shots/playlist-view.png"
                alt="Sky Movie playlist view showing a Marvel playlist with movies listed"
                className="w-full object-cover"
              />
            </div>

            <div className="space-y-4">
              {[
                { icon: "add_circle", title: "Creating a Playlist", desc: "Click the Playlist icon in the left sidebar, then choose \"New Playlist\". Give it a name and it will appear in your sidebar immediately." },
                { icon: "playlist_add", title: "Adding Items", desc: "From any movie or TV show detail page, tap \"Add to Playlist\" to open the picker dialog. You can add to multiple playlists at once. Movies and TV shows can be mixed in the same playlist." },
                { icon: "play_arrow", title: "Playing a Playlist", desc: "Open a playlist and click \"Play All\" to start playing from the first item. The built-in player queues up items in order. You can reorder entries by dragging them." },
                { icon: "edit", title: "Editing & Deleting", desc: "Use the Edit button on the playlist page to rename it or remove individual items. Deleting a playlist does not remove the underlying media files from your library." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="glass-panel p-6 rounded-2xl flex gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined text-xl">{icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{title}</h4>
                    <p className="text-secondary text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
              <img
                src="/screen-shots/add-to-play-list.png"
                alt="Add to Playlist dialog showing all movies in the library with a search bar"
                className="w-full object-cover"
              />
            </div>
          </section>

          {/* Settings Reference Section */}
          <section id="settings-reference" className="scroll-mt-28 space-y-8">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-2xl lg:text-3xl text-white font-bold tracking-tight mb-2">Settings Reference</h2>
              <p className="text-secondary text-sm">A full reference of every option available in the Settings panel.</p>
            </div>

            {/* Appearance */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">palette</span>
                Appearance
              </h3>
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                <img src="/screen-shots/settings-theme.png" alt="Settings Appearance tab showing theme options" className="w-full object-cover" />
              </div>
              <div className="overflow-x-auto rounded-2xl border border-white/5">
                <table className="w-full text-left border-collapse bg-surface/20">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="p-4 text-xs font-semibold text-white/60 uppercase">Setting</th>
                      <th className="p-4 text-xs font-semibold text-white/60 uppercase">Options</th>
                      <th className="p-4 text-xs font-semibold text-white/60 uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    <tr>
                      <td className="p-4 font-semibold text-white">Theme</td>
                      <td className="p-4 text-secondary font-mono text-xs">Cinema, Midnight, Starlight, Ember, Ocean, Forest, Sunset, Noir, Lavender, Crimson</td>
                      <td className="p-4 text-secondary">Color scheme applied globally to the app. Default is <em>Cinema</em>.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Library */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">folder_managed</span>
                Library
              </h3>
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                <img src="/screen-shots/settings-library.png" alt="Settings Library tab showing folder list and scan options" className="w-full object-cover" />
              </div>
              <div className="overflow-x-auto rounded-2xl border border-white/5">
                <table className="w-full text-left border-collapse bg-surface/20">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="p-4 text-xs font-semibold text-white/60 uppercase">Setting</th>
                      <th className="p-4 text-xs font-semibold text-white/60 uppercase">Default</th>
                      <th className="p-4 text-xs font-semibold text-white/60 uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    <tr>
                      <td className="p-4 font-semibold text-white">Library Folders</td>
                      <td className="p-4 text-secondary font-mono text-xs">—</td>
                      <td className="p-4 text-secondary">Root directories scanned for media. Add multiple folders for separate movie and TV show roots.</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-white">Scan Mode</td>
                      <td className="p-4 text-secondary font-mono text-xs">mixed</td>
                      <td className="p-4 text-secondary">Controls whether to scan for movies only, TV only, or both in the same folder.</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-white">Folder Strategy</td>
                      <td className="p-4 text-secondary font-mono text-xs">auto</td>
                      <td className="p-4 text-secondary"><em>Auto</em> uses both file name and parent folder to determine the best match. <em>Folder Name</em> ignores the file name and matches purely on the parent directory name.</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-white">Auto Scan on Launch</td>
                      <td className="p-4 text-secondary font-mono text-xs">Off</td>
                      <td className="p-4 text-secondary">When enabled, Sky Movie runs a full scan every time the app starts.</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-white">Watch Folders</td>
                      <td className="p-4 text-secondary font-mono text-xs">Off</td>
                      <td className="p-4 text-secondary">Monitors your library folders for file system changes and auto-adds new titles in the background.</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-white">Extract File Metadata</td>
                      <td className="p-4 text-secondary font-mono text-xs">On</td>
                      <td className="p-4 text-secondary">Reads codec, resolution, HDR format, and audio track information from media files during the scan.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                Metadata
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-white/5">
                <table className="w-full text-left border-collapse bg-surface/20">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="p-4 text-xs font-semibold text-white/60 uppercase">Setting</th>
                      <th className="p-4 text-xs font-semibold text-white/60 uppercase">Default</th>
                      <th className="p-4 text-xs font-semibold text-white/60 uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    <tr>
                      <td className="p-4 font-semibold text-white">Metadata Provider</td>
                      <td className="p-4 text-secondary font-mono text-xs">local</td>
                      <td className="p-4 text-secondary">Set to <em>tmdb</em> to enable online metadata fetching. <em>local</em> keeps everything offline.</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-white">TMDB API Key</td>
                      <td className="p-4 text-secondary font-mono text-xs">—</td>
                      <td className="p-4 text-secondary">Your personal v3 API key from themoviedb.org. Required for any TMDB lookup.</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-white">TMDB Language</td>
                      <td className="p-4 text-secondary font-mono text-xs">en-US</td>
                      <td className="p-4 text-secondary">BCP 47 locale code that controls the language of returned titles, overviews, and images.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Backups */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">backup</span>
                Backups
              </h3>
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                <img src="/screen-shots/settings-backup.png" alt="Settings Backups tab" className="w-full object-cover" />
              </div>
              <p className="text-secondary text-sm leading-relaxed">
                Use <strong className="text-white">Download Backup File</strong> to export your entire library database — all matched movies, TV shows, playlists, and play history — into a portable file. Use <strong className="text-white">Import Backup File</strong> to restore it on any machine. Backups do not include the local image cache; those are re-downloaded automatically from TMDB on the next scan.
              </p>
            </div>

            {/* Updates */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">system_update</span>
                Updates
              </h3>
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                <img src="/screen-shots/settings-update.png" alt="Settings Updates tab showing current version and auto-download toggle" className="w-full object-cover" />
              </div>
              <div className="overflow-x-auto rounded-2xl border border-white/5">
                <table className="w-full text-left border-collapse bg-surface/20">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="p-4 text-xs font-semibold text-white/60 uppercase">Setting</th>
                      <th className="p-4 text-xs font-semibold text-white/60 uppercase">Default</th>
                      <th className="p-4 text-xs font-semibold text-white/60 uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    <tr>
                      <td className="p-4 font-semibold text-white">Check for Updates</td>
                      <td className="p-4 text-secondary font-mono text-xs">Manual</td>
                      <td className="p-4 text-secondary">Click to query GitHub Releases for a newer version of Sky Movie.</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-white">Auto-Download Updates</td>
                      <td className="p-4 text-secondary font-mono text-xs">Off</td>
                      <td className="p-4 text-secondary">When enabled, new releases are downloaded silently in the background and ready to install on next launch.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Troubleshooting Section */}
          <section id="troubleshooting" className="scroll-mt-28 space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-2xl lg:text-3xl text-white font-bold tracking-tight mb-2">Troubleshooting</h2>
              <p className="text-secondary text-sm">Encountered an issue? Here's how to resolve common matching bugs.</p>
            </div>

            <div className="space-y-4">

              {/* Question 1 */}
              <div className="glass-panel p-6 rounded-2xl space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  My movie matched the wrong TMDB entity or year
                </h4>
                <p className="text-secondary text-sm leading-relaxed">
                  Open the <strong>Unrecognized Drawer</strong> (under the status bar or library section), search for the correct movie, and select it manually. Sky Movie will re-associate the file instantly and delete any empty duplicate movie entries.
                </p>
              </div>

              {/* Question 2 */}
              <div className="glass-panel p-6 rounded-2xl space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  A file in my library says "Unrecognized" and is in the Unrecognized list
                </h4>
                <p className="text-secondary text-sm leading-relaxed">
                  This happens if the filename has no release year or season indicator (confidence below 0.5). You can link it manually using the Search bar in the Unrecognized Drawer.
                </p>
              </div>

              {/* Question 3 */}
              <div className="glass-panel p-6 rounded-2xl space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  No posters or backdrops appear after scanning
                </h4>
                <p className="text-secondary text-sm leading-relaxed">
                  This means no TMDB API key is configured, or the key is invalid. Go to <strong className="text-white">Settings → Metadata</strong>, verify your key, then re-run the scan or manually apply metadata from the movie detail page.
                </p>
              </div>

              {/* Question 4 */}
              <div className="glass-panel p-6 rounded-2xl space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  TV show episodes are all grouped under Season 1
                </h4>
                <p className="text-secondary text-sm leading-relaxed">
                  Your filenames are missing the <code className="text-xs bg-white/5 px-1 rounded font-mono">S01E01</code> pattern. Sky Movie falls back to Season 1 / Episode 1 when no season tag is detected. Rename your files to include the season/episode code and re-scan.
                </p>
              </div>

              {/* Question 5 */}
              <div className="glass-panel p-6 rounded-2xl space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  I want to move my library to a new machine
                </h4>
                <p className="text-secondary text-sm leading-relaxed">
                  Use <strong className="text-white">Settings → Backups → Download Backup File</strong> to export your library database. Install Sky Movie on the new machine, import the backup, then update the library folder paths to match the new location and run a scan to re-verify files.
                </p>
              </div>
            </div>
          </section>

          {/* Player Skins Section */}
          <section id="player-skins" className="scroll-mt-28 space-y-8">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-2xl lg:text-3xl text-white font-bold tracking-tight mb-2">Custom Player Skins</h2>
              <p className="text-secondary text-sm">Sky Movie's player UI is fully skinnable. Each skin is a TypeScript class that defines its own controls, keyboard shortcuts, and volume limits.</p>
            </div>

            {/* Overview */}
            <p className="text-secondary text-sm leading-relaxed">
              Skins live under <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">desktop-app/src/renderer/src/theme/player-skins/</code>.
              Each skin gets its own subfolder, extends the abstract <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">PlayerSkin</code> class, and is registered in
              <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white"> index.ts</code>.
              Once registered, users can select it from <strong className="text-white">Settings → Appearance → Player Style</strong>.
            </p>

            {/* File layout */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white">File Layout</h3>
              <div className="bg-black/35 p-5 rounded-2xl font-mono text-xs text-white/70 space-y-1 overflow-x-auto leading-relaxed border border-white/5">
                <div>📁 theme/player-skins/</div>
                <div>├── 📄 PlayerSkin.ts         <span className="text-white/30">← abstract base class</span></div>
                <div>├── 📄 index.ts              <span className="text-white/30">← skin registry</span></div>
                <div>├── 📁 default/</div>
                <div>│   ├── 📄 DefaultSkin.tsx</div>
                <div className="text-primary">│   └── 📄 DefaultSkin.css</div>
                <div>└── 📁 your-skin/            <span className="text-white/30">← your new skin goes here</span></div>
                <div className="text-primary">    ├── 📄 YourSkin.tsx</div>
                <div className="text-primary">    └── 📄 YourSkin.css</div>
              </div>
            </div>

            {/* Step 1 */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                <span className="w-7 h-7 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">1</span>
                Add the PlayerStyle id to the union type
              </h3>
              <p className="text-secondary text-sm leading-relaxed">
                Open <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">desktop-app/src/shared/ipc.ts</code> and extend the union:
              </p>
              <div className="bg-black/35 rounded-2xl overflow-hidden border border-white/5">
                <div className="px-4 py-2 bg-white/5 border-b border-white/5 text-xs text-white/40 font-mono">src/shared/ipc.ts</div>
                <pre className="p-5 text-xs font-mono text-white/80 overflow-x-auto leading-relaxed">{`// Before
export type PlayerStyle = 'default';

// After
export type PlayerStyle = 'default' | 'your-skin';`}</pre>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                <span className="w-7 h-7 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">2</span>
                Create the skin class
              </h3>
              <p className="text-secondary text-sm leading-relaxed">
                Create <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">theme/player-skins/your-skin/YourSkin.tsx</code> and extend <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">PlayerSkin</code>:
              </p>
              <div className="bg-black/35 rounded-2xl overflow-hidden border border-white/5">
                <div className="px-4 py-2 bg-white/5 border-b border-white/5 text-xs text-white/40 font-mono">your-skin/YourSkin.tsx</div>
                <pre className="p-5 text-xs font-mono text-white/80 overflow-x-auto leading-relaxed">{skinClassCode}</pre>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                <span className="w-7 h-7 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">3</span>
                Register the skin
              </h3>
              <p className="text-secondary text-sm leading-relaxed">
                Open <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">theme/player-skins/index.ts</code> and add one import + one entry:
              </p>
              <div className="bg-black/35 rounded-2xl overflow-hidden border border-white/5">
                <div className="px-4 py-2 bg-white/5 border-b border-white/5 text-xs text-white/40 font-mono">theme/player-skins/index.ts</div>
                <pre className="p-5 text-xs font-mono text-white/80 overflow-x-auto leading-relaxed">{`import { DefaultSkin } from './default/DefaultSkin';
import { YourSkin } from './your-skin/YourSkin'; // add this

const registry: Record<PlayerStyle, PlayerSkin> = {
  default:    new DefaultSkin(),
  'your-skin': new YourSkin(),               // add this
};`}</pre>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                <span className="w-7 h-7 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">4</span>
                Add the skin to the Settings panel
              </h3>
              <p className="text-secondary text-sm leading-relaxed">
                In <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">components/SettingsPanel.tsx</code>, add your skin to the <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">playerStylePresets</code> array so users can select it:
              </p>
              <div className="bg-black/35 rounded-2xl overflow-hidden border border-white/5">
                <div className="px-4 py-2 bg-white/5 border-b border-white/5 text-xs text-white/40 font-mono">components/SettingsPanel.tsx</div>
                <pre className="p-5 text-xs font-mono text-white/80 overflow-x-auto leading-relaxed">{`const playerStylePresets = [
  { id: 'default',   name: 'Default',   description: 'Standard controls.' },
  { id: 'your-skin', name: 'Your Skin', description: 'Your custom skin.' },
];`}</pre>
              </div>
            </div>

            {/* Step 5 */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                <span className="w-7 h-7 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">5</span>
                Add your CSS
              </h3>
              <p className="text-secondary text-sm leading-relaxed">
                Create <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">your-skin/YourSkin.css</code>. It is imported directly in <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">YourSkin.tsx</code> so Vite bundles it automatically — no global import needed.
                Tailwind utility classes work too. Use a unique prefix for your class names to avoid conflicts with other skins.
              </p>
            </div>

            {/* API reference */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">SkinControlsProps reference</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Your <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">renderControls()</code> receives these props:
              </p>
              <div className="overflow-x-auto rounded-2xl border border-white/5">
                <table className="w-full text-left border-collapse bg-surface/20">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="p-4 text-xs font-semibold text-white/60 uppercase">Prop</th>
                      <th className="p-4 text-xs font-semibold text-white/60 uppercase">Type</th>
                      <th className="p-4 text-xs font-semibold text-white/60 uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {[
                      ["state", "SkinPlayerState", "playing, position, duration, volume, muted, speed, buffering"],
                      ["tracks", "SkinTrack[]", "All audio, subtitle, and video tracks reported by mpv"],
                      ["isVisible", "boolean", "Whether the controls overlay should be shown (mouse idle hides it)"],
                      ["seekOsdVisible", "boolean", "True when the user seeks with keys while controls are hidden — show a minimal seek indicator"],
                      ["isFullscreen", "boolean", "Whether the player is currently fullscreen"],
                      ["showMenu", "'settings' | null", "Which dropdown is open; set via onSetShowMenu"],
                      ["sidecarSubtitles", "SkinSidecar[]", "External subtitle files found alongside the media file"],
                      ["onTogglePlay()", "() => void", "Toggle play/pause"],
                      ["onToggleMute()", "() => void", "Toggle mute (restores previous volume on unmute)"],
                      ["onChangeVolume(v)", "(v: number) => void", "Set volume (0 – volumeMax + volumeBoostMax)"],
                      ["onToggleFullscreen()", "() => void", "Enter or exit fullscreen"],
                      ["onSeekTo(seconds)", "(s: number) => void", "Seek to an absolute position in seconds"],
                      ["onSetSpeed(s)", "(s: number) => void", "Set playback speed (e.g. 0.5, 1, 1.5, 2)"],
                      ["onSetAudioTrack(id)", "(id: number) => void", "Switch to an audio track by its mpv track id"],
                      ["onSetSubTrack(id)", "(id: number) => void", "Switch to a subtitle track (pass 0 to disable)"],
                      ["onSetSubFile(path)", "(path: string) => void", "Load an external subtitle file by absolute path"],
                      ["onSetShowMenu(m)", "(m: 'settings' | null) => void", "Open or close the settings dropdown"],
                      ["onSeekBarDown/Move/Up", "PointerEvent handler", "Pointer event handlers for a custom seek bar — wire these to your seek track element"],
                    ].map(([prop, type, desc]) => (
                      <tr key={prop as string}>
                        <td className="p-4 font-mono text-primary text-xs">{prop}</td>
                        <td className="p-4 font-mono text-white/60 text-xs">{type}</td>
                        <td className="p-4 text-secondary text-xs leading-relaxed">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tips */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white">Tips</h3>
              <div className="space-y-3">
                <div className="glass-panel p-5 rounded-2xl flex gap-4">
                  <span className="material-symbols-outlined text-primary flex-shrink-0">lightbulb</span>
                  <p className="text-secondary text-sm leading-relaxed">
                    <strong className="text-white">Use hooks freely.</strong> Your <code className="bg-white/5 px-1 rounded font-mono text-xs">renderControls()</code> should return a JSX element rendered by an inner function component — that way you can use <code className="bg-white/5 px-1 rounded font-mono text-xs">useState</code> and <code className="bg-white/5 px-1 rounded font-mono text-xs">useEffect</code> for local UI state like OSD timers or hover effects.
                  </p>
                </div>
                <div className="glass-panel p-5 rounded-2xl flex gap-4">
                  <span className="material-symbols-outlined text-primary flex-shrink-0">lightbulb</span>
                  <p className="text-secondary text-sm leading-relaxed">
                    <strong className="text-white">seekOsdVisible vs isVisible.</strong> When the user presses arrow keys with controls hidden, <code className="bg-white/5 px-1 rounded font-mono text-xs">isVisible</code> stays false but <code className="bg-white/5 px-1 rounded font-mono text-xs">seekOsdVisible</code> turns true for 1.5 seconds. Use it to show a minimal seek indicator without revealing the full controls bar.
                  </p>
                </div>
                <div className="glass-panel p-5 rounded-2xl flex gap-4">
                  <span className="material-symbols-outlined text-primary flex-shrink-0">lightbulb</span>
                  <p className="text-secondary text-sm leading-relaxed">
                    <strong className="text-white">Engine-level classes stay <code className="bg-white/5 px-1 rounded font-mono text-xs">mpv-*</code>.</strong> The canvas, buffering spinner, error overlay, and skip ripples are rendered by <code className="bg-white/5 px-1 rounded font-mono text-xs">MpvPlayer.tsx</code> and always use the <code className="bg-white/5 px-1 rounded font-mono text-xs">mpv-</code> prefix. Your skin only needs to style what's inside <code className="bg-white/5 px-1 rounded font-mono text-xs">renderControls()</code>.
                  </p>
                </div>
              </div>
            </div>

          </section>

        </main>
      </div>
    </>
  );
}
