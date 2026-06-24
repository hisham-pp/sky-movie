# Seanime Video Player - Executive Summary

## Project Structure
- **Backend**: Go-based media server with modular architecture
- **Frontend**: Web interface + native desktop client (Seanime Denshi)
- **Player Types**: External (MPV, VLC, MPC-HC, IINA) + Built-in HTML5 (NativePlayer)

---

## 1. VIDEO/AUDIO CODEC SUPPORT

### Strategy: Delegation Over Implementation
✅ **Seanime doesn't implement codec support in the backend**

Instead:
1. **Parse container metadata** (EBML for MKV) to extract codec information
2. **Report codec IDs** to frontend as RFC 6381 strings
3. **Let player decide**: Browser/MPV/VLC handles actual codec support

### Codec Information Extracted
```
VideoTrack:
  - PixelWidth, PixelHeight
  - CodecID (e.g., "V_UNCOMPRESSED")

AudioTrack:
  - SamplingFrequency
  - Channels, BitDepth
  - CodecID (e.g., "A_AAC")

SubtitleTrack:
  - CodecID (e.g., "S_TEXT/ASS")
  - CodecPrivate (ASS headers, etc.)
```

### Stream Type Detection
- Probes first KB of file to detect MIME type
- Sets appropriate headers: `Accept-Ranges`, `Content-Length`
- Falls back to file extension if probing fails

---

## 2. PLAYER UI COMPONENTS & ARCHITECTURE

### Component Hierarchy
```
VideoCore (Event Bus)
├── PlaybackStatus (current time, duration, paused)
├── PlaybackState (media metadata, playback type)
├── Subtitle Events Cache (parsed from MKV)
├── Event Subscribers (client listeners)
└── Translator Service (auto-translate subtitles)

DirectStream Manager
├── Current Stream (TorrentStream, HTTPStream, LocalFileStream, etc.)
├── Playback Context (for cancellation)
├── MKV Parser Cache (avoid re-parsing)
└── Playback Session Tracking
```

### Event Types (18+ events)
- Loading: `VideoLoaded`, `VideoLoadedMetadata`, `VideoCanPlay`
- Playback: `VideoPaused`, `VideoResumed`, `VideoStatus`
- Completion: `VideoCompleted`, `VideoEnded`
- Errors: `VideoError`, `VideoTerminated`
- Tracks: `VideoSubtitleTrack`, `VideoAudioTrack`, `VideoTextTracks`
- Special: `VideoSkipData`, `VideoPlaylist`, `VideoAnime4K`

### Configuration Per Player
```
MediaPlayer.Repository:
  - Default player (MPV, VLC, MPC-HC, IINA)
  - Completion threshold (~85%)
  - Auto-update progress setting
  - Track playback type (file vs. stream)
```

---

## 3. ERROR HANDLING & FALLBACK MECHANISMS

### Stream Error Callback
```
Stream Interface {
  StreamError(error: Error) // Notifies player of error
  Terminate()               // Cleanup resources
}
```

### Fallback Chains
**Torrent Streams**:
1. Check if file fully downloaded locally
2. Fall back to live torrent streaming from peers
3. Retries with exponential backoff

**HTTP Streams**:
1. Retry with exponential backoff (1s, 2s, 4s)
2. Support HTTP Range requests for resumable playback
3. File-backed caching via `streamcache` library

**Error Recovery**:
- Graceful shutdown on fatal errors
- WebSocket event to notify client
- Resource cleanup (close readers, cancel contexts)

---

## 4. STREAMING & BUFFERING MANAGEMENT

### Intelligent Buffering by Stream Type

| Stream Type | Flush Interval | Max Batch | Sleep After | Use Case |
|------------|----------------|-----------|------------|----------|
| **Local File** | 300ms | 50 | 500ms | Fast seek support |
| **Local File (Resume)** | 100ms | 50 | 100ms | Quick catch-up |
| **Torrent** | 250ms | 25 | 100ms | Live streaming |
| **Torrent (Resume)** | 100ms | 35 | 50ms | Predictable speed |
| **HTTP** | 200ms | 30 | 200ms | Standard streaming |

### Subtitle Streaming Pipeline
**Key Innovation**: Subtitles stream independently from video
1. Video streams via HTTP range requests
2. While video streams, subtitles extracted from EBML container
3. Subtitle events batched and flushed based on stream type
4. Client receives: video chunks + subtitle events

### Range Request Support
```
Header: "Range: bytes=0-1023"
Response: 206 Partial Content
Headers: 
  - Content-Range: bytes 0-1023/500000000
  - Accept-Ranges: bytes
  - Connection: keep-alive
  - Cache-Control: no-store
```

---

## 5. TRACK & SUBTITLE MANAGEMENT

### MKV Container Parsing
```
Metadata extracted:
- All Tracks (video, audio, subtitle)
- Chapters with timestamps
- Attachments (fonts for ASS subtitles)
- RFC 6381 codec string
```

### Subtitle Track Support
**Embedded Subtitles**:
- ASS/SSA: Use libass renderer on client
- SRT: Convert to VTT for HTML5 video
- Events cached and sent incrementally

**External/Uploaded Subtitles**:
- Auto-detection of format (.ass, .srt, .vtt, .ttml, .stl)
- Format conversion pipeline (any → ASS or VTT)
- Server serves fonts from MKV attachments

