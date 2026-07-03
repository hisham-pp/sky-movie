# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Sky Movie is a local-first desktop movie/TV library manager. It is a pnpm workspace with two packages:

- `desktop-app/` — the MVP product: Electron + React 19 + TypeScript + Vite (electron-vite) + TailwindCSS + SQLite (better-sqlite3, Drizzle schema definitions).
- `website/` — Next.js download/marketing site. Not part of the MVP runtime.

**MVP rule:** no backend API/server, no user accounts, no cloud sync. All scanning, metadata, playback, and sync logic runs in the Electron main process against local SQLite.

## Commands

Run from the repo root (pnpm filters to the right package):

```powershell
pnpm install                # workspace install (postinstall rebuilds native deps for Electron)
pnpm dev                    # desktop app in dev mode (electron-vite dev)
pnpm typecheck              # tsc --noEmit for desktop-app — the primary check; there is no test suite or linter
pnpm build                  # full build: downloads libmpv, builds native addon, typechecks, bundles
pnpm dev:website            # Next.js site dev server
pnpm rebuild:native         # rebuild better-sqlite3 for Electron
```

Packaging (Windows dev machine): `pnpm package:win:dir` (unpacked, fast iteration) or `pnpm package:win:installer` (NSIS). Output lands in `desktop-app/dist/`.

The `prepare:libmpv` / `build:native` steps run automatically inside `build`/`package` scripts; `build:ci` / `package:*:ci` variants skip them (CI restores those artifacts separately).

Releases: `pnpm version:patch|minor|major` bumps both package.json files and CHANGELOG.md. Pushing a `v*` tag triggers `.github/workflows/release.yml` (all platforms → GitHub release). `pnpm release:github` / `pnpm release:r2` update `website/public/releases.json`. See `scripts/README.md`.

## Desktop app architecture

Standard Electron three-process split under `desktop-app/src/`, with the renderer fully sandboxed (`contextIsolation: true`, `sandbox: true`, no node integration):

- `src/shared/ipc.ts` — the single source of truth: all IPC channel names (`ipcChannels`), request/response types, domain types (`Movie`, `TvShow`, `MediaFile`, …), and the `SkyMovieApi` interface.
- `src/preload/index.ts` — exposes `SkyMovieApi` to the renderer as `window.skyMovie` via `contextBridge`. It also synchronously kills mpv on page unload with `sendSync`.
- `src/main/ipc.ts` — `registerIpcHandlers()` maps channels to service calls. Torrent IPC is registered separately in `src/main/torrent/TorrentIpc.ts`.
- `src/main/index.ts` — app bootstrap: creates the DB context, instantiates all services, registers protocols/IPC, creates the frameless window (custom title bar uses `window:minimize/maximize/close` IPC).

**Adding an IPC method touches four places:** channel + types in `shared/ipc.ts`, the `SkyMovieApi` method in `preload/index.ts`, the handler in `main/ipc.ts` (delegating to a service), then call `window.skyMovie.*` in the renderer.

### Main-process services (`src/main/services/`)

One class per concern, constructed in `main/index.ts` with the shared `better-sqlite3` handle: `CatalogService` (queries), `LibraryScanner`, `MetadataProviderManager`, `PlayerService`, `SettingsService`, `LocalSyncEngine` (export/import/sync), `BackupService`, `MaintenanceService`, `UpdateService`, `PlaylistService`.

Database schema lives in `src/main/database/`: `schema.ts` (Drizzle definitions) and `migrations.ts` (`ensureSqliteSchema` — idempotent `CREATE TABLE IF NOT EXISTS` + `ALTER` guards run at startup; there are no migration files).

### Video playback (two paths)

1. **libmpv path (primary)** — `mpvService.ts` wraps the N-API addon in `desktop-app/native/mpv-player/`. A C++ background thread renders frames off the Node main thread and the service throttles → JPEG-encodes → IPCs frames to the renderer. Rebuild it with `pnpm --filter @sky-movie/desktop-app rebuild:native`. mpv plays the file's `absolutePath` directly and handles all containers/codecs, including MKV.
2. **ArtPlayer fallback** — used only when the mpv addon fails to load. Browser-compatible files stream through the privileged `sky-media://` protocol registered by `PlayerService` (full range-request support); formats Chromium can't decode (MKV/HEVC) show an "open in system player" error. (`src/renderer/src/utils/player/` holds buffering, track management, recovery, progress-tracking logic.)

Cached poster/backdrop images are served to the sandboxed renderer via the `sky-image://local/<encoded-path>` protocol.

### Torrents (`src/main/torrent/`)

`TorrentManager` wraps WebTorrent and boots it lazily on first use (keep it off the startup path). Search providers (YTS, EZTV, TPB, Malayalam) implement the `TorrentProvider` interface in `providers/`.

### Renderer (`src/renderer/src/`)

React Router routes in `routes/` (Library, Scan, Settings, Torrent, WatchHistory) inside `AppLayout.tsx`. Path aliases: `@renderer` → `src/renderer/src`, `@shared` → `src/shared`. Theming (10 app themes, player skins) lives in `theme/`; the theme names are typed in `shared/ipc.ts` (`AppTheme`, `PlayerStyle`).

## Gotchas

- Windows dev environment; repo scripts assume PowerShell.
- Chromium feature flags must be combined into the single `--enable-features` switch in `main/index.ts` — only one call is respected.
- When spawning external processes on media paths, pass args as an array (no shell string): media paths contain spaces and parentheses.
- `desktop-app` is ESM (`"type": "module"`), but the preload bundle is emitted as CJS (`index.cjs`).
- Renderer console output is forwarded to the main-process log file (`logs/` next to the exe) — check there when debugging packaged builds.
