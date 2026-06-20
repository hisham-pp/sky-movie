'use client';

import releaseManifestJson from "../public/releases.json";
import Link from "next/link";

const repoUrl = "https://github.com/hisham-pp/sky-movie";

interface ReleaseManifest {
  latestVersion: string;
  updatedAt: string | null;
  releases: Array<{
    version: string;
    releasedAt: string | null;
    storageProvider?: string;
    storageFolderUrl?: string | null;
    notes: string;
    changes?: string[];
    artifacts: Array<{
      platform: string;
      kind: string;
      fileName: string;
      downloadUrl: string;
    }>;
  }>;
}

const releaseManifest = releaseManifestJson as ReleaseManifest;

export default function Home() {
  const latestRelease = releaseManifest.releases[0];
  const secondRelease = releaseManifest.releases[1];
  
  // Get download artifacts for common platforms
  const getDmgArtifact = (release: typeof latestRelease) => 
    release?.artifacts.find(a => a.kind === 'dmg');
  const getExeArtifact = (release: typeof latestRelease) => 
    release?.artifacts.find(a => a.kind === 'installer');
  
  const latestDmg = getDmgArtifact(latestRelease);
  const latestExe = getExeArtifact(latestRelease);
  
  const formatReleaseDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not released yet';
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  };
  
  const isBetaVersion = (version: string) => {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!match) return false;
    const major = parseInt(match[1]);
    return major < 1;
  };
  
  return (
    <>
      {/* Global Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-surface/40 flex justify-between items-center px-container-padding h-20">
        <div className="flex items-center gap-4">
          <span className="font-display-lg text-headline-sm text-primary tracking-tight">Sky Movie</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a className="text-secondary font-label-md hover:text-primary transition-colors" href="#features">Features</a>
          <a className="text-secondary font-label-md hover:text-primary transition-colors" href="#downloads">Download</a>
          <Link className="text-secondary font-label-md hover:text-primary transition-colors" href="/docs">Docs</Link>
          <a className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-primary font-label-md transition-all flex items-center gap-2" href={repoUrl}>
            <span className="material-symbols-outlined text-sm">code</span>
            GitHub
          </a>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-40 pb-20 px-container-padding overflow-hidden">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <h1 className="font-display-lg text-[64px] md:text-[80px] leading-[1.1] mb-6 tracking-tight">
              Your Personal Cinema, <span className="gradient-text">Perfected.</span>
            </h1>
            <p className="font-body-lg text-secondary max-w-2xl mx-auto mb-10 text-lg md:text-xl">
              The premium media manager for the cinematic connoisseur. Scan local collections, automate metadata, and experience your library in stunning 4K HDR.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a className="w-full sm:w-auto px-8 py-4 bg-primary text-on-primary font-label-md text-base rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2" href="#downloads">
                <span className="material-symbols-outlined">download</span>
                Download on GitHub
              </a>
              <Link className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-primary font-label-md text-base rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2" href="/docs">
                View Documentation
              </Link>
            </div>
          </div>
        </section>

        {/* Product Preview (Mockup) */}
        <section className="px-container-padding pb-stack-lg max-w-7xl mx-auto">
          <div className="relative group">
            <div className="glass-panel p-2 rounded-[32px] shadow-2xl overflow-hidden group-hover:border-primary/30 transition-colors duration-500">
              <div className="rounded-[24px] overflow-hidden relative aspect-[16/10] bg-surface-container-lowest">
                <div className="flex h-full">
                  <div className="w-[200px] border-r border-white/5 h-full bg-surface-dim/80 p-6 flex flex-col gap-6 hidden lg:flex">
                    <div className="w-8 h-8 bg-primary rounded-lg mb-4"></div>
                    <div className="space-y-4">
                      <div className="h-2 w-24 bg-primary/20 rounded"></div>
                      <div className="h-2 w-20 bg-white/5 rounded"></div>
                      <div className="h-2 w-28 bg-white/5 rounded"></div>
                      <div className="h-2 w-16 bg-white/5 rounded"></div>
                    </div>
                  </div>
                  <div className="flex-1 p-8">
                    <div className="flex justify-between items-center mb-8">
                      <div className="h-8 w-48 bg-white/10 rounded-lg"></div>
                      <div className="flex gap-2">
                        <div className="w-8 h-8 bg-white/5 rounded-full"></div>
                        <div className="w-8 h-8 bg-white/5 rounded-full"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="aspect-[2/3] bg-white/5 rounded-xl animate-pulse"></div>
                      <div className="aspect-[2/3] bg-white/5 rounded-xl animate-pulse"></div>
                      <div className="aspect-[2/3] bg-white/5 rounded-xl animate-pulse"></div>
                      <div className="aspect-[2/3] bg-white/5 rounded-xl animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 z-20 pointer-events-none">
                  <img className="w-full h-full object-cover" alt="Sky Movie Desktop App Screenshot" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZxW8vNvVuwvdk4tvxNUR7PTXIeSmHwzXlAbdT93zxb6Xzxywv_4MeO_NCt6mg5GxEcMXYVIxY90wqhlPSeNzTK47UUEgmjFyGF3fxcGXnrR1836FseD471ObmKnUZsEewRuAufG-BuzOGw5z15wYgRhN4GfWtZiwkaPUUQ5_MifT-P_r8jYGDka4Fm0aqZAvp__aelIf2CJtNEuMNgIg391nklO7JxB1k3oqHzeogAS6tcUj7aHq40vLha2-ZgrRZauta-k6PilX5" />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-primary/10 blur-[100px] -z-10"></div>
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/5 blur-[100px] -z-10"></div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-container-padding max-w-7xl mx-auto" id="features">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-grid-gutter">
            <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">folder_managed</span>
              </div>
              <h3 className="font-headline-sm text-xl mb-3">Instant Folder Scanning</h3>
              <p className="text-secondary text-sm leading-relaxed">Point to your movie directory and let Sky Movie do the heavy lifting in seconds.</p>
            </div>

            <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">auto_awesome</span>
              </div>
              <h3 className="font-headline-sm text-xl mb-3">Automated Metadata</h3>
              <p className="text-secondary text-sm leading-relaxed">Beautiful posters, backdrops, and cast info fetched automatically for every title.</p>
            </div>

            <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">high_quality</span>
              </div>
              <h3 className="font-headline-sm text-xl mb-3">4K & HDR Support</h3>
              <p className="text-secondary text-sm leading-relaxed">Full technical info displays for your high-fidelity collection, including HDR10+ and Dolby Vision.</p>
            </div>

            <div className="glass-panel p-8 rounded-3xl hover:border-primary/40 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">collections</span>
              </div>
              <h3 className="font-headline-sm text-xl mb-3">Clean Management</h3>
              <p className="text-secondary text-sm leading-relaxed">Organize by genre, year, or rating with a UI that stays out of your way.</p>
            </div>
          </div>
        </section>

        {/* Downloads Section */}
        <section className="py-20 bg-surface-container-low px-container-padding relative overflow-hidden" id="downloads">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline-md text-white mb-4">Ready to upgrade your collection?</h2>
              <p className="text-secondary font-body-lg">Download the latest stable release for your operating system.</p>
              {isBetaVersion(latestRelease?.version || '') && (
                <div className="mt-6 max-w-2xl mx-auto p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                  <p className="text-orange-400 text-sm">
                    <strong>⚠️ Beta Software Notice:</strong> Windows may show a security warning because this app is not yet code-signed. 
                    Click "More info" → "Run anyway" to install. The app is safe and open source.
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">rocket_launch</span>
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-lg flex items-center gap-2">
                      {latestRelease?.version}
                      {isBetaVersion(latestRelease?.version || '') ? (
                        <span className="bg-orange-500/10 text-orange-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-orange-500/20">Beta</span>
                      ) : (
                        <span className="bg-primary/10 text-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-primary/20">Latest</span>
                      )}
                    </h4>
                    <p className="text-secondary text-sm">Released {formatReleaseDate(latestRelease?.releasedAt)} • macOS, Windows, Linux</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
                  {latestDmg && (
                    <a href={latestDmg.downloadUrl} download className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-label-md hover:bg-primary hover:text-on-primary transition-all flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">desktop_mac</span>
                      .dmg
                    </a>
                  )}
                  {latestExe && (
                    <a href={latestExe.downloadUrl} download className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-label-md hover:bg-primary hover:text-on-primary transition-all flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">window</span>
                      .exe
                    </a>
                  )}
                </div>
              </div>

              {secondRelease && (
                <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 hover:opacity-100 transition-all border-white/5">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined">history</span>
                    </div>
                    <div>
                      <h4 className="font-headline-sm text-lg">{secondRelease.version}</h4>
                      <p className="text-secondary text-sm">Released {formatReleaseDate(secondRelease.releasedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href="/whats-new" className="px-4 py-2 bg-white/5 rounded-lg text-secondary text-sm hover:text-white transition-colors">View Changes</Link>
                    <Link href="/whats-new" className="px-4 py-2 bg-white/5 rounded-lg text-secondary text-sm hover:text-white transition-colors">Download Assets</Link>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-12 text-center">
              <Link href="/whats-new" className="text-primary font-label-md flex items-center justify-center gap-2 group">
                Browse all releases and changelogs
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Documentation Preview */}
        <section className="py-24 px-container-padding max-w-7xl mx-auto" id="docs">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="lg:w-1/3">
              <h2 className="font-headline-md mb-6">Built for enthusiasts, <span className="text-primary">extensible</span> for developers.</h2>
              <p className="text-secondary mb-8">Whether you're just setting up your first library or building a custom integration, our comprehensive docs have you covered.</p>
              <div className="p-1 px-4 bg-primary/5 border border-primary/20 rounded-full inline-flex items-center gap-2 text-primary font-label-sm">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                Docs updated for {latestRelease?.version}
              </div>
            </div>
            <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              <Link className="glass-panel p-8 rounded-3xl border-white/5 hover:bg-white/5 transition-all group" href="/docs#introduction">
                <span className="material-symbols-outlined text-primary mb-4 block">menu_book</span>
                <h4 className="font-headline-sm text-xl mb-2 group-hover:text-primary">Getting Started</h4>
                <p className="text-secondary text-sm">Installation guide and first-time configuration walkthrough.</p>
              </Link>
              <Link className="glass-panel p-8 rounded-3xl border-white/5 hover:bg-white/5 transition-all group" href="/docs#naming-conventions">
                <span className="material-symbols-outlined text-primary mb-4 block">settings_suggest</span>
                <h4 className="font-headline-sm text-xl mb-2 group-hover:text-primary">Library Setup</h4>
                <p className="text-secondary text-sm">Learn how to optimize your folder structure for best scanning results.</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-32 px-container-padding text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 -z-10"></div>
          <div className="max-w-3xl mx-auto">
            <h2 className="font-headline-md text-4xl mb-8">Experience Cinema at Home.</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-10 py-5 bg-primary text-on-primary rounded-2xl font-label-md text-lg hover:shadow-[0_0_40px_rgba(137,206,255,0.3)] transition-all">
                Get Started Now
              </button>
              <button className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-label-md text-lg hover:bg-white/10 transition-all">
                Star on GitHub
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-white/5 pt-20 pb-10 px-container-padding">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1">
            <span className="font-display-lg text-headline-sm text-primary tracking-tight block mb-6">Sky Movie</span>
            <p className="text-secondary text-sm leading-relaxed">The premium open-source movie library manager built for the next generation of cinema lovers.</p>
          </div>
          <div>
            <h5 className="text-white font-label-md mb-6 uppercase tracking-widest text-[10px]">Product</h5>
            <ul className="space-y-4 text-sm text-secondary">
              <li><a className="hover:text-primary transition-colors" href="#">Changelog</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Documentation</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Releases</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-label-md mb-6 uppercase tracking-widest text-[10px]">Community</h5>
            <ul className="space-y-4 text-sm text-secondary">
              <li><a className="hover:text-primary transition-colors" href={repoUrl}>GitHub Repository</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Discord Server</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">X / Twitter</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-label-md mb-6 uppercase tracking-widest text-[10px]">Developer</h5>
            <ul className="space-y-4 text-sm text-secondary">
              <li><a className="hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Terms of Service</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Contributor Guide</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-white/5">
          <p className="text-secondary text-xs">© 2024 Sky Movie Project. Released under MIT License.</p>
          <div className="flex items-center gap-6">
            <a className="text-secondary hover:text-white transition-colors" href={repoUrl}>
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path></svg>
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
