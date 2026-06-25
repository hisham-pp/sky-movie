# mpv-player native addon — Setup Guide

This N-API addon embeds libmpv directly into Sky Movie, providing:
- Full codec support: H.265/HEVC, AV1, VP9, VC-1, Dolby Vision, FLAC, TrueHD, DTS-HD…
- Hardware-accelerated decoding (DXVA2/D3D11VA on Windows via `--hwdec=auto`)
- Custom React UI controls (no mpv OSC)

## Prerequisites

### Windows

1. **Visual C++ Build Tools** (required for node-gyp):
   ```
   winget install Microsoft.VisualStudio.2022.BuildTools
   ```
   Select "Desktop development with C++" workload.

2. **7-Zip** (for the download script):
   ```
   winget install 7zip.7zip
   ```

3. **libmpv DLL** — run the download script from the repo root:
   ```
   node scripts/download-libmpv.mjs
   ```
   This places `mpv-2.dll` + `mpv.lib` into `lib/` and `client.h` + `render.h` into `include/mpv/`.

   **Manual alternative**: Download from https://sourceforge.net/projects/mpv-player-windows/files/libmpv/
   and extract the files yourself.

### Linux

```bash
sudo apt install libmpv-dev   # Debian/Ubuntu
sudo dnf install mpv-libs-devel  # Fedora
```

Headers and `.so` are found by node-gyp automatically via pkg-config.

### macOS

```bash
brew install mpv
```

## Building the addon

From the `desktop-app/` directory:

```bash
# One-time: download libmpv (Windows only)
node ../scripts/download-libmpv.mjs

# Build addon for the installed Electron version
npm run rebuild:native
```

Or as part of the full build:

```bash
npm run build
```

## Enabling hardware decoding (optional)

In `mpvService.ts`, change the `hwdec` option:

```ts
mpv_set_option_string(handle_, "hwdec", "auto");  // auto-detect GPU API
```

Options: `"no"` (safe default), `"auto"`, `"dxva2"`, `"d3d11va"`, `"nvdec"`, `"cuda"`

## Fallback

If the addon is not built or libmpv is not found, Sky Movie automatically falls
back to the Artplayer + FFmpeg streaming path (same as before this feature was added).
No action required — the fallback is seamless.
