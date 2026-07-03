export function SettingsReferenceSection() {
  return (
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
  );
}