### Subtitle Rendering
```
Native HTML5 Player:
├── ASS/SSA: libass renderer (preserves styling)
├── SRT/VTT: Native HTML5 <track> element
└── Fonts: Loaded from MKV attachments via HTTP

External Players (MPV/VLC):
└── Direct file path or HTTP streaming
```

---

## 6. CUSTOM LIBRARIES & PATTERNS

### External Libraries
- `anacrolix/torrent`: P2P torrent streaming
- `neilotoole/streamcache`: Smart HTTP caching
- `imroc/req/v3`: HTTP client
- MPV JSON IPC over socket

### Design Patterns

**1. Interface-Driven Streaming**
```go
type Stream interface {
  Type() StreamType
  LoadContentType() string
  LoadPlaybackInfo() (*PlaybackInfo, error)
  GetStreamHandler() http.Handler
  StreamError(error)
  Terminate()
}
```
→ Single interface for all stream types (torrent, file, HTTP, debrid)

**2. Event Bus Pattern**
```go
eventBus chan VideoEvent → Dispatcher → Subscribers
```
→ Non-blocking async event processing

**3. Options Builder Pattern**
```go
type NewVideoCoreOptions struct {
  WsEventManager    events.WSEventManagerInterface
  Logger            *zerolog.Logger
  // ... more fields
}
```
→ Clear dependency injection

**4. Optional Pattern (mo library)**
```go
currentStream mo.Option[Stream]  // Safe nil handling
```
→ Explicit handling of nullable values

**5. Continuity Manager**
→ Tracks watch position per episode for auto-resume

---

## 7. PROGRESS TRACKING & COMPLETION

### Auto-Progress Update (Effects System)
```
VideoCompletedEvent:
  1. Check AutoUpdateProgress setting
  2. Fetch AniList collection
  3. Find list entry for anime
  4. Compare episode progress
  5. Update if progress is higher
  6. Trigger collection refresh
```

### Completion Threshold
- Configurable (default ~85%)
- Prevents duplicate updates
- Integrates with AniList API

### Integration Points
- Discord RPC presence update
- Progress API sync
- Collection refresh callback

---

## 8. KEY ARCHITECTURAL INSIGHTS

### 1. Separation of Concerns
✅ Stream handling ≠ Playback tracking ≠ Progress synchronization

### 2. Player Agnosticity
✅ Supports: External players (MPV/VLC), HTML5 player, even web players
✅ Can mix player types during session

### 3. Codec Agnosticism
✅ Backend extracts metadata, doesn't validate codec support
✅ Player decides what it can handle

### 4. Resilience Through Fallbacks
✅ Torrent → local file
✅ HTTP → retry with backoff
✅ Subtitle format → auto-convert

### 5. Async Event Processing
✅ Non-blocking event bus prevents UI freezing
✅ Subscribers can't block each other

---

## RECOMMENDED ADOPTION FOR SKY-MOVIE

### Immediate (High Value)
1. ✅ **Stream Interface Pattern** - Unified handling for all source types
2. ✅ **Event Bus System** - Non-blocking playback events
3. ✅ **Adaptive Buffering** - Per-stream-type flush configurations
4. ✅ **Error Fallback Chain** - Graceful degradation on failures

### Short-term (Medium Value)
5. ✅ **Metadata Parser** - Extract codec info from containers
6. ✅ **Subtitle Format Support** - ASS/VTT conversion
7. ✅ **Range Request Handling** - Resumable HTTP playback
8. ✅ **Continuity Manager** - Remember watch positions

### Medium-term (Enhancement)
9. ✅ **Subtitle Translation** - Auto-translate feature (Translator service)
10. ✅ **Multi-Quality Support** - VideoSources with resolution options
11. ✅ **Watch Party Sync** - Nakama integration for shared viewing
12. ✅ **Discord RPC** - Show what you're watching

---

## Files to Review in Seanime Repository

### Core Architecture
- `internal/videocore/videocore.go` - Event bus implementation
- `internal/directstream/manager.go` - Stream lifecycle management
- `internal/directstream/stream.go` - Stream interface definition

### Codec & Metadata
- `internal/mkvparser/metadata.go` - MKV parsing
- `internal/mkvparser/structs.go` - Track information
- `internal/directstream/stream_helpers.go` - Content-type detection

### Subtitles
- `internal/directstream/subtitles.go` - Subtitle streaming pipeline
- `internal/videocore/subtitles.go` - Subtitle format conversion
- `internal/nativeplayer/events.go` - Client event handling

### Streaming
- `internal/directstream/httpstream.go` - HTTP range requests
- `internal/directstream/torrentstream.go` - Torrent fallback
- `internal/mediaplayers/mpvipc/mpvipc.go` - External player control

### External Players
- `internal/mediaplayers/mpv/mpv.go` - MPV player wrapper
- `internal/mediaplayers/mediaplayer/repository.go` - Player abstraction
- `internal/handlers/mediaplayer.go` - Player HTTP endpoints

---

## Documentation Created

1. **SEANIME_PLAYER_ANALYSIS.md** - Comprehensive technical analysis
2. **SEANIME_ARCHITECTURE_DIAGRAMS.md** - Visual flow diagrams
3. **SEANIME_IMPLEMENTATION_GUIDE.md** - Step-by-step implementation guide
4. **Repository memory** - Quick reference patterns
