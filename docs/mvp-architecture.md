# Sky Movie MVP Architecture

Sky Movie is a local-first desktop movie and TV library manager. The MVP is intentionally built without a backend API or server: all file scanning, metadata storage, playback handoff, export/import, and sync work happens in the Electron main process on the user's device.

## Architecture

- Desktop shell: Electron, React, TypeScript, Vite, TailwindCSS, shadcn-style local UI primitives.
- Local database: SQLite via `better-sqlite3`, with Drizzle schema definitions.
- Storage root: Electron app data directory with `database.sqlite`, `cache/images`, `cache/posters`, `cache/backdrops`, `cache/subtitles`, `backups`, and `exports`.
- Renderer isolation: React never reads the filesystem directly. It calls safe methods exposed through `contextBridge` in the preload script.
- Main process services: library scanner, file watcher boundary, SQLite database, metadata provider manager, local sync/export/import, player service, image cache paths, and backup paths.

## MVP Scope

Included:

- Add and scan local movie/TV library folders.
- Store file metadata and local movie/show matches in SQLite.
- Movie and TV show grids, detail surfaces, search, filters, tags/favorites UI hooks.
- Built-in player URL handoff through a private Electron protocol.
- Watch progress persistence.
- Metadata-only export/import.
- Full or partial local sync to folders, external drives, NAS folders, or mounted cloud folders.
- Backup-friendly local app data layout.

Not included in the MVP:

- Backend server, remote API, user accounts, cloud sync, multi-user support, transcoding, mobile app, or plugin marketplace.

The code is organized so IPC services could later be wrapped by REST/GraphQL APIs, SQLite schema could migrate toward PostgreSQL, and the local sync engine could evolve into server sync without making the MVP depend on those pieces.

## Commands

```powershell
cd desktop-app
pnpm install
pnpm dev
pnpm typecheck
pnpm build
```
