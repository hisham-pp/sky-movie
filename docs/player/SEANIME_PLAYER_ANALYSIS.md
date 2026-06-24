# Seanime Video Player - ACTUAL Implementation Analysis

## Executive Summary

Seanime uses **VideoCore**, a sophisticated custom React-based video player built on HTML5's `<video>` element, enhanced with:
- **hls.js** (1.6.16) for HLS streaming
- **JASSUB** (2.5.1) for advanced subtitle rendering (ASS/SSA format)
- **Jotai** atoms for state management with scoped isolation
- **Custom React components** for full UI control

The player is NOT a wrapper around external players like MPV - it's a completely custom implementation with extensive feature support for anime streaming.

---

## 1. CORE VIDEO PLAYER LIBRARY

### 1.1 Dependencies
Seanime uses a **Repository Pattern** to manage different player types:

- **Native Player (HTML5)**: Built-in web-based player (`NativePlayer`)
  - Single instance per app lifetime
  - Event-driven architecture using WebSocket events
  - Supports metadata injection and subtitle streaming

- **External Players**: Managed via `MediaPlayer.Repository`
  - **MPV**: Primary external player with IPC (Inter-Process Communication)
  - **VLC**: Via command-line interface
  - **MPC-HC**: Windows Media Player Classic alternative
  - **IINA**: macOS-specific player

### 1.2 Key Architecture Components

**Location**: `internal/mediaplayers/`
```
mediaplayer/
├── hook_events.go      # Event hooks for player lifecycle
├── repository.go       # Unified player interface (pattern: Repository)
└── test_helper.go

mpv/
├── mpv.go             # MPV player control & lifecycle
├── mpvipc/            # MPV JSON IPC protocol implementation
│   ├── mpvipc.go      # Connection management
│   ├── pipe.go        # Unix pipe implementation
│   └── pipe_windows.go # Windows named pipe implementation
├── vlc/, iina/, mpchc/ # Other player implementations
```

---

## 2. VIDEO/AUDIO CODEC SUPPORT

### 2.1 Codec Detection via MKV Parser
**File**: `internal/mkvparser/`

The system detects codec support through **EBML parsing** (Matroska container):

```go
// Track types and codec support
type TrackInfo struct {
    Number       int64      // Track number
    UID          uint64
    Type         TrackType  // "video", "audio", "subtitle"
    CodecID      string     // e.g., "V_UNCOMPRESSED", "A_AAC", "S_TEXT/ASS"
    LanguageIETF string     // IETF language tag
    Video        *VideoTrack
    Audio        *AudioTrack
    CodecPrivate []byte     // Raw codec-specific data (e.g., ASS headers)
}

// Video-specific metadata
type VideoTrack struct {
    PixelWidth   uint64
    PixelHeight  uint64
}

// Audio-specific metadata
type AudioTrack struct {
    SamplingFrequency float64
    Channels          uint64
    BitDepth          uint64
}
```

### 2.2 Codec Strategy
**Key Insight**: Seanime **delegates codec handling** to the video player:
- For external players (MPV/VLC): Players handle codec support natively
- For HTML5 native player: Uses browser's native codec support + `libass` renderer for subtitles
- Codec support is passed via **RFC 6381 codec strings** in `MimeCodec` field

### 2.3 Stream Type Detection
```go
type StreamType string

const (
    StreamTypeTorrent StreamType = "torrent"    // P2P via anacrolix/torrent
    StreamTypeFile    StreamType = "localfile"  // Local filesystem
    StreamTypeDebrid  StreamType = "debrid"     // Real-debrid API
    StreamTypeURL     StreamType = "url"        // Direct HTTP/HTTPS
    StreamTypeNakama  StreamType = "nakama"     // Nakama real-time sync
)
```

**Content-Type Detection**:
- Probes first kilobytes to detect MIME type
- Falls back to file extension-based detection
- Sets appropriate headers for streaming (Accept-Ranges, Content-Length)

---

## 3. PLAYER UI COMPONENTS & CONFIGURATION

