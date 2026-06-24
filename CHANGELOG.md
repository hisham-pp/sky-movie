# Changelog

All notable changes to Sky Movie will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.2] - 2026-06-24

### Added

- implement MKV streaming support via bundled FFmpeg, streaming server, and comprehensive documentation (Hisham)
- implement adaptive buffering and streaming strategies (Hisham)

### Other

- chore(release): publish Sky Movie 0.4.1 downloads from GitHub (Hisham)

## [0.4.1] - 2026-06-21

### Added

- enhance video and audio codec support with hardware acceleration (Hisham)

### Fixed

- move hardware acceleration setup before app ready and improve audio handling (Hisham)

### Other

- style(modal): enhance backdrop blur and reduce modal width constraints (Hisham)
- refactor(playlist): move edit modal into detail page and fix routing (Hisham)
- refactor(playlist): extract modals to use common Modal components (Hisham)
- refactor(components): extract common Button and Modal components (Hisham)
- chore(version-bump): auto-push releases.json after GitHub release (Hisham)
- refactor(version-bump): switch to GitHub API for version checking (Hisham)
- chore(release): publish Sky Movie 0.4.0 downloads from GitHub (Hisham)

## [0.4.0] - 2026-06-21

### Added

- add backdrop collage and poster grid to playlist detail page (Hisham)
- add item reordering and improve playlist management UI (Hisham)
- add ignore/unignore toggle and improve file navigation (Hisham)
- add year extraction and filtering to metadata search (Hisham)
- refactor hero banner layout and toolbar styling for improved responsive design (Hisham)
- implement browse TV shows page with auto-rotating banner hero and responsive grid layout (Hisham)
- implement video player component with Artplayer, progress tracking, and track selection (Hisham)
- implement library module with browse views and media display components (Hisham)
- add UnrecognizedDrawer component for manual media metadata matching and file management (Hisham)
- implement video playback component using Artplayer with progress tracking and custom styling (Hisham)
- implement SettingsPanel component with library, metadata, and theme management configurations (Hisham)
- implement browse library page with dynamic header and media grid views (Hisham)
- implement LibraryScanner service for automated file discovery, metadata parsing, and database synchronization (Hisham)
- add BrowseLibraryPage component and implement libraryScanner service for local media discovery (Hisham)
- implement library navigation and playlist management UI components (Hisham)
- initialize electron-builder configuration and packaging scripts for desktop app distribution (Hisham)
- implement persistent routing with session history and centralized library navigation view (Hisham)
- implement persistent router history and global keyboard navigation shortcuts in the renderer application (Hisham)
- implement application routing, layout, and view structure for the desktop renderer (Hisham)
- initialize desktop-app renderer with routing, hooks, and library controller logic (Hisham)
- configure electron-builder and add favicon assets for website and desktop app (Hisham)
- initialize SQLite database schema and implement Playlist management UI components (Hisham)
- implement library controller hook and UI components for media management (Hisham)
- implement playlist UI styles and initialize database schema for library management (Hisham)
- implement global keyboard shortcuts for navigation and application control (Hisham)
- implement preload script to expose SkyMovieApi via contextBridge (Hisham)
- implement playlist management system and integrate IPC handlers for CRUD and reordering operations (Hisham)
- implement App component with navigation, keyboard shortcuts, and library view management (Hisham)
- implement electron IPC layer and initial renderer UI for movie library management (Hisham)
- implement core IPC handlers and service wiring for library management, metadata, and media playback (Hisham)
- add automated version bumping and release script (Hisham)

### Fixed

- disable autoplay by default in PlayerPanel component (Hisham)

### Other

- style(playlist): improve spacing and layout hierarchy in playlist content (Hisham)
- style(layout,library): enhance toolbar, search, and hero section styling with improved visual hierarchy (Hisham)
- style(layout,library): adjust toolbar positioning and hero section dimensions (Hisham)
- chore(release): publish Sky Movie 0.3.1 downloads from GitHub (Hisham)

## [0.3.1] - 2026-06-20

### Added

- implement UpdateService to handle periodic version checking, download, and installation for desktop app (Hisham)
- add automated version bumping, changelog generation, and release script (Hisham)

### Other

- chore(release): publish Sky Movie 0.3.0 downloads from GitHub (Hisham)

## [0.3.0] - 2026-06-20

### Added

