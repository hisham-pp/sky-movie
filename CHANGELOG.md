# Changelog

All notable changes to Sky Movie will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