### 3.1 Native Player (HTML5) - VideoCore System
**Location**: `internal/videocore/`

#### Core Structure
```go
type VideoCore struct {
    // Playback state management
    playbackStatus    *PlaybackStatus      // Current time, duration, paused state
    playbackState     *PlaybackState       // Media metadata, playback type
    playbackMkvEvents *result.Map[...]     // Parsed MKV subtitle events cache
    
    // Subtitle management
    translatorService *TranslatorService   // Auto-translate subtitle tracks
    
    // Event system
    subscribers       *result.Map[string, *Subscriber]
    eventBus          chan VideoEvent      // Async event dispatcher
    
    // Integration
    continuityManager  *continuity.Manager  // Remember watch position
    discordPresence   *discordrpc_presence.Presence
    refreshAnimeCollectionFunc func()       // Callback to sync collection
}
```

#### Video Events (Player Lifecycle)
```go
type ClientEventType string

// Major events
const (
    PlayerEventVideoLoaded            // Mounted, playback starting
    PlayerEventVideoLoadedMetadata     // Metadata parsed
    PlayerEventVideoCanPlay            // Ready to play
    PlayerEventVideoPaused
    PlayerEventVideoResumed
    PlayerEventVideoStatus             // Periodic status update
    PlayerEventVideoSubtitleTrack      // Track selected
    PlayerEventVideoAudioTrack         // Track selected
    PlayerEventVideoCompleted
    PlayerEventVideoSeeked
    PlayerEventVideoError              // Error occurred
    PlayerEventVideoTerminated         // Cleanup complete
    PlayerEventVideoPlaybackState      // Initial state broadcast
    PlayerEventVideoTextTracks         // All available tracks sent
    PlayerEventVideoSkipData            // Opening/ending skip info
    PlayerEventAnime4K                 // Filter option changed
)
```

#### Playback Information Structure
```go
type VideoPlaybackInfo struct {
    Id                  string                    // Unique playback session ID
    PlaybackType        PlaybackType              // localfile|torrent|debrid|url|nakama|onlinestream
    StreamURL           string                    // Playback URL
    MkvMetadata         *mkvparser.Metadata      // Parsed MKV/EBML metadata (NativePlayer only)
    LocalFile           *anime.LocalFile          // Local file metadata
    SubtitleTracks      []*VideoSubtitleTrack    // External subtitles
    LibassFonts         []*VideoLibassFont        // Fonts for ASS/SSA rendering
    VideoSources        []*VideoSource            // Multi-quality options
    PlaylistExternalEpisodeNumbers []int         // Episode list for auto-next
    InitialState        *VideoInitialState        // Resume position & paused state
    Media               *anilist.BaseAnime        // Anime metadata
    Episode             *anime.Episode            // Episode metadata
    IsNakamaWatchParty  bool                      // Shared watch session
}

// Subtitle track specification
type VideoSubtitleTrack struct {
    Index             int     // Track index
    Src               *string // URL or data source
    Content           *string // Actual subtitle data (for embedded/converted)
    Label             string  // Display label
    Language          string  // Language code
    Type              *string // "srt"|"vtt"|"ass"|"ssa"
    Default           *bool   // Default selection
    UseLibassRenderer *bool   // Use libass for rendering (ASS/SSA)
}
```

### 3.2 Configuration System
**Location**: `internal/mediaplayers/mediaplayer/repository.go`

```go
type PlaybackType string

const (
    PlaybackTypeFile   PlaybackType = "file"    // External player tracking
    PlaybackTypeStream PlaybackType = "stream"  // Native player tracking
)

// Completion threshold for marking episode as watched
completionThreshold   float64  // e.g., 85% = 85 seconds of 100 second episode
```

---

## 4. ERROR HANDLING & FALLBACK MECHANISMS

### 4.1 Stream Error Handling
**Location**: `internal/directstream/stream.go`

