# Sky Movie

Sky Movie is organized as a local-first desktop MVP with room for future surfaces.

## Folder Structure

- `desktop-app/` - Electron, React, TypeScript, Vite, TailwindCSS, local SQLite app.
- `website/` - Future public website or remote dashboard surface. It is intentionally not part of the MVP runtime.
- `scripts/` - Development, maintenance, export, import, and release helper scripts.
- `docs/` - Architecture, sync format, product scope, and implementation notes.

## MVP Rule

The MVP does not include a backend API/server. The desktop app stores data locally with SQLite and uses secure Electron IPC between the renderer and main process.

## Commands

```powershell
pnpm install
pnpm dev
pnpm typecheck
pnpm build
```
