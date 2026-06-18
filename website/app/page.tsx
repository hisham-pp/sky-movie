'use client';

import { useState, useEffect, useRef } from 'react';

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

// Mock database structures
interface MediaFile {
  id: string;
  fileName: string;
  fileSize: string;
}

interface Movie {
  id: string;
  title: string;
  releaseYear: string;
  genre: string;
  description: string;
  favorite: boolean;
  quality: string;
  files: MediaFile[];
  subtitles: string[];
}

interface TvShow {
  id: string;
  title: string;
  firstAirYear: string;
  genre: string;
  description: string;
  favorite: boolean;
  quality: string;
  files: MediaFile[];
  subtitles: string[];
}

const mockMovies: Movie[] = [
  {
    id: "m1",
    title: "Interstellar",
    releaseYear: "2014",
    genre: "Sci-Fi",
    description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    favorite: true,
    quality: "4K",
    files: [
      { id: "f1", fileName: "Interstellar.2014.2160p.HDR.mkv", fileSize: "18.4 GB" },
      { id: "f2", fileName: "Interstellar.2014.1080p.mkv", fileSize: "4.8 GB" }
    ],
    subtitles: [
      "We used to look up at the sky and wonder at our place in the stars...",
      "Now we just look down and worry about our place in the dirt.",
      "Do not go gentle into that good night.",
      "Love is the one thing we're capable of perceiving that transcends dimensions of time and space."
    ]
  },
  {
    id: "m2",
    title: "Dune: Part Two",
    releaseYear: "2024",
    genre: "Sci-Fi",
    description: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    favorite: true,
    quality: "4K",
    files: [
      { id: "f3", fileName: "Dune.Part.Two.2024.2160p.HDR.mkv", fileSize: "14.2 GB" }
    ],
    subtitles: [
      "No one can stand against the coming storm.",
      "We must lead them to the southern hills.",
      "The power to destroy a thing is the absolute control over it.",
      "Long live the fighters!"
    ]
  },
  {
    id: "m3",
    title: "Blade Runner 2049",
    releaseYear: "2017",
    genre: "Sci-Fi",
    description: "A new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what's left of society into chaos.",
    favorite: false,
    quality: "1080p",
    files: [
      { id: "f4", fileName: "Blade.Runner.2049.1080p.mkv", fileSize: "8.6 GB" }
    ],
    subtitles: [
      "I have a job to do.",
      "You've never seen a miracle.",
      "All the best memories are hers.",
      "Dying for the right cause is the most human thing we can do."
    ]
  },
  {
    id: "m4",
    title: "Inception",
    releaseYear: "2010",
    genre: "Action",
    description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    favorite: false,
    quality: "1080p",
    files: [
      { id: "f5", fileName: "Inception.2010.1080p.BluRay.mp4", fileSize: "6.2 GB" }
    ],
    subtitles: [
      "We need to go deeper.",
      "An idea is like a virus. Resilient. Highly contagious.",
      "The dream has become their reality.",
      "Do you want to take a leap of faith or become an old man, filled with regret?"
    ]
  }
];

const mockShows: TvShow[] = [
  {
    id: "s1",
    title: "Stranger Things",
    firstAirYear: "2016",
    genre: "Drama",
    description: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
    favorite: true,
    quality: "HD",
    files: [
      { id: "f6", fileName: "Stranger.Things.S01E01.1080p.mkv", fileSize: "1.2 GB" },
      { id: "f7", fileName: "Stranger.Things.S01E02.1080p.mkv", fileSize: "1.1 GB" },
      { id: "f8", fileName: "Stranger.Things.S01E03.1080p.mkv", fileSize: "1.3 GB" }
    ],
    subtitles: [
      "Something is coming... it's near.",
      "Friends don't lie.",
      "Mornings are for coffee and contemplation."
    ]
  },
  {
    id: "s2",
    title: "Severance",
    firstAirYear: "2022",
    genre: "Drama",
    description: "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.",
    favorite: true,
    quality: "HD",
    files: [
      { id: "f9", fileName: "Severance.S01E01.1080p.mkv", fileSize: "1.1 GB" }
    ],
    subtitles: [
      "Please ask yourself the first of the five questions.",
      "Who are you?",
      "My innie is not me.",
      "The work is mysterious and important."
    ]
  }
];