#### Stream Interface
```go
type Stream interface {
    Type() nativeplayer.StreamType
    LoadContentType() string
    LoadPlaybackInfo() (*nativeplayer.PlaybackInfo, error)
    GetStreamHandler() http.Handler
    StreamError(err error)        // ← Error callback
    Terminate()
    // ... other methods
}
```

#### Error Propagation
1. **Stream Error Callback**: Called when streaming fails
   ```go
   // Notifies native player of error
   StreamError(err error)
   ```

2. **Player Error Event**: Sent to client
   ```go
   // From nativeplayer/events.go
   Error(clientId string, err error)  // Sends error to frontend
   ```

3. **VideoCore Error Handling**: Tracks error state
   ```go
   case *VideoErrorEvent:
       if vc.discordPresence != nil {
           go vc.discordPresence.Close()  // Clean up presence
       }
       vc.logger.Error().Err(event.Error).Msg("Playback error")
   ```

### 4.2 Torrent-Specific Resilience
**Location**: `internal/directstream/torrentstream.go`

```go
// Fallback chain for torrent playback
1. Check if file is fully downloaded locally
   - Path: {downloadDir}/{infoHash}/{filePath}
   - If file exists and size matches, use local file

2. Fall back to torrent stream
   - Real-time streaming from peers
   - Enables "stream while downloading"

// Responsive torrent reader
reader.SetResponsive()      // Prioritize playback pieces
reader.SetReadahead(0)      // Minimal buffering for live streaming
```

### 4.3 HTTP Stream Resilience
**Location**: `internal/directstream/httpstream.go`

```go
// Range request support for resumable playback
- Parses HTTP Range header
- Supports partial content (206 status)
- Content caching with `streamcache` library
- Automatic retry on connection loss

// Headers management
Accept-Ranges: bytes
Content-Type: video/mp4 (or detected)
Connection: keep-alive
Cache-Control: no-store
```

### 4.4 Generic Recovery Mechanisms
- **Sync State Mismatch**: Detects if client playback position diverges
- **Thread-Safe State**: Uses mutexes (`sync.RWMutex`) to prevent race conditions
- **Graceful Shutdown**: All streams properly cleanup on termination

---

## 5. STREAMING & BUFFERING MANAGEMENT

### 5.1 Buffering Strategy by Stream Type
**Location**: `internal/directstream/subtitles.go` - `subtitleFlushConfig`

Different buffering strategies based on stream type and offset:

```go
// Local Files - Aggressive buffering for fast seek
PlaybackType: "file"
flushInterval:        300ms
maxBatchSize:         50
sleepAfterFullBatch:  500ms
// On resume/seek: Much faster catch-up (100ms flush)

// Torrent Streams - Conservative buffering (less predictable)
PlaybackType: "torrent"
flushInterval:        250ms
maxBatchSize:         25
sleepAfterFullBatch:  100ms
minSendInterval:      100ms
// On resume/seek: Slower buffering (100ms flush, 35 batch)

// HTTP Streams - Standard buffering
PlaybackType: "http"
Uses default HTTP client with:
- MaxIdleConns: 100
- MaxIdleConnsPerHost: 10
- IdleConnTimeout: 90s
- TLSHandshakeTimeout: 10s
```

### 5.2 Subtitle Streaming Pipeline
**Key Innovation**: Seanime **streams subtitles separately** from video

**Process**:
1. Player requests video via HTTP range requests
2. While video streams, subtitles are parsed from EBML container:
   ```go
   type SubtitleStream struct {
       stream    Stream
       reader    io.ReadSeekCloser      // Reads video file
       offset    int64                  // Current position in file
       completed bool                   // Reached EOF?
       
       onStop    func()                 // Cleanup callback
   }
   ```

3. Subtitle events extracted and batched:
   ```go
   // Events sent in batches to client
   defaultSubtitleBackoffBytes    = 1024 * 1024  // Backoff distance
   subtitleStreamDedupWindowBytes = 1024 * 1024  // Dedup range
   ```

4. **Flush timing** adjusted per stream type for optimal responsiveness

