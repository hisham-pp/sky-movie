# Scripts

This folder is reserved for project automation such as database maintenance, export/import helpers, packaging, and release scripts.

Keep scripts independent from the renderer. File-system and database helpers should target the Electron main-process service boundaries used by `desktop-app/`.

## Build Windows App

```powershell
.\scripts\build-windows-app.ps1
```

The script creates both a Windows installer and an unpacked app folder in `desktop-app/dist/`.
