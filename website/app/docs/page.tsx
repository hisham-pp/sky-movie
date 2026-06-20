'use client';

import Link from "next/link";
import { useState } from "react";

const repoUrl = "https://github.com/hisham-pp/sky-movie";

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<"movies" | "shows">("movies");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

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
            <a 
              href="#introduction" 
              className="flex items-center gap-3 px-3 py-2 text-secondary hover:text-primary hover:bg-white/5 rounded-xl transition-all font-medium text-sm"
            >
              <span className="material-symbols-outlined text-lg">info</span>
              Introduction
            </a>
            <a 
              href="#naming-conventions" 
              className="flex items-center gap-3 px-3 py-2 text-secondary hover:text-primary hover:bg-white/5 rounded-xl transition-all font-medium text-sm"
            >
              <span className="material-symbols-outlined text-lg">edit_note</span>
              Naming Conventions
            </a>
            <a 
              href="#folder-structures" 
              className="flex items-center gap-3 px-3 py-2 text-secondary hover:text-primary hover:bg-white/5 rounded-xl transition-all font-medium text-sm"
            >
              <span className="material-symbols-outlined text-lg">folder_open</span>
              Folder Structures
            </a>
            <a 
              href="#matching-strategies" 
              className="flex items-center gap-3 px-3 py-2 text-secondary hover:text-primary hover:bg-white/5 rounded-xl transition-all font-medium text-sm"
            >
              <span className="material-symbols-outlined text-lg">settings_suggest</span>
              Matching Strategies
            </a>
            <a 
              href="#troubleshooting" 
              className="flex items-center gap-3 px-3 py-2 text-secondary hover:text-primary hover:bg-white/5 rounded-xl transition-all font-medium text-sm"
            >
              <span className="material-symbols-outlined text-lg">help_outline</span>
              Troubleshooting
            </a>
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
            </div>
          </section>

        </main>
      </div>
    </>
  );
}