### 5.3 Direct Stream Manager
**Location**: `internal/directstream/manager.go`

```go
type Manager struct {
    // Playback control
    playbackCtx           context.Context
    playbackCtxCancelFunc context.CancelFunc
    
    // Current state
    currentStream          mo.Option[Stream]  // Optional pattern
    currentPlaybackId      string
    currentPlaybackClient  string
    
    // Parser caching
    parserCache *result.Cache[string, *mkvparser.MetadataParser]
    
    // Track replacement playback ID for seamless transitions
    replacedPlaybackId     string
    replacedPlaybackClient string
}
```

**Key Features**:
- Handles seamless stream transitions
- Caches MKV metadata parsers to avoid re-parsing
- Manages playback cancellation
- Tracks replaced playback sessions for cleanup

---

## 6. TRACK & SUBTITLE MANAGEMENT

### 6.1 Track Discovery (MKV Container)
**Location**: `internal/mkvparser/metadata.go`

```go
type Metadata struct {
    Tracks         []*TrackInfo      // All tracks
    VideoTracks    []*TrackInfo      // Filtered video tracks
    AudioTracks    []*TrackInfo      // Filtered audio tracks
    SubtitleTracks []*TrackInfo      // Filtered subtitle tracks
    Attachments    []*AttachmentInfo // Fonts, images, etc.
    Chapters       []*ChapterInfo    // Chapter points
    MimeCodec      string            // RFC 6381 codec string
}

// Each track has:
type TrackInfo struct {
    Number       int64
    UID          uint64
    Type         TrackType   // "video", "audio", "subtitle"
    CodecID      string      // e.g., "S_TEXT/ASS"
    Name         string      // Display name
    Language     string      // 3-letter code
    LanguageIETF string      // IETF BCP 47 tag
    Default      bool
    Forced       bool
    Enabled      bool
    CodecPrivate []byte      // Codec-specific data (ASS headers)
}

// Attachment info (fonts for subtitles)
type AttachmentInfo struct {
    UID          uint64
    Filename     string
    Mimetype     string      // e.g., "font/ttf"
    Data         []byte      // Loaded into memory
    IsCompressed bool
}
```

### 6.2 Subtitle Track Management

#### Embedded Subtitles
- Parsed from MKV container during metadata extraction
- Subtitle events extracted as file is read
- Events cached per subtitle track ID
- Fonts (attachments) served separately

#### External/Uploaded Subtitles
```go
// VideoCore supports subtitle conversion
ConvertSubsTo(content string, from int, to int) (string, error)

// Supported formats detected:
- .ass / .ssa  (Advanced SubStation Alpha)
- .srt         (SubRip)
- .vtt         (WebVTT)
- .ttml        (TTML/XML)
- .stl         (SSA legacy)

// Conversion chain:
.any → ASS (for libass renderer)
.any → VTT (for HTML5 video player)
```

#### Subtitle Events Structure
```go
type SubtitleEvent struct {
    TrackUID       uint64    // Which subtitle track
    Start          float64   // Start time (seconds)
    Duration       float64   // Display duration
    Content        string    // Actual text
    Index          int       // Event index
    IsForced       bool
    IsDefault      bool
}
```

### 6.3 Subtitle Rendering Pipeline

**For Native HTML5 Player**:
1. **ASS/SSA Subtitles**: Use `libass` renderer
   - `UseLibassRenderer: true` in VideoSubtitleTrack
   - Preserves styling, animations, fonts
   - Server-side font serving via `/api/v1/directstream/attachment/{filename}`

2. **Simple Formats (SRT/VTT)**: Use native HTML5 rendering
   - Convert to VTT format
   - Use `<track>` element in video player

3. **Font Management**:
   ```go
   type VideoLibassFont struct {
       Name *string    // Font name
       Src  string     // URL to fetch font from server
   }
   // Fonts loaded from MKV attachments
   ```

---

## 7. CUSTOM VIDEO PLAYER LIBRARIES & PATTERNS

