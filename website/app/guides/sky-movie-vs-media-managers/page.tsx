import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = "https://sky-movie-website.vercel.app";

export const metadata: Metadata = {
  title: "Sky Movie vs Other Desktop Media Library Managers (Plex, Jellyfin, Kodi, VLC) | Guide",
  description:
    "An objective, factual comparison between Sky Movie, Plex, Jellyfin, Kodi, and VLC. Discover why local-first desktop cinema with native libmpv offers a distinct alternative.",
  alternates: {
    canonical: "/guides/sky-movie-vs-media-managers",
  },
  openGraph: {
    title: "Sky Movie vs Other Desktop Media Library Managers",
    description:
      "An objective, factual comparison between Sky Movie, Plex, Jellyfin, Kodi, and VLC. Discover why local-first desktop cinema with native libmpv offers a distinct alternative.",
    url: `${siteUrl}/guides/sky-movie-vs-media-managers`,
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
      name: "Sky Movie vs Media Managers Comparison",
      item: `${siteUrl}/guides/sky-movie-vs-media-managers`,
    },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "Sky Movie vs Other Desktop Media Library Managers",
  description:
    "Explore architectural and practical differences between local-first desktop apps like Sky Movie and client-server media servers or standalone media players.",
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
  datePublished: "2026-02-10T00:00:00Z",
  dateModified: "2026-10-27T00:00:00Z",
};

