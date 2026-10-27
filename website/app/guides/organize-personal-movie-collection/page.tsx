import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = "https://sky-movie-website.vercel.app";

export const metadata: Metadata = {
  title: "How to Organize a Personal Movie and TV Show Collection on PC | Sky Movie Guide",
  description:
    "A comprehensive guide to organizing your local movie and TV show library on Windows, Mac, and Linux. Learn folder structures, naming conventions, and metadata matching.",
  alternates: {
    canonical: "/guides/organize-personal-movie-collection",
  },
  openGraph: {
    title: "How to Organize a Personal Movie and TV Show Collection on PC",
    description:
      "A comprehensive guide to organizing your local movie and TV show library on Windows, Mac, and Linux. Learn folder structures, naming conventions, and metadata matching.",
    url: `${siteUrl}/guides/organize-personal-movie-collection`,
    images: [{ url: "/sky-movie-preview.png", width: 1200, height: 630 }],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Guides",
      item: `${siteUrl}/#guides`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "How to Organize a Personal Movie Collection",
      item: `${siteUrl}/guides/organize-personal-movie-collection`,
    },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "How to Organize a Personal Movie and TV Show Collection on PC",
  description:
    "Learn best practices for structuring folders, naming video files, fetching TMDB metadata, and managing local movie libraries on desktop operating systems.",
  author: {
    "@type": "Person",
    name: "hisham-pp",
    url: "https://github.com/hisham-pp",
  },
  publisher: {
    "@type": "Organization",
    name: "Sky Movie",
    url: siteUrl,
  },
  datePublished: "2026-01-15T00:00:00Z",
  dateModified: "2026-10-27T00:00:00Z",
};

