'use client';

import { useState } from "react";

export function NamingConventionsSection() {
  const [activeTab, setActiveTab] = useState<"movies" | "shows">("movies");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
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
  );
}