export default function ComparisonPage() {
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
          <span className="text-secondary text-sm font-medium">Comparison</span>
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

      <main className="min-h-screen pt-32 pb-24 px-6 md:px-12 max-w-5xl mx-auto">
        {/* Breadcrumb nav */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-xs text-secondary">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li>/</li>
            <li><span className="text-white">Guides</span></li>
            <li>/</li>
            <li className="text-primary truncate">Sky Movie vs Media Managers</li>
          </ol>
        </nav>

        <article>
          <header className="mb-12">
            <span className="inline-flex items-center gap-2 text-primary text-xs font-semibold bg-primary/10 border border-primary/20 px-3 py-1 rounded-full mb-4">
              <span className="material-symbols-outlined text-sm">compare_arrows</span>
              Objective Architecture Comparison
            </span>
            <h1 className="font-display-lg text-4xl md:text-5xl leading-tight mb-6">
              Sky Movie vs Other Desktop Media Library Managers
            </h1>
            <p className="text-secondary text-lg leading-relaxed max-w-3xl">
              Choosing the right software for your movie and TV library depends on your use case. Do you need remote multi-device streaming, a 10-foot television interface, a standalone single-file player, or a dedicated, lightweight desktop cinema manager?
            </p>
          </header>

          {/* Comparison Table */}
          <div className="glass-panel p-6 rounded-3xl border-white/5 overflow-x-auto mb-12">
            <table className="w-full text-left text-sm text-secondary min-w-[650px]">
              <thead>
                <tr className="border-b border-white/10 text-white font-semibold">
                  <th className="py-4 px-4">Feature / Aspect</th>
                  <th className="py-4 px-4 text-primary">Sky Movie</th>
                  <th className="py-4 px-4">Plex / Jellyfin</th>
                  <th className="py-4 px-4">Kodi</th>
                  <th className="py-4 px-4">VLC Media Player</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="py-4 px-4 font-medium text-white">Architecture</td>
                  <td className="py-4 px-4 text-white font-medium">Local-first desktop app (SQLite)</td>
                  <td className="py-4 px-4">Client-Server (central daemon)</td>
                  <td className="py-4 px-4">Local 10-foot home theater PC</td>
                  <td className="py-4 px-4">Standalone player (no library DB)</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-white">Playback Engine</td>
                  <td className="py-4 px-4 text-emerald-400">Native libmpv (Hardware decoded)</td>
                  <td className="py-4 px-4">Web/App + Server Transcoder</td>
                  <td className="py-4 px-4">Kodi VideoPlayer (Internal)</td>
                  <td className="py-4 px-4">libVLC</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-white">User Accounts &amp; Privacy</td>
                  <td className="py-4 px-4 text-emerald-400">Zero accounts • 100% Private</td>
                  <td className="py-4 px-4">Account required (Plex) / Local users (Jellyfin)</td>
                  <td className="py-4 px-4">Local configuration</td>
                  <td className="py-4 px-4">No accounts</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-white">YouTube Downloader</td>
                  <td className="py-4 px-4 text-emerald-400">Integrated yt-dlp downloader</td>
                  <td className="py-4 px-4 text-rose-300">Third-party plugins needed</td>
                  <td className="py-4 px-4">Addon required</td>
                  <td className="py-4 px-4 text-rose-300">Basic stream playback only</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-white">Torrent Management</td>
                  <td className="py-4 px-4 text-emerald-400">Embedded WebTorrent client</td>
                  <td className="py-4 px-4 text-rose-300">External Arr-suite required</td>
                  <td className="py-4 px-4 text-rose-300">External software needed</td>
                  <td className="py-4 px-4 text-rose-300">None</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-white">Audio Boost &amp; Gestures</td>
                  <td className="py-4 px-4 text-emerald-400">200% boost + double-click seek</td>
                  <td className="py-4 px-4">Standard volume</td>
                  <td className="py-4 px-4">Keymap configuration</td>
                  <td className="py-4 px-4">125-200% volume</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-white">Resource Footprint</td>
                  <td className="py-4 px-4">Lightweight desktop memory</td>
                  <td className="py-4 px-4">Heavy (server daemon + transcode CPU)</td>
                  <td className="py-4 px-4">Moderate to high (heavy skins)</td>
                  <td className="py-4 px-4 text-emerald-400">Extremely lightweight</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Deep Dives */}
          <div className="space-y-10 text-secondary leading-relaxed">
            <section className="glass-panel p-8 rounded-3xl border-white/5">
              <h2 className="text-2xl font-bold text-white mb-4">
                Sky Movie vs Plex and Jellyfin
              </h2>
              <p className="mb-4">
                Plex and Jellyfin are designed as <strong>client-server streaming solutions</strong>. They excel when you have a dedicated home server (such as a NAS or home lab) and need to transcode and stream video files to mobile phones, Apple TVs, or family members outside your local network.
              </p>
              <p className="mb-4">
                However, running a full server stack on your everyday PC or laptop introduces significant complexity: background server processes that consume RAM, required user authentication, port forwarding or relay services, and CPU-intensive transcoding if the client cannot decode MKV or HEVC.
              </p>
              <p>
                <strong>When to choose Sky Movie:</strong> If you watch movies primarily on your desktop, laptop, or connected monitor, Sky Movie eliminates all server overhead. Everything runs locally in SQLite, files play directly in native libmpv with zero transcoding, and you never need to create an account or sign in.
              </p>
            </section>

            <section className="glass-panel p-8 rounded-3xl border-white/5">
              <h2 className="text-2xl font-bold text-white mb-4">
                Sky Movie vs Kodi
              </h2>
              <p className="mb-4">
                Kodi (formerly XBMC) is the undisputed king of the <strong>10-foot living room home theater interface</strong>. It is designed to be operated with an infrared remote control from a couch, running on specialized hardware like Nvidia Shield or Raspberry Pi.
              </p>
              <p className="mb-4">
                On modern desktop monitors with a mouse, keyboard, and windowed multitasking, Kodi's fullscreen-only paradigm and nested XML menus can feel heavy and disconnected from your desktop workflow.
              </p>
              <p>
                <strong>When to choose Sky Movie:</strong> Sky Movie is built specifically for modern desktop operating systems (Windows, macOS, and Linux). It features smooth mouse gestures, instant <kbd className="text-xs bg-white/10 px-1.5 py-0.5 rounded text-white font-mono">Ctrl+K</kbd> search, floating picture-in-picture style player options, and responsive window resizing.
              </p>
            </section>

            <section className="glass-panel p-8 rounded-3xl border-white/5">
              <h2 className="text-2xl font-bold text-white mb-4">
                Sky Movie vs VLC Media Player
              </h2>
              <p className="mb-4">
                VLC is an essential Swiss Army knife for opening individual video files. It supports nearly every codec on earth and starts instantly.
              </p>
              <p className="mb-4">
                Where VLC falls short is <strong>library management</strong>. VLC does not fetch TMDB movie posters, backdrops, cast bios, or Rotten Tomatoes ratings. It doesn't group your TV shows into collapsible season lists, save resume timestamps across reboots in an indexed database, or let you manage playlists visually.
              </p>
              <p>
                <strong>When to choose Sky Movie:</strong> Sky Movie pairs the playback horsepower and codec compatibility of MPV with a gorgeous, automated movie organizer interface. You get the best of both worlds: zero-compromise hardware playback plus a curated cinema library.
              </p>
            </section>
          </div>

          <footer className="mt-16 p-8 glass-panel rounded-3xl border-primary/20 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">Try the Local-First Desktop Difference</h3>
            <p className="text-secondary text-sm max-w-xl mx-auto mb-6">
              Sky Movie is free, open source under the MIT license, and runs on Windows, macOS, and Linux. No credit card, no registration, no tracking.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/#downloads"
                className="px-6 py-3 bg-primary text-on-primary font-label-md rounded-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Download Latest Release
              </Link>
              <Link
                href="/guides/organize-personal-movie-collection"
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-label-md rounded-xl transition-all text-sm"
              >
                Read Collection Organization Guide
              </Link>
            </div>
          </footer>
        </article>
      </main>
    </>
  );
}