export default function OrganizeCollectionPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-surface/40 flex justify-between items-center px-8 lg:px-16 h-20 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-display-lg text-2xl text-primary tracking-tight hover:opacity-80 transition-opacity">
            Sky Movie
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-secondary text-sm font-medium">Guides</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/docs" className="text-secondary font-label-md text-sm hover:text-white transition-colors">
            Documentation
          </Link>
          <Link
            href="/"
            className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-primary font-label-md transition-all flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Home
          </Link>
        </div>
      </header>

      <main className="min-h-screen pt-32 pb-24 px-6 md:px-12 max-w-4xl mx-auto">
        {/* Breadcrumb nav */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-xs text-secondary">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li>/</li>
            <li><span className="text-white">Guides</span></li>
            <li>/</li>
            <li className="text-primary truncate">Organize Movie Collection</li>
          </ol>
        </nav>

        {/* Article Header */}
        <article>
          <header className="mb-12">
            <span className="inline-flex items-center gap-2 text-primary text-xs font-semibold bg-primary/10 border border-primary/20 px-3 py-1 rounded-full mb-4">
              <span className="material-symbols-outlined text-sm">folder</span>
              Library Management Guide
            </span>
            <h1 className="font-display-lg text-4xl md:text-5xl leading-tight mb-6">
              How to Organize a Personal Movie and TV Show Collection on PC
            </h1>
            <p className="text-secondary text-lg leading-relaxed">
              Managing a local digital movie library shouldn't feel like maintenance work. With standardized folder structures, clean file naming, and automated metadata matching, you can transform a chaotic hard drive into a sleek, searchable desktop cinema.
            </p>
          </header>

          <div className="space-y-12 text-secondary leading-relaxed">
            {/* Section 1 */}
            <section className="glass-panel p-8 rounded-3xl border-white/5">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
                The Foundation: Separate Movies from TV Shows
              </h2>
              <p className="mb-4">
                The single most impactful rule for any media manager is maintaining dedicated root folders for Movies and TV Shows. Movies are standalone entities, while television series require multi-tiered hierarchy (Series &rarr; Season &rarr; Episode).
              </p>
              <div className="bg-black/40 p-4 rounded-xl font-mono text-sm border border-white/5 text-white/90">
                <p className="text-primary font-bold">Media Library Root/</p>
                <p className="ml-4">&boxur;&boxh;&boxh; Movies/</p>
                <p className="ml-8">&boxur;&boxh;&boxh; Inception (2010)/</p>
                <p className="ml-12">&boxur;&boxh;&boxh; Inception (2010).mkv</p>
                <p className="ml-4">&boxur;&boxh;&boxh; TV Shows/</p>
                <p className="ml-8">&boxur;&boxh;&boxh; Breaking Bad/</p>
                <p className="ml-12">&boxur;&boxh;&boxh; Season 01/</p>
                <p className="ml-16">&boxur;&boxh;&boxh; Breaking Bad - S01E01 - Pilot.mkv</p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="glass-panel p-8 rounded-3xl border-white/5">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
                Standardized Movie File Naming Conventions
              </h2>
              <p className="mb-4">
                Automated scrapers query databases like TMDB (The Movie Database) using filename tokens. Including the four-digit release year inside parentheses is the standard convention that guarantees 99%+ automated match accuracy:
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 font-bold">✓ Best:</span>
                  <span><code className="text-primary font-mono">Dune Part Two (2024).mkv</code> or <code className="text-primary font-mono">Dune Part Two (2024)/Dune Part Two (2024).mkv</code></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 font-bold">✓ Multi-version:</span>
                  <span><code className="text-primary font-mono">Blade Runner (1982) - Final Cut.mkv</code></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold">✗ Avoid:</span>
                  <span><code className="text-rose-300 font-mono">Dune.2.2024.1080p.WEBRip.x264.AAC-GROUP.mkv</code> (causes false scraper tokens)</span>
                </li>
              </ul>
              <p className="text-sm text-white/60">
                Tip: Sky Movie includes built-in torrent file auto-renaming, transforming downloaded scene titles into clean <code className="text-primary">Title (Year).mkv</code> conventions automatically upon completion.
              </p>
            </section>

            {/* Section 3 */}
            <section className="glass-panel p-8 rounded-3xl border-white/5">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">3</span>
                TV Show Season and Episode Organization
              </h2>
              <p className="mb-4">
                Television files must specify season and episode numbers using standard <code className="text-primary">SxxExx</code> formatting. This allows Sky Movie to group episodes into collapsible season guides and display runtime progress per episode.
              </p>
              <div className="bg-black/40 p-4 rounded-xl font-mono text-sm border border-white/5 space-y-1">
                <p className="text-emerald-400 font-bold">Recommended Pattern:</p>
                <p>TV Shows/Show Name/Season 01/Show Name - S01E01 - Episode Title.mkv</p>
                <p>TV Shows/Show Name/Season 01/Show Name - S01E02 - Episode Title.mkv</p>
                <p className="text-white/40 pt-2"># Specials and extras go into Season 00:</p>
                <p>TV Shows/Show Name/Season 00/Show Name - S00E01 - Making Of.mkv</p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="glass-panel p-8 rounded-3xl border-white/5">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">4</span>
                Subtitles &amp; Multi-Track Audio Management
              </h2>
              <p className="mb-4">
                Modern video formats such as MKV allow embedding multiple audio tracks and soft subtitles (SRT, ASS) within the container. However, if you have separate subtitle files, placing them alongside the video file with the identical base filename enables automatic detection:
              </p>
              <div className="bg-black/40 p-4 rounded-xl font-mono text-sm border border-white/5 text-white/90">
                <p>Interstellar (2014).mkv</p>
                <p>Interstellar (2014).en.srt <span className="text-white/40"># English subtitles</span></p>
                <p>Interstellar (2014).es.srt <span className="text-white/40"># Spanish subtitles</span></p>
              </div>
              <p className="mt-4 text-sm">
                Sky Movie's native libmpv player supports ASS/SSA styled anime subtitles, forced subtitle tracks, and external subtitle drag-and-drop on the fly.
              </p>
            </section>

            {/* Section 5 */}
            <section className="glass-panel p-8 rounded-3xl border-white/5">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">5</span>
                Local SQLite Storage vs Cloud Media Servers
              </h2>
              <p className="mb-4">
                Unlike complex media servers that require background daemons, port forwarding, and user accounts, Sky Movie utilizes a local-first SQLite database.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">bolt</span>
                    Local-First SQLite App (Sky Movie)
                  </h3>
                  <ul className="text-xs space-y-1.5 text-white/70">
                    <li>• Instant startup with zero network lag</li>
                    <li>• 100% private — your library never leaves your drive</li>
                    <li>• Plays MKV/HEVC/4K natively with zero transcoding heat</li>
                    <li>• Works completely offline on laptops and desktops</li>
                  </ul>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-sm">cloud</span>
                    Traditional Client-Server Setup
                  </h3>
                  <ul className="text-xs space-y-1.5 text-white/70">
                    <li>• Requires server configuration and ongoing maintenance</li>
                    <li>• High CPU/GPU usage due to remote transcoding</li>
                    <li>• Accounts, tracking, and remote dependencies</li>
                    <li>• Unreliable without persistent broadband</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>

          {/* Call to action */}
          <footer className="mt-16 p-8 glass-panel rounded-3xl border-primary/20 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">Ready to organize your personal library?</h3>
            <p className="text-secondary text-sm max-w-xl mx-auto mb-6">
              Download Sky Movie for Windows, macOS, or Linux. Point to your movie folder and watch your collection come to life in seconds.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/#downloads"
                className="px-6 py-3 bg-primary text-on-primary font-label-md rounded-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Download Sky Movie Free
              </Link>
              <Link
                href="/docs"
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-label-md rounded-xl transition-all text-sm"
              >
                Read Setup Documentation
              </Link>
            </div>
          </footer>
        </article>
      </main>
    </>
  );
}