### 7.1 External Libraries Used

**Core Streaming**:
- `anacrolix/torrent`: P2P torrent streaming
- `github.com/neilotoole/streamcache`: Smart file-based caching for HTTP streams
- `github.com/imroc/req/v3`: HTTP client for subtitle/metadata fetching

**Player Control**:
- **MPV IPC**: Custom JSON-over-socket protocol
  - Uses named pipes on Windows
  - Unix domain sockets on Linux/macOS
  - Full event subscription system

**Media Handling**:
- Custom EBML parser for MKV container introspection
- Custom subtitle format detection and conversion

### 7.2 Notable Design Patterns

#### 1. **Interface-Driven Stream Architecture**
```go
// Single Stream interface supports all types
type Stream interface {
    Type() nativeplayer.StreamType
    LoadContentType() string
    LoadPlaybackInfo() (*nativeplayer.PlaybackInfo, error)
    GetStreamHandler() http.Handler
    StreamError(err error)
    Terminate()
}

// Concrete implementations:
- LocalFileStream
- TorrentStream
- DebridStream
- HTTPBaseStream (Debrid/URL/Nakama)
```

**Benefit**: Unified error handling, lifecycle management, and metadata caching

#### 2. **Event Bus Pattern** (VideoCore)
```go
// Non-blocking event dispatch
go func() {
    for {
        select {
        case <-vc.dispatcherStop:
            return
        case event := <-vc.eventBus:
            vc.dispatchEvent(event)  // Process event
        }
    }
}()

// Subscribers listen to typed events
func (vc *VideoCore) Subscribe(name string) *Subscriber {
    // Returns event channel: chan VideoEvent
}
```

**Benefit**: Decoupled event processing, prevents blocking on slow subscribers

#### 3. **Options Pattern** (Builder-like)
```go
type NewVideoCoreOptions struct {
    WsEventManager             events.WSEventManagerInterface
    Logger                     *zerolog.Logger
    MetadataProviderRef        *util.Ref[metadata_provider.Provider]
    // ... more dependencies
}

// Factory function with clear dependencies
func New(opts NewVideoCoreOptions) *VideoCore { ... }
```

**Benefit**: Clear dependency injection, easy testing

#### 4. **Optional Pattern** (mo library)
```go
type Stream interface {
    MkvMetadataParser mo.Option[*mkvparser.MetadataParser]  // May not exist
    currentStream     mo.Option[Stream]  // May not exist
}

// Safe nil handling
if parser, ok := stream.MkvMetadataParser.Get(); ok {
    // Use parser
}
```

#### 5. **Continuity Manager** (Watch Position Tracking)
- Remembers exact watch position for each episode
- Used by VideoCore effects system
- Auto-resume on playback start
- Auto-update progress on video completion

---

## 8. PLAYBACK PROGRESS TRACKING

### 8.1 Architecture
**Location**: `internal/videocore/effects.go`

```go
// Triggered on video events
case *VideoCompletedEvent:
    // Auto-update progress if enabled
    shouldUpdateProgress := vc.settings.Library.AutoUpdateProgress
    
    if shouldUpdateProgress {
        // Fetch current anime collection from AniList
        collection, err := vc.platformRef.Get().GetAnimeCollection(...)
        
        // Get list entry for this anime
        if listEntry, hasEntry := collection.GetListEntryFromAnimeId(mediaId) {
            // Only update if progress is higher
            if progress > *listEntry.Progress {
                // Update progress via AniList API
            }
        }
    }
```

### 8.2 Completion Logic
- **Threshold**: Configurable (default ~85%)
- **Duplicate Prevention**: Compares with last recorded progress
- **API Integration**: Updates AniList collection directly
- **Discord Integration**: Updates Discord RPC presence during playback

---

## KEY INSIGHTS FOR SKY-MOVIE IMPROVEMENT

### 1. **Modular Player Architecture**
- ✅ Separate concerns: Player lifecycle, streaming, progress tracking
- ✅ Interface-based stream types for easy extension
- ✅ Event-driven for responsive UI updates

