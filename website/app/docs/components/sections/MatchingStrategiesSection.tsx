export function MatchingStrategiesSection() {
  return (
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
  );
}
