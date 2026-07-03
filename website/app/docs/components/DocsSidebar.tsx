'use client';

import { useEffect, useState } from "react";

const repoUrl = "https://github.com/hisham-pp/sky-movie";

const NAV_ITEMS = [
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
  { id: "linux-installation", icon: "terminal", label: "Linux Installation" },
];

export function DocsSidebar() {
  const [activeSection, setActiveSection] = useState<string>("introduction");

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
    <aside className="lg:w-64 flex-shrink-0 lg:sticky lg:top-28 h-fit space-y-2">
      <div className="px-3 mb-4 text-xs font-semibold text-white/40 uppercase tracking-wider">
        Table of Contents
      </div>
      <nav className="space-y-1">
        {NAV_ITEMS.map(({ id, icon, label }) => (
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
  );
}
