export function FolderStructuresSection() {
  return (
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
  );
}
