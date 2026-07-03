export function GettingStartedSection() {
  return (
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
  );
}
