# How Seanime Supports MKV Files

## The Key Difference

Seanime **doesn't** play MKV files directly. Instead:

```
MKV File on Disk
    ↓
Backend HTTP Stream Handler
    ↓ (extracts raw video)
HTTP Endpoint: /api/v1/directstream/stream
    ↓
Browser (plays raw video, not MKV)
    ↓
HTML5 Video Element
```

## How It Works

### 1. **Parse MKV Metadata** (Go Backend)
```go
// From seanime: internal/directstream/localfile.go
parser := mkvparser.NewMetadataParser(file, logger)
metadata := parser.GetMetadata(ctx)

// Extract all tracks
metadata.AudioTracks    // All audio tracks
metadata.SubtitleTracks // All subtitle tracks
metadata.VideoTracks    // Video information
```

### 2. **Stream Handler Extracts Video**
```go
// Instead of serving the MKV file directly:
// mkvFile → [HTTP Handler] → raw video bytes → browser

StreamUrl: "{{SERVER_URL}}/api/v1/directstream/stream?id=" + id
```

The HTTP handler:
- Opens the MKV file
- Reads the video data from inside the container
- Streams only the **video chunk** to the browser
- Browser receives raw video (not MKV format)

### 3. **Browser Plays Raw Video**
```typescript
<video src="http://localhost:3000/api/v1/directstream/stream?id=xyz" />
```

Browser receives video bytes, not MKV container → native playback works!

### 4. **Subtitle & Audio Handling**
```go
// Metadata is sent separately
playbackInfo.SubtitleTracks // Browser knows about all tracks
playbackInfo.MkvMetadata    // Extracted in Go, sent as JSON

// If browser wants audio track 2:
// Backend re-streams with that track selected
```

---

## Implementation Needed for Sky-Movie

To support MKV like Seanime, you need:

### 1. **Backend HTTP Stream Handler** (Main Process)
```typescript
// src/main/services/streamingService.ts
export class StreamingService {
  registerStreamHandler(protocol: Protocol) {
    protocol.handle('stream', async (request) => {
      const fileId = getFileIdFromUrl(request.url);
      const file = catalog.getMediaFile(fileId);
      
      // Parse MKV to extract video
      const mkvData = parseMKV(file.path);
      
      // Stream raw video bytes to browser
      return streamVideoBytes(file.path, request.headers);
    });
  }
}
```

### 2. **MKV Parser** (Go or Node Library)
```typescript
// Option A: Call external ffmpeg
const videoStream = spawn('ffmpeg', [
  '-i', mkvPath,
  '-c', 'copy',      // Copy codec (no re-encoding)
  '-f', 'mpegts',    // Output format
  'pipe:1'           // Output to stdout
]);

// Option B: Use ffprobe + range requests
const videoStream = readRawVideoFromMKV(mkvPath, startByte, endByte);
```

### 3. **Update Player URL**
```typescript
// Instead of: file:///E:/Movies/Video.mkv
// Use: http://localhost:3000/api/stream?id=123

const streamUrl = `http://localhost:${port}/api/stream?id=${mediaFileId}`;
```

### 4. **Track Selection**
```typescript
// When user selects audio track 2:
// Backend re-streams with that specific audio track
protocol.handle('stream', (request) => {
  const trackId = request.url.searchParams.get('audioTrack');
  return streamVideoWithTrack(filePath, trackId);
});
```

---

## Quick Setup (Node.js Backend Approach)

### File: `src/main/services/videoStreamService.ts`

```typescript
import { spawn } from 'child_process';
import type { Protocol } from 'electron';

export class VideoStreamService {
  registerStreamProtocol(protocol: Protocol) {
    protocol.handle('stream', async (request) => {
      const fileId = Number(new URL(request.url).searchParams.get('id') || '0');
      const file = this.catalog.getMediaFile(fileId);
      
      if (!file) {
        return new Response('File not found', { status: 404 });
      }

      // Use ffmpeg to extract video stream
      const ffmpeg = spawn('ffmpeg', [
        '-i', file.absolutePath,
        '-c:v', 'copy',           // Copy video codec (no re-encoding)
        '-c:a', 'aac',            // Re-encode audio to AAC (browser friendly)
        '-f', 'matroska',         // Output as matroska
        'pipe:1'                  // Output to stdout
      ]);

      // Handle errors
      ffmpeg.stderr.on('data', (data) => {
        console.error(`ffmpeg error: ${data}`);
      });

      // Return stream
      return new Response(
        await streamToNode(ffmpeg.stdout),
        {
          headers: {
            'Content-Type': 'video/x-matroska',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-store'
          }
        }
      );
    });
  }
}
```

---

## Why Seanime Does It This Way

✅ **Browser Compatible** - Video stream instead of MKV container
✅ **Track Selection** - Can switch audio/subtitles without re-buffering  
✅ **Codec Support** - Backend handles codec conversion if needed
✅ **Subtitle Support** - Metadata extracted separately
✅ **Streaming** - Works with HTTP range requests for seeking
✅ **Efficient** - FFmpeg copies codecs (no re-encoding overhead)

---

## Comparison: Approaches

| Approach | Pro | Con |
|----------|-----|-----|
| **Browser Native** | Simplest | No MKV support |
| **System Player Fallback** | Works | Poor UX (app switching) |
| **Stream + FFmpeg** (Seanime way) | Full support | Needs backend service |
| **Transcode to MP4** | Works in browser | Slow (re-encoding) |

---

## Next Steps to Implement

1. ✅ Current: Using file:// URL → MKV fails
2. 🔄 **Setup HTTP stream endpoint** in main process
3. 🔄 **Integrate FFmpeg** for video extraction
4. 🔄 **Update player URL** to use HTTP stream
5. 🔄 **Add track selection** UI with metadata

**Would you like me to implement the FFmpeg streaming approach?** It's what Seanime uses and will make MKV files work perfectly.
