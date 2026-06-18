# Scripts

This folder is reserved for project automation such as database maintenance, export/import helpers, packaging, and release scripts.

Keep scripts independent from the renderer. File-system and database helpers should target the Electron main-process service boundaries used by `desktop-app/`.

## Build Desktop App

```powershell
.\scripts\build-desktop-app.ps1 -Target current
.\scripts\build-desktop-app.ps1 -Target windows
.\scripts\build-desktop-app.ps1 -Target linux
.\scripts\build-desktop-app.ps1 -Target mac
.\scripts\build-desktop-app.ps1 -Target all
```

```bash
./scripts/build-desktop-app.sh current
./scripts/build-desktop-app.sh linux
./scripts/build-desktop-app.sh mac
./scripts/build-desktop-app.sh all
```

Windows-only shortcut:

```powershell
.\scripts\build-windows-app.ps1
```

Artifacts are written to `desktop-app/dist/`.

Expected targets:

- Windows: NSIS installer and `win-unpacked/` folder.
- macOS: DMG and ZIP for x64 and arm64.
- Linux: AppImage, DEB, and tar.gz.

Build macOS artifacts on macOS for reliable signing and notarization.
