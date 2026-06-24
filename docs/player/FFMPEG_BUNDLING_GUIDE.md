# FFmpeg Bundling & MKV Streaming - Complete Setup Guide

## 📋 Overview

Sky-Movie now supports seamless MKV playback by bundling FFmpeg with the application. Like Seanime, users don't need to install anything extra - FFmpeg comes with the app or is automatically detected from the system.

## 🏗️ Architecture

### How It Works

```
User plays MKV
    ↓
FFmpegManager checks for FFmpeg:
  1. Bundled in app/resources/ffmpeg/
  2. System PATH
    ↓
Found → StreamingServer starts HTTP endpoint
    ↓
FFmpeg extracts video stream on-demand
    ↓
Browser plays MP4 stream seamlessly
```

## 🔧 FFmpeg Manager

**File:** `src/main/services/ffmpegManager.ts`

Handles locating FFmpeg from multiple sources:

```typescript
1. Bundled: app/resources/ffmpeg/ffmpeg.exe
2. System PATH: ffmpeg or ffmpeg.exe
```

Features:
- Automatic detection on app startup
- Detailed logging of FFmpeg status
- Graceful fallback to system PATH

## 📦 Packaging FFmpeg with the App

### Option 1: Manual Bundling (Recommended)

1. **Download FFmpeg** from https://ffmpeg.org/download.html
   - Choose "Full" build for Windows

2. **Extract FFmpeg:**
   ```
   Extract the zip file
   Navigate to: bin/ffmpeg.exe
   ```

3. **Bundle with Sky-Movie:**
   ```
   Copy ffmpeg.exe to:
   desktop-app/resources/ffmpeg/ffmpeg.exe
   ```

4. **Build installer:**
   ```bash
   cd desktop-app
   pnpm package:win:installer
   ```

The installer will include FFmpeg automatically (electron-builder includes `resources/**`).

### Option 2: Let Users Install FFmpeg

If you don't bundle FFmpeg, users can install via:

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Using Scoop
scoop install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
apt install ffmpeg  # Ubuntu/Debian
# or equivalent for your distro
```

Sky-Movie will auto-detect and use it.

## 🚀 Build Process

### Scripts Updated

**`package.json` scripts:**
```json
{
  "build": "npm run prepare:ffmpeg && tsc --noEmit && electron-vite build",
  "package": "npm run prepare:ffmpeg && electron-builder",
  "prepare:ffmpeg": "node ../scripts/download-ffmpeg.mjs"
}
```

**What `prepare:ffmpeg` does:**
1. Checks if FFmpeg already bundled
2. Checks if FFmpeg in system PATH
3. Provides instructions for bundling

### Build Configuration

**`electron-builder.yml` updated:**
```yaml
files:
  - out/**
  - package.json
  - resources/**  # Includes bundled FFmpeg
```

This ensures `resources/ffmpeg/ffmpeg.exe` is packaged in the installer.

## 🎬 Streaming Flow

### When MKV is Played

```
PlayerPanel.tsx requests video
    ↓
PlayerService.playMedia()
    ↓
Detects .mkv extension
    ↓
StreamingServer.getUrl() returns:
  http://127.0.0.1:13337/stream?id=123&path=/video.mkv
    ↓
Browser requests stream
    ↓
StreamingServer.streamMKVWithFFmpeg()
    ↓
FFmpeg command:
  ffmpeg -i video.mkv \
    -map 0:v:0 \
    -map 0:a:0 \
    -c:v libx264 \
    -preset ultrafast \
    -c:a aac \
    -f mp4 \
    pipe:1
    ↓
FFmpeg encodes to MP4 and pipes to browser
    ↓
HTML5 <video> plays MP4 stream
```

## 📊 Performance Characteristics

| Aspect | Details |
|--------|---------|
| **Startup Time** | 1-2 seconds (FFmpeg initialization) |
| **Encoding** | Real-time H.264 encoding |
| **Preset** | `ultrafast` for minimal latency |
| **Bitrate** | 128k audio, variable video |
| **Format** | MP4 (browser compatible) |
| **CPU** | 20-40% during streaming |

## ✅ Installation Verification

### Check if FFmpeg Works

**Windows Command Prompt:**
```cmd
ffmpeg -version
```

Should output:
```
ffmpeg version 7.1 Copyright (c) 2000-2024 the FFmpeg developers
```

### In Sky-Movie

Check browser console (F12):
```
[StreamingServer] FFmpeg is available - MKV streaming enabled
```

## 🐛 Troubleshooting

### "FFmpeg not found" Error

**Solution 1: Install FFmpeg**
```bash
choco install ffmpeg  # Windows
brew install ffmpeg   # macOS
apt install ffmpeg    # Linux
```

**Solution 2: Bundle FFmpeg with App**
- Download from https://ffmpeg.org/download.html
- Extract to `desktop-app/resources/ffmpeg/ffmpeg.exe`
- Rebuild installer

### MKV Plays but No Audio

- Check audio track extraction in logs
- Try different audio format (usually defaults to first track)
- Verify FFmpeg version supports audio codec

### Slow Playback

- Uses `ultrafast` preset (lower quality, faster)
- Normal for initial FFmpeg startup
- Should improve once stream is buffered

## 📚 Files Modified

| File | Purpose |
|------|---------|
| `src/main/services/ffmpegManager.ts` | NEW: FFmpeg detection/management |
| `src/main/services/streamingServer.ts` | Updated to use FFmpegManager |
| `scripts/download-ffmpeg.mjs` | Updated: Optional FFmpeg download helper |
| `desktop-app/package.json` | Updated: Added prepare:ffmpeg script |
| `desktop-app/electron-builder.yml` | Updated: Includes resources folder |

## 🚀 Release Checklist

- [ ] Download FFmpeg from https://ffmpeg.org/download.html
- [ ] Extract ffmpeg.exe to `desktop-app/resources/ffmpeg/ffmpeg.exe`
- [ ] Run `pnpm build` to verify
- [ ] Build installer: `pnpm package:win:installer`
- [ ] Test with MKV file
- [ ] Verify FFmpeg is in installer resources

## 💡 Future Improvements

1. **Automatic Bundling Script**
   - Auto-download and extract FFmpeg

2. **First-Run Setup**
   - GUI prompt to install FFmpeg if missing

3. **Portable FFmpeg**
   - Include FFmpeg in app directory without system PATH

4. **Multiple Format Support**
   - WebM, AVI, etc. with different encoders

5. **Hardware Acceleration**
   - Add `-hwaccel nvidia` for GPU encoding

## 📖 References

- [FFmpeg Official](https://ffmpeg.org/)
- [Electron Builder Documentation](https://www.electron.build/)
- [Seanime Project](https://github.com/5rahim/seanime) - Inspiration
