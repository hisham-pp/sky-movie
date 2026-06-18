const repoUrl = "https://github.com/hisham-pp/sky-movie";

const highlights = [
  {
    label: "Local",
    text: "SQLite storage, app-data cache, backups, and exports stay on the device."
  },
  {
    label: "Private",
    text: "No account system, backend API, or cloud dependency in the MVP."
  },
  {
    label: "Playable",
    text: "Secure Electron media URLs hand files into the built-in player."
  },
  {
    label: "Portable",
    text: "Folder sync supports metadata, watch progress, posters, subtitles, and files."
  }
];

const features = [
  {
    title: "Scan and match",
    icon: "scan",
    text: "Add mixed, movie-only, or TV-only folders, then parse filenames, folder names, years, seasons, episodes, and file metadata into a local catalog."
  },
  {
    title: "Watch locally",
    icon: "watch",
    text: "Electron keeps filesystem access in the main process and gives the renderer a private media URL for playback and progress updates."
  },
  {
    title: "Sync and restore",
    icon: "sync",
    text: "Export metadata, create backups, and sync collections to local folders, external drives, NAS storage, or mounted cloud folders."
  }
];

const steps = [
  {
    title: "Choose a library folder",
    text: "Select how the scan should interpret movies, TV shows, and mixed media."
  },
  {
    title: "Build the local catalog",
    text: "Store file mappings, matches, tags, collections, history, and settings in SQLite."
  },
  {
    title: "Play, backup, and carry forward",
    text: "Watch locally, save progress, export data, and sync to folder-based destinations."
  }
];

export default function Home() {
  return (
    <>
      <header className="site-header">
        <div className="nav-wrap">
          <a className="brand" href="#top" aria-label="Sky Movie home">
            <span className="brand-mark" aria-hidden="true" />
            <span>Sky Movie</span>
          </a>
          <nav className="nav-links" aria-label="Main navigation">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a className="github-pill" href="#repo">
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-label="Sky Movie">
          <div className="hero-content">
            <p className="eyebrow">Local-first desktop library</p>
            <h1>Sky Movie</h1>
            <p className="hero-copy">
              A private movie and TV library manager for scanning local folders,
              organizing metadata, playing media, keeping progress, and carrying
              your collection between drives without a backend account.
            </p>
            <div className="hero-actions" aria-label="Primary actions">
              <a className="button primary" href={repoUrl}>
                View repository
              </a>
              <a className="button secondary" href="#features">
                Explore features
              </a>
            </div>
          </div>
        </section>

        <section className="proof-strip" aria-label="Project highlights">
          <div className="section-inner">
            <div className="proof-grid">
              {highlights.map((item) => (
                <div className="proof-item" key={item.label}>
                  <strong>{item.label}</strong>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="section">
          <div className="section-inner">
            <div className="section-heading">
              <h2>Built for personal collections that live on real disks.</h2>
              <p>
                Sky Movie focuses on the desktop basics first: reliable folder
                scans, clean browsing, local playback, and data that can be
                backed up or moved without asking a remote service for
                permission.
              </p>
            </div>

            <div className="feature-grid">
              {features.map((feature) => (
                <article className="feature-card" key={feature.title}>
                  <div className="feature-top">
                    <span
                      className={`feature-icon ${feature.icon}`}
                      aria-hidden="true"
                    />
                    <h3>{feature.title}</h3>
                  </div>
                  <p>{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="section alt">
          <div className="section-inner workflow">
            <div>
              <div className="section-heading">
                <h2>A desktop MVP with clear boundaries.</h2>
                <p>
                  The renderer stays isolated. The Electron main process owns
                  scanning, SQLite, metadata, media handoff, cleanup, import,
                  export, and sync.
                </p>
              </div>

              <ol className="timeline">
                {steps.map((step) => (
                  <li key={step.title}>
                    <strong>{step.title}</strong>
                    {step.text}
                  </li>
                ))}
              </ol>
            </div>

            <div className="process-visual" aria-label="Abstract Sky Movie app interface">
              <div className="process-bar">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
              <div className="process-body">
                <div className="process-side">
                  <span className="process-line active" />
                  <span className="process-line" />
                  <span className="process-line" />
                  <span className="process-line" />
                </div>
                <div className="process-main">
                  <div className="poster">
                    <span />
                    <span />
                  </div>
                  <div className="poster">
                    <span />
                    <span />
                  </div>
                  <div className="poster">
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="repo" className="section">
          <div className="section-inner">
            <div className="repo-panel">
              <div>
                <h2>Git repository</h2>
                <p>
                  Follow the source, desktop app scaffold, docs, sync format,
                  and future website work in the Sky Movie repository.
                </p>
              </div>
              <div className="repo-actions">
                <a className="button primary" href={repoUrl}>
                  Open GitHub
                </a>
                <a
                  className="button light"
                  href={`${repoUrl}/archive/refs/heads/main.zip`}
                >
                  Download ZIP
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="section-inner footer-row">
          <span>Sky Movie</span>
          <a href={repoUrl}>github.com/hisham-pp/sky-movie</a>
        </div>
      </footer>
    </>
  );
}
