import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = "https://sky-movie-website.vercel.app";

export const metadata: Metadata = {
  title: "How to Install Sky Movie on Linux (Ubuntu, Debian, Fedora, Arch) | Guide",
  description:
    "Complete step-by-step guide to installing Sky Movie on Linux distributions using AppImage, DEB package, or tar.gz archive. Includes libmpv and troubleshooting tips.",
  alternates: {
    canonical: "/guides/install-sky-movie-on-linux",
  },
  openGraph: {
    title: "How to Install Sky Movie on Linux (Ubuntu, Debian, Fedora, Arch)",
    description:
      "Complete step-by-step guide to installing Sky Movie on Linux distributions using AppImage, DEB package, or tar.gz archive. Includes libmpv and troubleshooting tips.",
    url: `${siteUrl}/guides/install-sky-movie-on-linux`,
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
      name: "How to Install Sky Movie on Linux",
      item: `${siteUrl}/guides/install-sky-movie-on-linux`,
    },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "How to Install Sky Movie on Linux (Ubuntu, Debian, Fedora, Arch)",
  description:
    "Learn how to run Sky Movie on Linux desktop environments using AppImage or DEB packages, resolve libfuse2 requirements, and configure hardware video acceleration.",
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
  datePublished: "2026-02-15T00:00:00Z",
  dateModified: "2026-10-27T00:00:00Z",
};

export default function LinuxInstallationGuidePage() {
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
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-xs text-secondary">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li>/</li>
            <li><span className="text-white">Guides</span></li>
            <li>/</li>
            <li className="text-primary truncate">Linux Installation Guide</li>
          </ol>
        </nav>

        <article>
          <header className="mb-12">
            <span className="inline-flex items-center gap-2 text-primary text-xs font-semibold bg-primary/10 border border-primary/20 px-3 py-1 rounded-full mb-4">
              <span className="material-symbols-outlined text-sm">terminal</span>
              Linux Setup &amp; Deployment
            </span>
            <h1 className="font-display-lg text-4xl md:text-5xl leading-tight mb-6">
              How to Install Sky Movie on Linux (Ubuntu, Debian, Fedora, Arch)
            </h1>
            <p className="text-secondary text-lg leading-relaxed">
              Sky Movie provides native Linux support with pre-packaged <code className="text-primary font-mono">.AppImage</code>, Debian/Ubuntu <code className="text-primary font-mono">.deb</code> packages, and generic <code className="text-primary font-mono">.tar.gz</code> archives for both x64 and ARM64 architectures.
            </p>
          </header>

          <div className="space-y-12 text-secondary leading-relaxed">
            {/* AppImage */}
            <section className="glass-panel p-8 rounded-3xl border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
                  Method 1: AppImage (Recommended for all distros)
                </h2>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
                  Most Portable
                </span>
              </div>
              <p className="mb-4">
                The AppImage is fully self-contained with bundled Electron and mpv bindings. It works seamlessly across Ubuntu, Linux Mint, Debian, Fedora, Arch Linux, and openSUSE without root privileges.
              </p>
              <div className="bg-black/50 p-4 rounded-xl font-mono text-sm border border-white/5 space-y-2 text-white/90">
                <p className="text-white/40"># 1. Fetch latest release version</p>
                <p className="text-primary">VERSION=$(curl -fsSL https://api.github.com/repos/hisham-pp/sky-movie/releases/latest | grep &apos;&quot;tag_name&quot;&apos; | cut -d&apos;&quot;&apos; -f4)</p>
                <p className="text-white/40 pt-2"># 2. Download AppImage</p>
                <p>wget &quot;https://github.com/hisham-pp/sky-movie/releases/download/$&#123;VERSION&#125;/Sky-Movie-$&#123;VERSION#v&#125;-linux-x64.AppImage&quot;</p>
                <p className="text-white/40 pt-2"># 3. Mark executable and run</p>
                <p>chmod +x &quot;Sky-Movie-$&#123;VERSION#v&#125;-linux-x64.AppImage&quot;</p>
                <p>./&quot;Sky-Movie-$&#123;VERSION#v&#125;-linux-x64.AppImage&quot;</p>
              </div>
              <p className="mt-4 text-xs text-white/60">
                <strong>Ubuntu 22.04+ / 24.04 Note:</strong> If the AppImage does not launch, ensure FUSE is installed: <code className="text-primary font-mono">sudo apt install libfuse2</code>.
              </p>
            </section>

            {/* DEB Package */}
            <section className="glass-panel p-8 rounded-3xl border-white/5">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
                Method 2: DEB Package (Ubuntu &amp; Debian)
              </h2>
              <p className="mb-4">
                Installing via DEB integrates Sky Movie into your desktop application launcher (GNOME, KDE, XFCE) and handles desktop protocol handlers.
              </p>
              <div className="bg-black/50 p-4 rounded-xl font-mono text-sm border border-white/5 space-y-2 text-white/90">
                <p className="text-white/40"># Download and install DEB package</p>
                <p>wget &quot;https://github.com/hisham-pp/sky-movie/releases/download/$&#123;VERSION&#125;/Sky-Movie-$&#123;VERSION#v&#125;-linux-x64.deb&quot;</p>
                <p>sudo apt install ./&quot;Sky-Movie-$&#123;VERSION#v&#125;-linux-x64.deb&quot;</p>
              </div>
            </section>

            {/* tar.gz */}
            <section className="glass-panel p-8 rounded-3xl border-white/5">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">3</span>
                Method 3: Standalone Tarball (Fedora, Arch &amp; Custom Distros)
              </h2>
              <p className="mb-4">
                For minimal or custom distributions where package managers are bypassed:
              </p>
              <div className="bg-black/50 p-4 rounded-xl font-mono text-sm border border-white/5 space-y-2 text-white/90">
                <p>wget &quot;https://github.com/hisham-pp/sky-movie/releases/download/$&#123;VERSION&#125;/Sky-Movie-$&#123;VERSION#v&#125;-linux-x64.tar.gz&quot;</p>
                <p>tar -xzf &quot;Sky-Movie-$&#123;VERSION#v&#125;-linux-x64.tar.gz&quot;</p>
                <p>cd sky-movie &amp;&amp; ./sky-movie</p>
              </div>
            </section>

            {/* System Requirements & Dependencies */}
            <section className="glass-panel p-8 rounded-3xl border-white/5">
              <h2 className="text-2xl font-semibold text-white mb-4">
                System Requirements &amp; Video Hardware Acceleration
              </h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Architecture:</strong> x86_64 (64-bit) or ARM64.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Memory &amp; Storage:</strong> 4 GB RAM minimum, 200 MB disk space.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Hardware Acceleration (VA-API / NVDEC):</strong> Sky Movie uses native libmpv for playback. Ensure your Intel/AMD/Nvidia drivers are configured with VA-API or VDPAU for efficient 4K HDR playback without CPU throttling.</span>
                </li>
              </ul>
            </section>
          </div>

          <footer className="mt-16 p-8 glass-panel rounded-3xl border-primary/20 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">Download Sky Movie for Linux</h3>
            <p className="text-secondary text-sm max-w-xl mx-auto mb-6">
              Get the latest AppImage or DEB release directly from the GitHub releases page.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://github.com/hisham-pp/sky-movie/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-primary text-on-primary font-label-md rounded-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                GitHub Releases Page
              </a>
              <Link
                href="/docs#linux-installation"
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-label-md rounded-xl transition-all text-sm"
              >
                Full Linux Docs &amp; Troubleshooting
              </Link>
            </div>
          </footer>
        </article>
      </main>
    </>
  );
}
