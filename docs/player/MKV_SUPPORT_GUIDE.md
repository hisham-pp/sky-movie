# Video Player Implementation - MKV Support Guide

## Current Implementation Status

Your player has been enhanced to support multiple audio and subtitle tracks with the following features:

### ✅ What's Now Working

1. **Track Metadata Extraction** (`mediaMetadataService.ts`)
   - Uses FFprobe to extract audio and subtitle track information from media files
   - Supports MKV, WebM, AVI, MOV, FLV, MTS and other containers
   - Extracts: codec, language, title, default flag for each track

2. **Track Information in PlayerPanel**
   - Shows available audio tracks with codec and language info
   - Shows available subtitle tracks  
   - Provides dropdown UI for track selection
   - Displays track count and language

3. **Smart Error Messages**
   - Detects MKV files and explains the limitation
   - Suggests system player for unsupported formats
   - Shows specific codec error information

4. **Watch Progress Tracking**
   - Automatically saves playback position
   - Restores position on reopen
   - Saves every 10 seconds

### ⚠️ Current Limitations

**MKV Files** - The browser's HTML5 video element cannot directly play MKV files. This is a fundamental browser limitation.

**Why MKV isn't natively supported:**
- MKV (Matroska) is a container format, not a video format
- Browsers only support MP4, WebM, Ogg containers natively
- MKV requires backend processing to convert to a browser-friendly format

### 🔧 Solutions to Enable MKV Playback

#### Option 1: Auto-Fallback to System Player (Recommended - Easiest)
```typescript
if (isMKV) {
  // Automatically open in system player instead of trying browser playback
  onOpenExternal(mediaFileId);
}
```

#### Option 2: FFmpeg Backend Transcoding (More Complex)
Setup a background FFmpeg process to:
1. Read MKV file
2. Extract requested audio/subtitle tracks
3. Transcode to MP4 or HLS stream
4. Serve via HTTP to browser player

```typescript
// Pseudo-code
const hls = await transcodeToHLS(mkvPath, {
  audioTrack: selectedAudio,
  subtitleTrack: selectedSubtitle,
  quality: 'auto'
});
videoRef.current.src = hls;
```

#### Option 3: Use HLS.js with FFmpeg (Medium Complexity)
Similar to Seanime's approach:
1. Keep FFmpeg running as background service
2. Create HLS manifest on demand
3. Serve chunks via HTTP
4. Use HLS.js in browser

### 📋 Next Steps to Implement MKV Support

**If you want built-in MKV playback:**

1. **Install FFmpeg** (if not already installed)
   ```bash
   # Windows (with chocolatey)
   choco install ffmpeg
   
   # Or download from https://ffmpeg.org/download.html
   ```

2. **Setup FFmpeg transcoding service** in main process:
   ```typescript
   // src/main/services/ffmpegService.ts
   export class FFmpegService {
     async transcodeToHLS(
       inputPath: string, 
       audioTrack: number,
       subtitleTrack: number
     ): Promise<string> {
       // Returns HLS URL for playback
     }
   }
   ```

3. **Add HLS.js to renderer**:
   ```bash
   pnpm add hls.js
   ```

4. **Update player to use HLS for MKV**:
   ```typescript
   if (isMKV) {
     const hlsUrl = await transcodeToHLS(filePath, audioTrack, subTrack);
     setupHLS(videoRef.current, hlsUrl);
   }
   ```

### 📂 Files Modified

```
src/
├── main/
│   └── services/
│       ├── mediaMetadataService.ts (NEW) - FFprobe extraction
│       └── playerService.ts (UPDATED) - Calls metadata extraction
├── shared/
│   └── ipc.ts (UPDATED) - MediaTrack interface
└── renderer/
    └── src/
        └── components/
            └── PlayerPanel.tsx (UPDATED) - Track selection UI
```

### 🧪 Testing

**To test the current implementation:**

1. Use **MP4 files** - Should work perfectly in built-in player
2. Use **MKV files** - Will show error message, click "Open in system player"
3. Check **track extraction** - Server logs will show FFprobe output

### 💡 Pro Tips

**For Best Results:**
- Use MP4 format for browser playback (widely supported, all codecs)
- Use system player for MKV (supports all codecs via OS)
- Keep MKV for storage (better compression, more features)

**Performance:**
- FFprobe extraction is cached (only runs once per file)
- Track selection dropdown updates instantly
- No re-transcoding needed if just switching tracks

**Future Improvements:**
- Implement subtitle stream extraction and render in browser
- Add WebVTT subtitle rendering for embedded subtitles
- Setup persistent FFmpeg service for seamless HLS streaming
- Implement quality/bitrate selection

---

## How to Use

### With Current Implementation:
1. **MP4/WebM files** → Click play, everything works
2. **MKV files** → See "requires FFmpeg" message → Click "Open in system player"
3. **Audio/Subtitle selection** → Use dropdown menus (metadata extracted)

### After Implementing FFmpeg Backend:
1. All formats → Click play → Works seamlessly
2. **Track selection** → Instant switching without re-buffering
3. **Automatic codec handling** → No more unsupported codec errors
