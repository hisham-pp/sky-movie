const PLAYLIST_STEPS = [
  { icon: "add_circle", title: "Creating a Playlist", desc: "Click the Playlist icon in the left sidebar, then choose \"New Playlist\". Give it a name and it will appear in your sidebar immediately." },
  { icon: "playlist_add", title: "Adding Items", desc: "From any movie or TV show detail page, tap \"Add to Playlist\" to open the picker dialog. You can add to multiple playlists at once. Movies and TV shows can be mixed in the same playlist." },
  { icon: "play_arrow", title: "Playing a Playlist", desc: "Open a playlist and click \"Play All\" to start playing from the first item. The built-in player queues up items in order. You can reorder entries by dragging them." },
  { icon: "edit", title: "Editing & Deleting", desc: "Use the Edit button on the playlist page to rename it or remove individual items. Deleting a playlist does not remove the underlying media files from your library." },
];

export function PlaylistsSection() {
  return (
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
        {PLAYLIST_STEPS.map(({ icon, title, desc }) => (
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
  );
}