export default function Home() {
  // Timeline Active Step (Step 0, 1, 2)
  const [activeStep, setActiveStep] = useState(0);

  // Simulator states
  const [viewMode, setViewMode] = useState<'movies' | 'shows' | 'settings'>('movies');
  const [selectedScanFolder, setSelectedScanFolder] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'complete'>('idle');
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  
  // Library databases
  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<TvShow[]>([]);
  const [selectedItem, setSelectedItem] = useState<Movie | TvShow | null>(null);
  
  // Settings Panel Config
  const [scanModeSetting, setScanModeSetting] = useState<'mixed' | 'movie' | 'show'>('mixed');
  const [matcherStrategySetting, setMatcherStrategySetting] = useState<string>('auto');
  const [extractMetadataSetting, setExtractMetadataSetting] = useState(true);

  // Mock Video Player States
  const [playingFile, setPlayingFile] = useState<MediaFile | null>(null);
  const [playerIsPlaying, setPlayerIsPlaying] = useState(true);
  const [playerProgress, setPlayerProgress] = useState(35);
  const [playerSeconds, setPlayerSeconds] = useState(1260); // 21 minutes
  const subtitleInterval = useRef<NodeJS.Timeout | null>(null);

  // Quick stats summary
  const movieCount = movies.length;
  const showCount = shows.length;
  const fileCount = movies.reduce((acc, m) => acc + m.files.length, 0) + shows.reduce((acc, s) => acc + s.files.length, 0);

  // Handles interactive step change and synchronizes simulator state
  const handleStepClick = (stepIndex: number) => {
    setActiveStep(stepIndex);
    if (stepIndex === 0) {
      // Choose library folder step: reset scan but keep layout on Movies
      setViewMode('movies');
      setScanState('idle');
      setSelectedScanFolder(null);
      setMovies([]);
      setShows([]);
      setSelectedItem(null);
      setPlayingFile(null);
    } else if (stepIndex === 1) {
      // Build local catalog step: select mock folder and execute scan
      setViewMode('movies');
      setSelectedScanFolder('D:\\Media\\Library');
      executeSimulatedScan('D:\\Media\\Library');
      setPlayingFile(null);
    } else if (stepIndex === 2) {
      // Play, sync step: populate library, open a movie player simulator
      setViewMode('movies');
      setSelectedScanFolder('D:\\Media\\Library');
      setMovies(mockMovies);
      setShows(mockShows);
      setScanState('complete');
      setSelectedItem(mockMovies[0]);
      setPlayingFile(mockMovies[0].files[0]);
    }
  };

  // Run the mock scanning console logs
  const executeSimulatedScan = (folderPath: string) => {
    setIsScanning(true);
    setScanState('scanning');
    setScanLogs(['Initializing local SQLite scanner...']);
    setMovies([]);
    setShows([]);
    setSelectedItem(null);

    const logSequence = [
      `Scanning directory: ${folderPath}...`,
      'Loading filename matcher configurations...',
      'Found file: Dune.Part.Two.2024.2160p.HDR.mkv',
      'Matching TMDB database... Matches Dune: Part Two (2024)',
      'Found file: Interstellar.2014.2160p.mkv',
      'Matching TMDB database... Matches Interstellar (2014)',
      'Found file: Stranger.Things.S01E01.mkv',
      'Matching TMDB database... Matches Stranger Things (TV Show)',
      'Extracting local audio/video stream parameters...',
      'Database updated. Synchronized 4 movies, 2 TV shows, 8 files.',
      'Scan successful! Local SQLite catalog ready.'
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logSequence.length) {
        setScanLogs(prev => [logSequence[currentLogIndex], ...prev]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setIsScanning(false);
        setScanState('complete');
        setMovies(mockMovies);
        setShows(mockShows);
        setSelectedItem(mockMovies[0]);
      }
    }, 250);
  };

  // Triggers mock folder selection
  const selectMockFolder = (folderName: string) => {
    setSelectedScanFolder(folderName);
    setShowFolderDropdown(false);
    executeSimulatedScan(folderName);
  };

  // Handles item selection
  const handleItemSelect = (item: Movie | TvShow) => {
    setSelectedItem(item);
  };

  // Clear local SQLite databases
  const handleClearLocalData = () => {
    setMovies([]);
    setShows([]);
    setSelectedScanFolder(null);
    setScanState('idle');
    setSelectedItem(null);
    setPlayingFile(null);
    setScanLogs([]);
    alert("Local SQLite storage has been cleared. Mock database reset!");
  };

  // Loop simulation progress on active playing media
  useEffect(() => {
    if (playingFile && playerIsPlaying) {
      subtitleInterval.current = setInterval(() => {
        setPlayerSeconds(prev => {
          const next = prev + 5;
          const pct = Math.floor((next / 8400) * 100);
          setPlayerProgress(pct >= 100 ? 0 : pct);
          return next >= 8400 ? 0 : next;
        });
      }, 1000);
    } else {
      if (subtitleInterval.current) {
        clearInterval(subtitleInterval.current);
      }
    }
    return () => {
      if (subtitleInterval.current) {
        clearInterval(subtitleInterval.current);
      }
    };
  }, [playingFile, playerIsPlaying]);

  // Formats playing time
  const formatPlaybackTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filters list on search input
  const filteredMovies = movies.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredShows = shows.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Active item's subtitles array resolver
  const activeSubtitles = selectedItem ? selectedItem.subtitles : ["No subtitles available."];
  const currentSubtitle = activeSubtitles[Math.floor(playerSeconds / 12) % activeSubtitles.length];

  return (
    <>
      <header className="site-header">
        <div className="nav-wrap">
          <a className="brand" href="#top" aria-label="Sky Movie home">
            <span className="brand-mark" aria-hidden="true">
              <span className="logo-crescent" />
              <span className="logo-play" />
            </span>
            <span>Sky Movie</span>
          </a>
          <nav className="nav-links" aria-label="Main navigation">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a className="github-pill" href={repoUrl} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-label="Sky Movie">
          <div className="hero-content">
            <div className="hero-grid">
              <div className="hero-copy-block">
                <div className="hero-logo" aria-hidden="true">
                  <span className="brand-mark large">
                    <span className="logo-crescent" />
                    <span className="logo-play" />
                  </span>
                </div>
                <p className="eyebrow">Local-first desktop library</p>
                <h1>Sky Movie</h1>
                <p className="hero-copy">
                  A private movie and TV library manager for scanning local
                  folders, organizing metadata, playing media, keeping progress,
                  and carrying your collection between drives without a backend
                  account.
                </p>
                <div className="hero-actions" aria-label="Primary actions">
                  <a className="button primary" href={repoUrl} target="_blank" rel="noopener noreferrer">
                    View repository
                  </a>
                  <a className="button secondary" href="#features">
                    Explore features
                  </a>
                </div>
              </div>

              {/* HIGH FIDELITY INTERACTIVE DESKTOP SIMULATOR */}
              <div className="hero-showcase" aria-hidden="true">
                <div className="app-window">
                  {/* Title Bar */}
                  <div className="window-bar">
                    <span />
                    <span />
                    <span />
                    <div style={{ flex: 1, textAlign: 'center', fontSize: 10, opacity: 0.5, fontWeight: 500, marginRight: 42 }}>
                      Sky Movie Desktop (Simulated)
                    </div>
                  </div>

                  {/* Desktop Toolbar */}
                  <div className="window-toolbar">
                    <div className="mock-search">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input 
                        type="text" 
                        placeholder="Search library..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={viewMode === 'settings'}
                      />
                    </div>
                    <div className="mock-controls">
                      <div style={{ position: 'relative' }}>
                        <button className="mock-btn" onClick={() => setShowFolderDropdown(!showFolderDropdown)} disabled={isScanning}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          </svg>
                          <span>Folder</span>
                        </button>
                        {showFolderDropdown && (
                          <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#0e1518',
                            border: '1px solid var(--line)', borderRadius: 8, padding: 4, zIndex: 10, minWidth: 160,
                            boxShadow: '0 8px 20px rgba(0,0,0,0.5)'
                          }}>
                            <button className="mock-btn" style={{ width: '100%', border: 'none', justifyContent: 'flex-start' }} onClick={() => selectMockFolder('D:\\Media\\Movies')}>D:\Media\Movies</button>
                            <button className="mock-btn" style={{ width: '100%', border: 'none', justifyContent: 'flex-start' }} onClick={() => selectMockFolder('E:\\Videos\\Films')}>E:\Videos\Films</button>
                            <button className="mock-btn" style={{ width: '100%', border: 'none', justifyContent: 'flex-start' }} onClick={() => selectMockFolder('Z:\\NAS\\Media')}>Z:\NAS\Media</button>
                          </div>
                        )}
                      </div>

                      <span style={{ fontSize: 9, opacity: 0.6, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedScanFolder ? selectedScanFolder.split('\\').pop() : 'No path'}
                      </span>

                      <button 
                        className="mock-btn primary-btn" 
                        onClick={() => executeSimulatedScan(selectedScanFolder || 'D:\\Media\\Movies')}
                        disabled={isScanning}
                      >
                        {isScanning ? (
                          <svg className="spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                            <path d="M11 8v6M8 11h6" />
                          </svg>
                        )}
                        <span>Scan</span>
                      </button>
                    </div>
                  </div>

                  {/* Window Workspace */}
                  <div className="window-body">
                    {/* Navigation Sidebar */}
                    <div className="window-sidebar">
                      <button className={`nav-pill ${viewMode === 'movies' ? 'active' : ''}`} onClick={() => setViewMode('movies')} title="Movies">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                          <line x1="7" y1="2" x2="7" y2="22" />
                          <line x1="17" y1="2" x2="17" y2="22" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <line x1="2" y1="7" x2="7" y2="7" />
                          <line x1="2" y1="17" x2="7" y2="17" />
                          <line x1="17" y1="17" x2="22" y2="17" />
                          <line x1="17" y1="7" x2="22" y2="7" />
                        </svg>
                      </button>
                      <button className={`nav-pill ${viewMode === 'shows' ? 'active' : ''}`} onClick={() => setViewMode('shows')} title="TV Shows">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                          <polyline points="17 2 12 7 7 2" />
                        </svg>
                      </button>
                      <button className={`nav-pill ${viewMode === 'settings' ? 'active' : ''}`} onClick={() => setViewMode('settings')} title="Settings">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                      </button>

                      {/* Statistics Indicators */}
                      <div className="sidebar-metrics">
                        <div className="metric-box">
                          <strong>{movieCount}</strong>
                          <span>Movies</span>
                        </div>
                        <div className="metric-box">
                          <strong>{showCount}</strong>
                          <span>Shows</span>
                        </div>
                      </div>
                    </div>

                    {/* Window Main Panels */}
                    <div className="window-main">
                      {viewMode === 'settings' ? (
                        /* Simulated Settings Panel */
                        <div className="mock-settings-panel">
                          <div className="mock-settings-group">
                            <h4>Library Scanner</h4>
                            <label>
                              Scan mode
                              <select className="mock-select" value={scanModeSetting} onChange={e => setScanModeSetting(e.target.value as any)}>
                                <option value="mixed">Mixed catalog</option>
                                <option value="movie">Movies only</option>
                                <option value="show">TV shows only</option>
                              </select>
                            </label>
                            <label>
                              Matcher strategy
                              <select className="mock-select" value={matcherStrategySetting} onChange={e => setMatcherStrategySetting(e.target.value)}>
                                <option value="auto">Auto match finder</option>
                                <option value="movie-title-year">Movie Title + Year</option>
                                <option value="show-season-episode">Show SxxEyy</option>
                              </select>
                            </label>
                            <label className="mock-toggle">
                              <input type="checkbox" checked={extractMetadataSetting} onChange={e => setExtractMetadataSetting(e.target.checked)} />
                              <span>Store movie file metadata</span>
                            </label>
                          </div>

                          <div className="mock-settings-group" style={{ borderLeftColor: 'var(--coral)' }}>
                            <h4 style={{ color: 'var(--coral)' }}>Local Database</h4>
                            <div className="mock-settings-actions">
                              <button className="mock-btn" style={{ width: '100%', borderColor: 'rgba(255,107,74,0.3)', color: 'var(--coral)' }} onClick={handleClearLocalData}>
                                Clear local library catalog
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Simulated Catalog Grid */
                        <div>
                          {scanState === 'idle' ? (
                            <div style={{ display: 'grid', placeItems: 'center', height: 200, color: 'var(--muted)', textAlign: 'center', padding: 20 }}>
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: 8, opacity: 0.5 }}>
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                              </svg>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>SQLite Library Empty</div>
                              <div style={{ fontSize: 9, marginTop: 4 }}>Select a catalog folder path and click &quot;Scan&quot; to index your local storage.</div>
                            </div>
                          ) : scanState === 'scanning' ? (
                            <div style={{ display: 'grid', placeItems: 'center', height: 200, color: 'var(--teal)', textAlign: 'center' }}>
                              <svg className="spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginBottom: 8 }}>
                                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                              </svg>
                              <div style={{ fontSize: 11, fontWeight: 700 }}>Reading files...</div>
                            </div>
                          ) : (
                            /* Scanned library grid */
                            <div>
                              {/* Hero continue watching strip */}
                              {selectedItem && (
                                <div className="mock-hero-banner">
                                  <div>
                                    <p style={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 8, color: 'var(--teal)' }}>Selected item</p>
                                    <h4>{selectedItem.title}</h4>
                                    <p>{selectedItem.files.length} files available in catalog</p>
                                  </div>
                                  <div className="mock-hero-player" onClick={() => setPlayingFile(selectedItem.files[0])} style={{ cursor: 'pointer' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: 'var(--teal)' }}>
                                      <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                  </div>
                                </div>
                              )}

                              <div className="mock-section-title">
                                <h3>{viewMode === 'movies' ? 'Indexed Movies' : 'TV Collections'}</h3>
                                <span>{viewMode === 'movies' ? filteredMovies.length : filteredShows.length} titles</span>
                              </div>

                              <div className="poster-wall">
                                {viewMode === 'movies' ? (
                                  filteredMovies.map(movie => (
                                    <button key={movie.id} className="mock-tile" onClick={() => handleItemSelect(movie)}>
                                      <div className="mock-poster-box" style={{
                                        background: movie.id === selectedItem?.id
                                          ? 'linear-gradient(135deg, rgba(13,242,201,0.2) 0%, rgba(255,107,74,0.1) 100%), #0d1214'
                                          : 'rgba(255,255,255,0.02)',
                                        borderColor: movie.id === selectedItem?.id ? 'var(--teal)' : 'rgba(255,255,255,0.08)'
                                      }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={movie.id === selectedItem?.id ? 'var(--teal)' : 'var(--muted)'} strokeWidth="2">
                                          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                                          <line x1="7" y1="2" x2="7" y2="22" />
                                          <line x1="17" y1="2" x2="17" y2="22" />
                                          <line x1="2" y1="12" x2="22" y2="12" />
                                        </svg>
                                        <span className="quality-badge">{movie.quality}</span>
                                        {movie.favorite && (
                                          <svg className="star-fav" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                          </svg>
                                        )}
                                      </div>
                                      <strong>{movie.title}</strong>
                                      <span>{movie.releaseYear}</span>
                                    </button>
                                  ))
                                ) : (
                                  filteredShows.map(show => (
                                    <button key={show.id} className="mock-tile" onClick={() => handleItemSelect(show)}>
                                      <div className="mock-poster-box" style={{
                                        background: show.id === selectedItem?.id
                                          ? 'linear-gradient(135deg, rgba(13,242,201,0.2) 0%, rgba(255,107,74,0.1) 100%), #0d1214'
                                          : 'rgba(255,255,255,0.02)',
                                        borderColor: show.id === selectedItem?.id ? 'var(--teal)' : 'rgba(255,255,255,0.08)'
                                      }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={show.id === selectedItem?.id ? 'var(--teal)' : 'var(--muted)'} strokeWidth="2">
                                          <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                                          <polyline points="17 2 12 7 7 2" />
                                        </svg>
                                        <span className="quality-badge">{show.quality}</span>
                                        {show.favorite && (
                                          <svg className="star-fav" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                          </svg>
                                        )}
                                      </div>
                                      <strong>{show.title}</strong>
                                      <span>{show.firstAirYear}</span>
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Window Right Details Panel */}
                    <div className="now-playing">
                      {selectedItem && scanState === 'complete' && viewMode !== 'settings' ? (
                        <>
                          <div>
                            <h3>{selectedItem.title}</h3>
                            <span className="file-count">{selectedItem.files.length} indexed files</span>
                          </div>

                          <div className="player-box" onClick={() => setPlayingFile(selectedItem.files[0])}>
                            <div className="play-btn">
                              <svg className="play-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                            </div>
                          </div>

                          <p className="mock-desc">{selectedItem.description}</p>

                          <div className="mock-file-list">
                            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>Index mapping</span>
                            {selectedItem.files.map(file => (
                              <button key={file.id} className="mock-file-item" onClick={() => setPlayingFile(file)}>
                                <span>{file.fileName}</span>
                                <small>{file.fileSize}</small>
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--muted)', textAlign: 'center', fontSize: 10 }}>
                          No item selected
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terminal CLI Status Bar when scanning */}
                  {scanState === 'scanning' && scanLogs.length > 0 && (
                    <div className="scan-console">
                      {scanLogs.map((log, index) => (
                        <div key={index} style={{ marginBottom: 2 }}>{log}</div>
                      ))}
                    </div>
                  )}

                  {/* Window Bottom Status Bar */}
                  <div className="mock-statusbar">
                    <span>
                      <span className="pulse-dot" style={{ backgroundColor: scanState === 'scanning' ? 'var(--coral)' : 'var(--teal)' }} />
                      {scanState === 'scanning' ? 'Running metadata parser...' : scanState === 'complete' ? 'Catalog synchronized' : 'Scanner idle'}
                    </span>
                    <span>SQLite active</span>
                  </div>

                  {/* OVERLAY PLAYBACK PLAYER SIMULATOR */}
                  {playingFile && (
                    <div className="player-overlay">
                      {/* Player Top Nav */}
                      <div className="player-overlay-header">
                        <h4>Now Playing: {playingFile.fileName}</h4>
                        <button className="player-icon-btn" onClick={() => setPlayingFile(null)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>

                      {/* Player Screen Area */}
                      <div className="player-screen">
                        {/* Animated Nebula background */}
                        <div className="player-nebula" />
                        <div className="player-cosmic-glow" style={{ animationPlayState: playerIsPlaying ? 'running' : 'paused' }} />

                        {/* Simulated scrolling subtitles */}
                        {playerIsPlaying && (
                          <div className="player-subtitles">
                            {currentSubtitle}
                          </div>
                        )}
                      </div>

                      {/* Player Controls Bar */}
                      <div className="player-overlay-controls">
                        {/* Timeline */}
                        <div className="player-timeline-bar" onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const pct = Math.floor((clickX / rect.width) * 100);
                          setPlayerProgress(pct);
                          setPlayerSeconds(Math.floor((pct / 100) * 8400));
                        }}>
                          <div className="player-timeline-progress" style={{ width: `${playerProgress}%` }} />
                        </div>

                        {/* Controls Row */}
                        <div className="player-controls-row">
                          <div className="player-controls-left">
                            <button className="player-icon-btn" onClick={() => setPlayerIsPlaying(!playerIsPlaying)}>
                              {playerIsPlaying ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                  <rect x="6" y="4" width="4" height="16" />
                                  <rect x="14" y="4" width="4" height="16" />
                                </svg>
                              ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                              )}
                            </button>
                            <span className="player-time-display">
                              {formatPlaybackTime(playerSeconds)} / {formatPlaybackTime(8400)}
                            </span>
                          </div>

                          <div className="player-controls-right">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                            <div className="player-volume-slider">
                              <div className="player-volume-level" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ambient UI graphics */}
                <div className="floating-card sync-card">
                  <strong>Sync ready</strong>
                  <span>NAS folder detected</span>
                </div>
                <div className="floating-card scan-card">
                  <strong>SQLite Active</strong>
                  <span>File metadata scanned</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Highlights Bar */}
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

        {/* Features section */}
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

        {/* Interactive workflow timeline section */}
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

              {/* INTERACTIVE TIMELINE */}
              <ol className="timeline">
                {steps.map((step, index) => (
                  <li 
                    key={step.title} 
                    className={activeStep === index ? 'active-step' : ''}
                    onClick={() => handleStepClick(index)}
                  >
                    <strong>{step.title}</strong>
                    {step.text}
                  </li>
                ))}
              </ol>
            </div>

            {/* SYNCED MOCK DISPLAY */}
            <div className="process-visual" aria-label="Abstract Sky Movie app interface">
              <div className="process-bar">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
              <div className="process-body">
                <div className="process-side">
                  <span className={`process-line ${activeStep >= 0 ? 'active' : ''}`} />
                  <span className={`process-line ${activeStep >= 1 ? 'active' : ''}`} />
                  <span className={`process-line ${activeStep >= 2 ? 'active' : ''}`} />
                  <span className="process-line" />
                </div>
                <div className="process-main">
                  <div className="poster" style={{ opacity: activeStep >= 1 ? 1 : 0.25, transform: activeStep >= 1 ? 'none' : 'scale(0.95)' }}>
                    <span />
                    <span />
                  </div>
                  <div className="poster" style={{ opacity: activeStep >= 1 ? 1 : 0.25, transform: activeStep >= 1 ? 'none' : 'scale(0.95)' }}>
                    <span />
                    <span />
                  </div>
                  <div className="poster" style={{ opacity: activeStep >= 1 ? 1 : 0.25, transform: activeStep >= 1 ? 'none' : 'scale(0.95)' }}>
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Git Repo Panel */}
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
                <a className="button primary" href={repoUrl} target="_blank" rel="noopener noreferrer">
                  Open GitHub
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 8 }}>
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </a>
                <a
                  className="button light"
                  href={`${repoUrl}/archive/refs/heads/main.zip`}
                >
                  Download ZIP
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 8 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="section-inner footer-row">
          <span>Sky Movie</span>
          <a href={repoUrl} target="_blank" rel="noopener noreferrer">github.com/hisham-pp/sky-movie</a>
        </div>
      </footer>
    </>
  );
}