- implement IPC communication layer and backend services for library management and app updates (Hisham)
- implement IPC definitions and update service for desktop application architecture (Hisham)
- implement library scanning service to index video files and synchronize media metadata with the database (Hisham)
- implement database pruning utility, library scanning services, and media detail page styling (Hisham)
- add application layout styles and initialize React renderer entry point (Hisham)
- remove placeholder navigation buttons (Hisham)
- persist sidebar navigation path in localStorage (Hisham)
- support creating new movies/shows from unmatched files and fix type errors (Hisham)
- add unrecognized files drawer with TMDB matching workflow (Hisham)
- make toolbar transparent with backdrop blur (Hisham)

### Changed

- split styles into organized CSS files (Hisham)

### Fixed

- add missing API methods to preload and fix posterUrl property (Hisham)

### Other

- style: reduce width of unrecognized drawer and search modal (Hisham)
- style(toolbar): remove poster-first library badge (Hisham)
- docs(website): remove API Reference and Community Support cards from homepage (Hisham)
- chore(release): publish Sky Movie 0.2.1 downloads from GitHub (Hisham)

## [0.2.1] - 2026-06-20

### Added

- add search modal with Ctrl+K shortcut and movie/show listing (Hisham)
- remove title text from header toolbar (Hisham)
- make toolbar header transparent (Hisham)
- remove title and badge from toolbar header (Hisham)
- reduce sidebar width from 280px to 220px (Hisham)
- add beta version detection and badge display (Hisham)
- dynamically load releases from manifest and display in landing page (Hisham)
- add client-side whats-new page with release history (Hisham)

### Changed

- disable TypeScript auto-closing tags in VSCode (Hisham)

### Other

- Update What's New page styling with modern glass-panel design (Hisham)
- docs: add code signing guide and update build configuration (Hisham)
- chore(release): publish Sky Movie 0.2.0 downloads from GitHub (Hisham)

## [0.2.0] - 2026-06-20

### Added

- add 6 new theme options (Hisham)
- redesign scan page with modern UI (Hisham)
- add rotating banner and episode play buttons (Hisham)
- improve card navigation - add view details button (Hisham)
- auto-load first file and clear player on navigation (Hisham)
- add design system and Tailwind configuration (Hisham)

### Other

- chore(release): publish Sky Movie 0.1.6 downloads from GitHub (Hisham)

## [0.1.6] - 2026-06-20

### Other

- chore(version-bump): reorder git operations and include author in changelog (Hisham)

## [0.1.5] - 2026-06-20

### Fixed

- remove duplicate closing brace syntax error

### Other

- chore(version-bump): add confirmation prompt and automate git operations
- chore(version-bump): automate changelog generation from git commits
- chore(release): bump version to 0.1.4 and add changelog
- chore(release): publish Sky Movie 0.1.4 downloads from GitHub

## [0.1.4] - 2026-06-20

### Added
- Initial desktop application release
- Local-first SQLite database for movie and TV show library management
- Folder scanning with automatic metadata matching
- Built-in media player with progress tracking
- Support for Windows (x64, ARM64), macOS (x64, ARM64), and Linux (x64, ARM64)
- Multiple install formats: NSIS installer for Windows, DMG/ZIP for macOS, AppImage/DEB/tar.gz for Linux
- Dark theme UI with modern design
- GitHub Releases and Cloudflare R2 distribution support
- Automated build and release workflows via GitHub Actions

### Features
- Scan local folders for movies and TV shows
- Automatic filename parsing and TMDB metadata matching
- Play media files with built-in video player
- Track watch progress and history
- Organize library with favorites and collections
- Search and filter library content
- Settings panel for scan configuration
- Console-style scan logging

### Technical
- Electron-based desktop application
- React 19 with TypeScript
- Vite for fast development builds
- TailwindCSS for styling
- Better-SQLite3 for local database
- Secure IPC between main and renderer processes
- Cross-platform native module support

[0.1.4]: https://github.com/hisham-pp/sky-movie/releases/tag/v0.1.4
[0.1.5]: https://github.com/hisham-pp/sky-movie/releases/tag/v0.1.5
[0.1.6]: https://github.com/hisham-pp/sky-movie/releases/tag/v0.1.6
[0.2.0]: https://github.com/hisham-pp/sky-movie/releases/tag/v0.2.0
[0.2.1]: https://github.com/hisham-pp/sky-movie/releases/tag/v0.2.1
[0.3.0]: https://github.com/hisham-pp/sky-movie/releases/tag/v0.3.0
[0.3.1]: https://github.com/hisham-pp/sky-movie/releases/tag/v0.3.1
[0.4.0]: https://github.com/hisham-pp/sky-movie/releases/tag/v0.4.0
[0.4.1]: https://github.com/hisham-pp/sky-movie/releases/tag/v0.4.1
[0.4.2]: https://github.com/hisham-pp/sky-movie/releases/tag/v0.4.2
