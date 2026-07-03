import releaseManifestJson from "../../../../public/releases.json";

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
const latestVersion = releaseManifest.latestVersion;

export function LinuxInstallationSection() {
  return (
    <section id="linux-installation" className="scroll-mt-28 space-y-8">
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-2xl lg:text-3xl text-white font-bold tracking-tight mb-2">Linux Installation</h2>
        <p className="text-secondary text-sm">Installation methods and troubleshooting for Linux distributions.</p>
      </div>

      {/* Installation Methods */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-white">Installation Methods</h3>

        {/* AppImage */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">package</span>
            <h4 className="font-bold text-white">AppImage (Recommended)</h4>
          </div>
          <p className="text-secondary text-sm leading-relaxed">
            AppImage is self-contained and doesn't require installation or root privileges.
          </p>
          <div className="bg-black/35 p-4 rounded-xl font-mono text-xs text-white/80 space-y-2 overflow-x-auto">
            <div>{`wget https://github.com/hisham-pp/sky-movie/releases/download/v${latestVersion}/Sky-Movie-${latestVersion}-linux-x64.AppImage`}</div>
            <div>{`chmod +x Sky-Movie-${latestVersion}-linux-x64.AppImage`}</div>
            <div>{`./Sky-Movie-${latestVersion}-linux-x64.AppImage`}</div>
          </div>
        </div>

        {/* DEB */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">description</span>
            <h4 className="font-bold text-white">DEB Package (Ubuntu/Debian)</h4>
          </div>
          <p className="text-secondary text-sm leading-relaxed">
            Install via package manager for system integration.
          </p>
          <div className="bg-black/35 p-4 rounded-xl font-mono text-xs text-white/80 space-y-2 overflow-x-auto">
            <div>{`wget https://github.com/hisham-pp/sky-movie/releases/download/v${latestVersion}/Sky-Movie-${latestVersion}-linux-x64.deb`}</div>
            <div>{`sudo apt install ./Sky-Movie-${latestVersion}-linux-x64.deb`}</div>
          </div>
        </div>

        {/* tar.gz */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">folder_zip</span>
            <h4 className="font-bold text-white">tar.gz Archive</h4>
          </div>
          <p className="text-secondary text-sm leading-relaxed">
            Extract and run from any location.
          </p>
          <div className="bg-black/35 p-4 rounded-xl font-mono text-xs text-white/80 space-y-2 overflow-x-auto">
            <div>{`wget https://github.com/hisham-pp/sky-movie/releases/download/v${latestVersion}/Sky-Movie-${latestVersion}-linux-x64.tar.gz`}</div>
            <div>{`tar -xzf Sky-Movie-${latestVersion}-linux-x64.tar.gz`}</div>
            <div>cd sky-movie && ./sky-movie</div>
          </div>
        </div>
      </div>

      {/* GPG Verification */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-white">GPG Signature Verification</h3>
        <p className="text-secondary text-sm leading-relaxed">
          DEB packages are GPG-signed for authenticity. Verify the signature before installation:
        </p>
        <div className="bg-black/35 p-4 rounded-xl font-mono text-xs text-white/80 space-y-2 overflow-x-auto">
          <div># Install dpkg-sig</div>
          <div>sudo apt install dpkg-sig</div>
          <div></div>
          <div># Download the public key</div>
          <div>wget https://github.com/hisham-pp/sky-movie/raw/main/platfrom/public.key</div>
          <div></div>
          <div># Import the public key</div>
          <div>gpg --import public.key</div>
          <div></div>
          <div># Verify the package signature</div>
          <div>{`dpkg-sig --verify Sky-Movie-${latestVersion}-linux-x64.deb`}</div>
        </div>
        <div className="flex gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-sm leading-relaxed text-secondary">
          <span className="material-symbols-outlined text-emerald-400 flex-shrink-0">check_circle</span>
          <p>
            <strong>Valid signature:</strong> You should see <code className="bg-white/5 px-1 rounded text-white font-mono">GOODSIG</code> indicating the package was signed by the Sky Movie team.
          </p>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-white">Common Issues</h3>

        <div className="glass-panel p-5 rounded-2xl flex gap-4">
          <span className="material-symbols-outlined text-orange-400 flex-shrink-0">warning</span>
          <div>
            <h4 className="font-bold text-white mb-1">"Already Installed" Error</h4>
            <p className="text-secondary text-sm leading-relaxed">
              Remove existing installation: <code className="bg-white/5 px-1 rounded font-mono text-xs">sudo apt remove sky-movie</code> or <code className="bg-white/5 px-1 rounded font-mono text-xs">sudo dpkg -r sky-movie</code>
            </p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex gap-4">
          <span className="material-symbols-outlined text-orange-400 flex-shrink-0">warning</span>
          <div>
            <h4 className="font-bold text-white mb-1">"Unknown Publisher" Warning</h4>
            <p className="text-secondary text-sm leading-relaxed">
              This is normal for unsigned packages. Use AppImage to avoid this, or install with <code className="bg-white/5 px-1 rounded font-mono text-xs">sudo dpkg -i package.deb</code>
            </p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex gap-4">
          <span className="material-symbols-outlined text-orange-400 flex-shrink-0">warning</span>
          <div>
            <h4 className="font-bold text-white mb-1">Missing Dependencies</h4>
            <p className="text-secondary text-sm leading-relaxed">
              Fix with: <code className="bg-white/5 px-1 rounded font-mono text-xs">sudo apt-get install -f</code> after DEB installation
            </p>
          </div>
        </div>
      </div>

      {/* System Requirements */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">System Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-panel p-4 rounded-xl">
            <div className="text-xs text-white/40 uppercase mb-2">OS</div>
            <div className="text-white text-sm">Ubuntu 20.04+, Debian 11+, or compatible</div>
          </div>
          <div className="glass-panel p-4 rounded-xl">
            <div className="text-xs text-white/40 uppercase mb-2">Architecture</div>
            <div className="text-white text-sm">x64 (AMD64) or ARM64</div>
          </div>
        </div>
      </div>
    </section>
  );
}
