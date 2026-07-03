const METADATA_FIELDS = [
  { icon: "title", label: "Title & Original Title", desc: "Localized title plus the original language title." },
  { icon: "calendar_month", label: "Release / First Air Year", desc: "Used for disambiguation when multiple titles share a name." },
  { icon: "description", label: "Overview", desc: "Full plot synopsis from TMDB." },
  { icon: "image", label: "Poster & Backdrop", desc: "Downloaded and cached locally — no internet needed to display them later." },
  { icon: "schedule", label: "Runtime", desc: "Movie length in minutes (movies only)." },
  { icon: "star", label: "Rating", desc: "TMDB community vote average, rounded to one decimal." },
  { icon: "label", label: "Genres", desc: "All genre tags (Action, Drama, etc.) linked in the local database." },
  { icon: "people", label: "Cast (top 12)", desc: "Actor names, character names, and profile photos." },
  { icon: "movie_creation", label: "Crew (top 8)", desc: "Director, Writer, Screenplay, and Creator credits." },
];

export function MetadataTmdbSection() {
  return (
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
          {METADATA_FIELDS.map(({ icon, label, desc }) => (
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
  );
}
