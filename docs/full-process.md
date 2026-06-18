# Sky Movie Full Process

This document is the implementation plan for the Sky Movie MVP.

## 1. Repository Structure

```text
sky-movie/
  desktop-app/
  website/
  scripts/
  docs/
```

- `desktop-app/` contains the MVP Electron desktop application.
- `website/` is reserved for a future website or remote dashboard and is not part of the MVP runtime.
- `scripts/` is reserved for maintenance, database, packaging, import/export, and release helpers.
- `docs/` contains architecture, sync format, and product process notes.

## 2. Package Manager

Use `pnpm` for the workspace.

```powershell
pnpm install
pnpm dev
pnpm typecheck
pnpm build
```

The root workspace delegates app commands to `desktop-app/`.

## 3. MVP Architecture

The MVP is a local-first desktop app.

- No backend API/server.
- No remote API required for core library usage.
- No user accounts.
- No cloud sync in the MVP.
- The renderer never directly accesses the file system.
- The Electron main process owns file-system scanning, SQLite access, media streaming, import/export, sync, backups, and local cache cleanup.
- The preload script exposes a safe typed API through `contextBridge`.

## 4. Desktop App Stack

- Electron
- React
- TypeScript
- Vite
- TailwindCSS
- shadcn-style local UI primitives
- SQLite with `better-sqlite3`
- Drizzle schema definitions

## 5. Local App Data

Electron stores app data in the user data directory.

```text
database.sqlite
cache/
  images/
  posters/
  backdrops/
  subtitles/
backups/
exports/
```

SQLite stores the optimized local library data. JSON/JSONL is only used for import, export, backup, sync manifests, debug dumps, and portable metadata.

## 6. Database Scope

The database stores:

- Movies
- TV shows
- Seasons
- Episodes
- Media files
- Library folders
- Genres
- People, cast, and crew
- Watch progress
- Watch history
- Tags
- Collections
- Sync profiles
- Sync history
- App settings

## 7. Library Scan Process

The user selects a local folder from the app. The renderer asks the main process to scan it through IPC.

Scan options:

- Scan mode: `Mixed`, `Movies only`, or `TV shows only`.
- Finder strategy:
  - `Auto`
  - `Movie title + year`
  - `Show SxxExx`
  - `Folder name`
- File metadata extraction:
  - Enabled: store size, modified time, created time, resolution hints, codec hints, duration placeholder, audio-track hints, and subtitle-track hints.
  - Disabled: store only the minimum file mapping fields.

The scanner stores:

- Absolute path
- Relative path from library root
- File name
- Extension
- File size
- Modified time
- Created time
- Optional hash/checksum later
- Duration
- Resolution
- Codec
- Audio tracks
- Subtitle tracks
- Matched movie/show/episode ids
- Match confidence
- Match status

## 8. Movie and Show Matching

The scanner starts with local parsing and local database lookup.

Matching order:

1. Parse filename.
2. Detect movie title/year.
3. Detect TV season/episode.
4. Use folder-name strategy if selected.
5. Search local metadata cache first.
6. Later, optionally fetch from TMDB or another selected provider.
7. Store match confidence.
8. Allow manual correction later.
9. Allow bulk rematch later.

## 9. Player Process

The player follows a Seanime-style desktop pattern:

- Main process owns media access.
- Renderer receives a safe app-owned media URL.
- A private Electron protocol such as `sky-media://<mediaFileId>` streams local files into the embedded player.
- React renders a built-in video player surface.
- Watch progress is sent back to the main process through IPC.
- The renderer never receives unrestricted file-system access.

## 10. Settings and Local Data Cleanup

Settings include:

- Metadata provider
- Auto scan
- Watch folders
- Default sync includes files
- Default scan mode
- Default finder strategy
- File metadata extraction enabled/disabled

Maintenance settings include:

- Clear local library data.
- Clear cached posters, backdrops, subtitles, and image cache.
- Clear media mappings, metadata, watch progress, tags, collections, sync history, and app-created local records.
- Do not delete the user's original movie or TV video files.

Backup settings include:

- Download/export a single Sky Movie backup file.
- Restore/insert that backup file back into the local database.
- Include user settings, library folders, movie/show metadata, media mappings, watch progress, tags, collections, sync profiles, and sync history.
- Do not require a backend server for backup or restore.

## 11. Sync and Export Process

Sync is local-first and folder-based.

Supported MVP sync types:

- Full library sync
- Partial sync
- Filter-based sync
- Metadata-only sync
- File sync
- Watch-progress sync

Destinations:

- Local folder
- External hard drive
- Network drive
- NAS folder
- Mounted cloud folder
- Future remote server

Portable sync format:

```text
movie-library-sync/
  manifest.json
  database-export.jsonl
  movies/
  shows/
  posters/
  backdrops/
  subtitles/
  files/
```

## 12. Implementation Order

1. Create folder structure.
2. Configure `pnpm` workspace.
3. Build `desktop-app/` Electron + React + TypeScript scaffold.
4. Add secure preload API.
5. Add SQLite app-data layout and schema.
6. Add scanner with selectable mode and finder strategy.
7. Add optional file metadata extraction.
8. Add library grid, detail panel, settings, sync manager, and embedded player UI.
9. Add local export/import/sync.
10. Add settings cleanup for local database/cache records.
11. Add backup download and restore.
12. Run typecheck/build verification.