### 2. **Robust Subtitle Pipeline**
- ✅ Separate subtitle streaming from video streaming
- ✅ Format auto-detection and conversion (ASS ↔ VTT)
- ✅ Font serving from container attachments
- ✅ Configurable batching per stream type

### 3. **Smart Buffering Strategy**
- ✅ Different strategies for local files vs. torrents vs. HTTP
- ✅ Dynamic batch sizing based on stream responsiveness
- ✅ Resume optimization for seeking operations

### 4. **Error Resilience**
- ✅ Fallback chain for torrent streams (local first, then P2P)
- ✅ HTTP range request support for resumable playback
- ✅ Graceful degradation on codec/format issues

### 5. **Codec & Format Support**
- ✅ Delegate codec handling to player (browser/MPV/VLC)
- ✅ Metadata parsing for track selection
- ✅ RFC 6381 codec hints for browser compatibility

### 6. **Testing Patterns**
- ✅ Mock event system for testing
- ✅ Optional patterns prevent nil panics
- ✅ Options builder pattern simplifies testing

---

## 9. FRONTEND: VIDEOCORE IMPLEMENTATION

### 9.1 VideoCore Component Architecture

**Main Component Location**: `seanime-web/src/app/(main)/_features/video-core/`

#### Core Files
- `video-core.tsx` - Main player component (~1000+ lines)
- `video-core.atoms.ts` - Jotai state management
- `video-core-hls.ts` - HLS streaming handler
- `video-core-subtitles.ts` - JASSUB subtitle renderer
- `video-core-events.ts` - Event system
- `native-player.tsx` - Alternative native player implementation

### 9.2 Base Video Element

```tsx
<video
    data-vc-element="video"
    data-video-core-element
    crossOrigin="anonymous"
    preload="auto"
    src={streamUrl && !streamUrl.includes(".m3u8") ? streamUrl : undefined}
    ref={videoRef}
    tabIndex={0}
    onLoadedMetadata={handleLoadedMetadata}
    onTimeUpdate={handleTimeUpdate}
    onEnded={handleEnded}
    onPlay={handlePlay}
    onPause={handlePause}
    onError={handleError}
    autoPlay={autoPlayEnabled}
    muted={mutedState}
    playsInline
    controls={false}  // ← Custom controls via React
    style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        filter: videoEnhancementFilters,
        imageRendering: "crisp-edges"
    }}
>
    {/* Subtitle tracks embedded for MKV files */}
    {mkvMetadata?.subtitleTracks?.map(track => (
        <track
            id={track.number.toString()}
            kind="subtitles"
            srcLang={track.language || "eng"}
            label={track.name}
        />
    ))}
</video>
```

**Key Design Decisions**:
- ✅ `controls={false}` for complete UI customization
- ✅ `crossOrigin="anonymous"` for CORS compatibility
- ✅ `playsInline` for mobile playback
- ✅ `imageRendering: "crisp-edges"` for anime quality
- ✅ `objectFit: "contain"` to preserve aspect ratio

### 9.3 HLS Stream Handling (hls.js)

**Dependencies**: `hls.js` v1.6.16

```tsx
const hls = new Hls({
    enableWorker: true,           // Use Web Worker for parsing
    lowLatencyMode: false,        // Standard latency (not livestream)
    backBufferLength: 90,         // 90 seconds buffering
    enableWebVTT: true,           // VTT subtitle support
    renderTextTracksNatively: false // ← Use JASSUB instead
})

// Attach to video element
hls.attachMedia(videoElement)

// Load HLS manifest
hls.loadSource(streamUrl)

// Quality selection
hls.on(Events.MANIFEST_PARSED, (event, data) => {
    // Extract quality levels
    const levels: HlsQualityLevel[] = data.levels.map((level, index) => ({
        index,
        height: level.height,
        width: level.width,
        bitrate: level.bitrate,
        name: `${level.height}p`
    }))
})

// Manual quality control
hls.currentLevel = selectedQualityIndex

// Audio track selection
hls.audioTrack = selectedAudioTrackId
```

**Stream Type Detection**:
```tsx
export function isHLSSrc(src: string): boolean {
    return /\.(m3u8)($|\?)/i.test(src)
}

export function isNativeVideoExtension(src: string): boolean {
    return /\.(mp4|avi|3gp|ogg)($|\?)/i.test(src)
}
```

### 9.4 Subtitle System (JASSUB)

**Dependencies**: `jassub` v2.5.1

#### Subtitle Manager Class
```tsx
export class VideoCoreSubtitleManager extends EventTarget {
    libassRenderer: JASSUB | null = null
    pgsRenderer: VideoCorePgsRenderer | null = null
    
    // Track management
    private eventTracks: Record<string, MKVTrack>      // From MKV metadata
    private fileTracks: Record<string, FileTrack>      // External files
    private pgsEventTracks: Record<string, PGSTrack>   // Bitmap subtitles
    
    // Configuration
    private settings: VideoCoreSettings
    private translationTargetLang: string | null
}
```

#### JASSUB Configuration
```tsx
const jassubConfig = {
    wasmURL: "/jassub/jassub-worker-modern.wasm",     // Modern browsers
    fallbackURL: "/jassub/jassub-worker.wasm",        // Older browsers
    workerURL: "/jassub/jassub-worker.js",
    offscreenRender: boolean,  // GPU vs CPU rendering
}

// Default ASS header for styling
const defaultHeader = `[Script Info]
Title: English (US)
ScriptType: v4.00+
PlayResX: 640
PlayResY: 360

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, ...
Style: Default, Roboto Medium, 24, &H00FFFFFF, &H000000FF, ...
[Events]
`
```

#### Subtitle Event Buffering
```tsx
// Accumulate events and flush periodically
const subtitleBufferRef = useRef<MKVParser_SubtitleEvent[]>([])
const SUBTITLE_FLUSH_INTERVAL_MS = 300

// Flush on idle or timeout
if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(() => {
        flushSubtitleBuffer()
    }, { timeout: 300 })
}
```

### 9.5 State Management (Jotai)

#### Player State Atoms
```tsx
// Playback
export const vc_duration = atom(1)
export const vc_currentTime = atom(0)
export const vc_playbackRate = atom(1)
export const vc_readyState = atom(0)
export const vc_buffering = atom(false)
export const vc_paused = atom(true)
export const vc_ended = atom(false)

// Video Element
export const vc_videoElement = atom<HTMLVideoElement | null>(null)
export const vc_containerElement = atom<HTMLDivElement | null>(null)

// Audio/Volume
export const vc_isMuted = atom(false)
export const vc_volume = atom(1)

// HLS State
export const vc_hlsQualityLevels = atom<HlsQualityLevel[]>([])
export const vc_hlsCurrentQuality = atom<number>(-1)
export const vc_hlsSetQuality = atom<((level: number) => void) | null>(null)
export const vc_hlsAudioTracks = atom<HlsAudioTrack[]>([])
export const vc_hlsCurrentAudioTrack = atom<number>(-1)
export const vc_hlsSetAudioTrack = atom<((trackId: number) => void) | null>(null)

// UI State
export const vc_isFullscreen = atom(false)
export const vc_miniPlayer = atom(false)
export const vc_seeking = atom(false)
export const vc_timeRanges = atom<TimeRanges | null>(null)

// Managers
export const vc_subtitleManager = atom<VideoCoreSubtitleManager | null>(null)
export const vc_audioManager = atom<VideoCoreAudioManager | null>(null)
export const vc_pipManager = atom<VideoCorePipManager | null>(null)
```

#### Scoped Provider for Isolation
```tsx
<VideoCoreProvider id="player-1">
    <ScopeProvider atoms={[...]}>
        {/* All atoms scoped to this provider instance */}
        {children}
    </ScopeProvider>
</VideoCoreProvider>
```

**Benefit**: Multiple player instances (sidebar, PiP, multi-view) without state conflicts.

### 9.6 Event System

**Event Types Sent to Backend**:
```tsx
type VideoCoreClientEvent = 
    | "video-fullscreen"
    | "video-subtitle-track"
    | "video-media-caption-track"
    | "video-audio-track"
    | "video-anime4k"
    | "video-skip-data"
```

### 9.7 Control Components

**Desktop Controls**:
- `VideoCorePlayButton` - Play/pause
- `VideoCoreVolumeButton` - Volume control
- `VideoCoreTimestamp` - Time display
- `VideoCoreFullscreenButton` - Fullscreen toggle
- `VideoCorePipButton` - Picture-in-picture
- `VideoCorePlaylistControl` - Episode selection
- `VideoCoreSettingsMenu` - Video enhancements, playback options
- `VideoCoreResolutionMenu` - Quality selection
- `VideoCoreSubtitleMenu` - Subtitle track selection
- `VideoCoreAudioMenu` - Audio track selection
- `VideoCoreCastButton` - Chromecast support

**Mobile Controls**:
```tsx
<VideoCoreMobileControlBar
    topLeftSection={...}
    topRightSection={...}
    bottomLeftSection={...}
    bottomRightSection={...}
/>
```

### 9.8 Advanced Features

#### 1. Video Enhancement Filters
```tsx
filter: videoEnhancementEnabled 
    ? `contrast(${contrast}) saturate(${saturation}) brightness(${brightness})`
    : "none"
```

#### 2. Anime4K Upscaling
- Library: `anime4k-webgpu`
- GPU acceleration via WebGPU
- Customizable upscaling models

#### 3. Mobile Gestures
- Swipe seeking (horizontal)
- Volume control (vertical)
- Brightness adjustment (vertical)

#### 4. Keyboard Shortcuts
- Space: Play/Pause
- Arrow keys: Seeking
- M: Mute toggle
- F: Fullscreen
- Customizable via `VideoCoreKeybindingController`

#### 5. Picture-in-Picture (PiP)
- `VideoCorePipManager`
- Exit overlay button

#### 6. AniSkip Integration
- Skip opening button
- Skip ending button
- Data from AniSkip database

#### 7. Watch Party
- Real-time sync via WebSocket
- Chat integration
- Multiple concurrent viewers

#### 8. Fullscreen Support
- Native fullscreen API
- iOS fullscreen handling
- Subtitle positioning in fullscreen

### 9.9 Usage Pattern

```tsx
// Pages: onlinestream-page.tsx, mediastream/page.tsx

<VideoCoreProvider id="onlinestream">
    <VideoCore
        id="onlinestream"
        state={videoCoreState}
        aniSkipData={skipData}
        onTerminateStream={handleTerminate}
        onEnded={handleEnded}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onError={handleError}
        // ... other callbacks
    />
</VideoCoreProvider>
```

### 9.10 Performance Optimizations

1. **Lazy Loading**: Subtitle renderers loaded on-demand
2. **Event Buffering**: 300ms flush interval for subtitle events
3. **Web Worker**: HLS parsing in separate thread
4. **CSS Filters**: Video enhancement via GPU filters, not canvas
5. **Scoped Atoms**: Prevent unnecessary re-renders of unrelated components

---

## RECOMMENDED NEXT STEPS

1. **Add Stream Adapter**: Create generic stream wrapper similar to Seanime's `Stream` interface
2. **Implement Buffering Strategies**: Copy Seanime's subtitle flush config approach
3. **Add Subtitle Format Support**: Implement ASS/VTT conversion pipeline
4. **Create Event System**: Adopt Seanime's event bus pattern for player lifecycle
5. **Add Continuity Manager**: Implement watch position recovery
6. **Implement Font Serving**: Load fonts from MKV attachments for libass rendering
7. **Integrate HLS Support**: Use hls.js for streaming sources
8. **Add JASSUB Subtitles**: Support advanced subtitle rendering for ASS/SSA formats

