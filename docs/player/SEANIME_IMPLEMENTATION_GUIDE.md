# Implementation Guide: Adopting Seanime's Video Player Patterns

## Quick Reference: What to Implement

### PRIORITY 1: Core Infrastructure (Foundation)

#### 1.1 Stream Interface
**File**: Create `player/stream.ts` or similar

```typescript
// Abstract unified interface for all stream types
interface VideoStream {
  type(): StreamType;  // 'torrent' | 'file' | 'http' | 'debrid'
  loadContentType(): Promise<string>;  // 'video/mp4' | 'video/x-matroska'
  loadPlaybackInfo(): Promise<PlaybackInfo>;
  getStreamUrl(): string;
  onError(error: Error): void;
  terminate(): Promise<void>;
}

// Concrete implementations
class LocalFileStream implements VideoStream { }
class TorrentStream implements VideoStream { }
class HTTPStream implements VideoStream { }  // HTTP/Debrid
```

**Seanime Reference**: `internal/directstream/stream.go`

#### 1.2 Event Bus System
**File**: Create `player/events.ts`

```typescript
// Non-blocking event dispatcher
class PlayerEventBus {
  private eventQueue: VideoEvent[] = [];
  private subscribers: Map<EventType, Subscriber[]> = new Map();
  
  dispatch(event: VideoEvent): void {
    // Queue event, don't block
    this.eventQueue.push(event);
    this.process();  // Async processing
  }
  
  subscribe(eventType: EventType, callback: EventHandler): Unsubscribe {
    // Non-blocking subscription
  }
}

// Event types (see VideoCore in Seanime)
type VideoEvent = 
  | VideoLoadedEvent
  | VideoMetadataLoadedEvent
  | VideoCanPlayEvent
  | VideoPausedEvent
  | VideoResumedEvent
  | VideoStatusEvent
  | VideoCompletedEvent
  | VideoErrorEvent
  | VideoTerminatedEvent;
```

**Seanime Reference**: `internal/videocore/videocore.go` - `eventBus` and `eventDispatcher`

---

### PRIORITY 2: Codec & Metadata Handling

#### 2.1 Track Information Parser
**File**: Create `parser/metadata-parser.ts`

```typescript
interface TrackInfo {
  number: number;
  type: 'video' | 'audio' | 'subtitle';
  codecId: string;      // 'V_UNCOMPRESSED', 'A_AAC', 'S_TEXT/ASS'
  language?: string;    // IETF BCP 47
  name?: string;
  default: boolean;
  forced: boolean;
  enabled: boolean;
  codecPrivate?: string;  // Base64 codec-specific data
  
  // Video specific
  width?: number;
  height?: number;
  
  // Audio specific
  channels?: number;
  sampleRate?: number;
}

interface VideoMetadata {
  title?: string;
  duration: number;
  tracks: TrackInfo[];
  videoTracks: TrackInfo[];
  audioTracks: TrackInfo[];
  subtitleTracks: TrackInfo[];
  chapters: ChapterInfo[];
  attachments: AttachmentInfo[];  // Fonts for subtitles
  mimeCodec?: string;  // RFC 6381: "hvc1.1.6.L123.B0"
}

// Parser for MKV containers
class MKVMetadataParser {
  async parse(buffer: ArrayBuffer): Promise<VideoMetadata> {
    // EBML parsing
  }
}
```

**Seanime Reference**: `internal/mkvparser/metadata.go`, `internal/mkvparser/structs.go`

#### 2.2 Codec Detection
**Key Insight**: Don't implement codec support in backend!

```typescript
// Server just detects and reports capabilities
class CodecDetector {
  async getCodecInfo(stream: VideoStream): Promise<{
    video: string;      // e.g., "hvc1" or "avc1"
    audio: string;      // e.g., "mp4a.40.2"
    rfc6381: string;    // e.g., "video/mp4;codecs=\"hvc1.1.6.L123.B0\""
  }> {
    const metadata = await stream.loadPlaybackInfo();
    return {
      // Return codec IDs from metadata
      // Let BROWSER/MPV decide if they support it
    };
  }
}
```

---

### PRIORITY 3: Subtitle Management

#### 3.1 Subtitle Track Handler
**File**: Create `player/subtitles.ts`

```typescript
interface VideoSubtitleTrack {
  index: number;
  src?: string;           // URL to fetch from
  content?: string;       // Actual subtitle data
  label: string;
  language: string;
  type?: 'srt' | 'vtt' | 'ass' | 'ssa';
  default?: boolean;
  useLibassRenderer?: boolean;  // Use libass for ASS/SSA
}

interface SubtitleEvent {
  trackUID: number;
  start: number;          // seconds
  duration: number;
  content: string;
  index: number;
  isForced: boolean;
  isDefault: boolean;
}

class SubtitleManager {
  // Extract subtitles from video stream
  async extractSubtitleTracks(stream: VideoStream): Promise<VideoSubtitleTrack[]> {
    const metadata = await stream.loadPlaybackInfo();
    return metadata.subtitleTracks;
  }
  
  // Convert between formats
  async convertSubtitleFormat(
    content: string, 
    from: 'ass' | 'srt' | 'vtt',
    to: 'ass' | 'vtt'
  ): Promise<string> {
    // ASS ↔ VTT conversion
  }
  
  // Extract subtitle events from file
  async parseSubtitleEvents(content: string): Promise<SubtitleEvent[]> {
    // Parse ASS/SRT/VTT and extract timing events
  }
}
```

**Seanime Reference**: `internal/videocore/subtitles.go`, `internal/directstream/subtitles.go`

#### 3.2 Adaptive Subtitle Flushing
**Key Pattern**: Different flush rates per stream type

```typescript
interface SubtitleFlushConfig {
  flushInterval: number;      // ms
  maxBatchSize: number;       // events per batch
  sleepAfterFullBatch: number;  // ms
  minSendInterval?: number;   // ms
}

function getFlushConfigFor(
  streamType: StreamType,
  offset: number
): SubtitleFlushConfig {
  if (streamType === 'file') {
    // Local files: aggressive buffering
    return {
      flushInterval: 300,
      maxBatchSize: 50,
      sleepAfterFullBatch: 500,
    };
  }
  
  if (streamType === 'torrent') {
    // Torrents: conservative (unpredictable)
    if (offset > 0) {
      return {
        flushInterval: 100,
        maxBatchSize: 35,
        sleepAfterFullBatch: 50,
        minSendInterval: 75,
      };
    }
    return {
      flushInterval: 250,
      maxBatchSize: 25,
      sleepAfterFullBatch: 100,
      minSendInterval: 100,
    };
  }
  
  // HTTP streams: standard
  return {
    flushInterval: 200,
    maxBatchSize: 30,
    sleepAfterFullBatch: 200,
  };
}
```

**Seanime Reference**: `internal/directstream/subtitles.go` - `subtitleFlushConfigFor` function

---

### PRIORITY 4: HTTP Streaming & Buffering

#### 4.1 Range Request Handler
**File**: Create `streaming/range-request-handler.ts`

```typescript
class RangeRequestHandler {
  async serveRange(
    request: Request,
    stream: VideoStream,
    contentLength: number
  ): Promise<Response> {
    const rangeHeader = request.headers.get('Range');
    
    if (!rangeHeader) {
      // Simple response
      return this.serveSimple(stream);
    }
    
    // Parse: "bytes=0-1023"
    const [start, end] = this.parseRange(rangeHeader, contentLength);
    
    // Serve partial content with 206 status
    return this.servePartial(stream, start, end, contentLength);
  }
  
  private servePartial(
    stream: VideoStream,
    start: number,
    end: number,
    total: number
  ): Response {
    return new Response(stream.getStreamReader(start, end), {
      status: 206,  // Partial Content
      headers: {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Content-Length': String(end - start + 1),
        'Accept-Ranges': 'bytes',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-store',
      },
    });
  }
}
```

**Seanime Reference**: `internal/directstream/stream_helpers.go` - `handleRange` function

#### 4.2 Smart Caching
**Concept**: File-backed cache for HTTP streams (like `streamcache`)

```typescript
class StreamCache {
  private cache: Map<string, CacheEntry> = new Map();
  private tempFiles: Map<string, string> = new Map();  // URL → temp file path
  
  async getOrFetch(url: string, headers: Record<string, string>): Promise<ArrayBuffer> {
    // Check memory cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!.data;
    }
    
    // Check disk cache (temp file)
    // If not exists, fetch and cache
  }
  
  // Keep cache size bounded
  private evictLRU(): void {
    // Remove least recently used
  }
}
```

**Seanime Reference**: Uses `github.com/neilotoole/streamcache`

---

### PRIORITY 5: Playback State Management

#### 5.1 Playback Info Structure
**File**: Create `types/playback.ts`

```typescript
interface PlaybackInfo {
  id: string;                        // Unique playback session ID
  playbackType: PlaybackType;        // 'localfile' | 'torrent' | 'http' | 'debrid'
  streamUrl: string;
  streamPath?: string;               // e.g., "/anime/episode01.mkv"
  
  // For native players only
  mkvMetadata?: VideoMetadata;
  
  // Subtitles
  subtitleTracks: VideoSubtitleTrack[];
  libassFonts: VideoLibassFont[];    // For ASS rendering
  videoSources: VideoSource[];       // Multi-quality options
  selectedVideoSource?: number;
  
  // Resume state
  initialState?: {
    currentTime?: number;
    paused?: boolean;
  };
  
  // Media context
  media: AnimeMetadata;
  episode: EpisodeMetadata;
  
  // Watch party (Nakama)
  isNakamaWatchParty?: boolean;
}

interface PlaybackStatus {
  id: string;
  clientId: string;
  paused: boolean;
  currentTime: number;
  duration: number;
}

interface PlaybackState {
  clientId: string;
  playerType: 'native' | 'web';
  playbackInfo: PlaybackInfo;
}
```

**Seanime Reference**: `internal/nativeplayer/nativeplayer.go` - `PlaybackInfo` struct

#### 5.2 Playback Manager
**File**: Create `playback/manager.ts`

```typescript
class PlaybackManager {
  private currentPlayback: PlaybackInfo | null = null;
  private eventBus: PlayerEventBus;
  private continuityManager: ContinuityManager;
  
  async beginPlayback(
    clientId: string,
    stream: VideoStream,
    media: AnimeMetadata,
    episode: EpisodeMetadata
  ): Promise<void> {
    // 1. Terminate previous playback
    if (this.currentPlayback) {
      await this.terminatePlayback();
    }
    
    // 2. Load playback info
    const playbackInfo = await stream.loadPlaybackInfo();
    
    // 3. Restore from continuity (watch position)
    const savedPosition = await this.continuityManager.get(media.id, episode.id);
    if (savedPosition) {
      playbackInfo.initialState = {
        currentTime: savedPosition,
        paused: false,
      };
    }
    
    // 4. Send event to client
    this.eventBus.dispatch(new PlaybackStateEvent(clientId, playbackInfo));
  }
  
  async terminatePlayback(): Promise<void> {
    if (!this.currentPlayback) return;
    
    // 1. Save current position
    await this.continuityManager.save(
      this.currentPlayback.media.id,
      this.currentPlayback.episode.id,
      this.currentTime
    );
    
    // 2. Cleanup resources
    await this.currentPlayback.cleanup();
    
    // 3. Notify subscribers
    this.eventBus.dispatch(new VideoTerminatedEvent());
  }
}
```

**Seanime Reference**: `internal/directstream/manager.go`

---

### PRIORITY 6: Error Handling & Fallbacks

#### 6.1 Error Recovery
**File**: Create `player/error-handler.ts`

```typescript
class PlayerErrorHandler {
  async handleStreamError(error: Error, stream: VideoStream): Promise<void> {
    const streamType = stream.type();
    
    switch (streamType) {
      case 'torrent':
        // Try fallback to completed local file
        const localFile = await stream.tryLocalFallback();
        if (localFile) {
          this.notifyRetry('Using local file as fallback');
          return;
        }
        break;
        
      case 'http':
        // Retry with exponential backoff
        await this.retryWithBackoff(stream, 3);
        return;
    }
    
    // Unrecoverable error
    this.eventBus.dispatch(new VideoErrorEvent(error));
  }
  
  private async retryWithBackoff(
    stream: VideoStream,
    maxRetries: number
  ): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await stream.reconnect();
        this.notifyRetry(`Reconnected (attempt ${i + 1})`);
        return;
      } catch (e) {
        const delay = Math.pow(2, i) * 1000;  // Exponential: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Failed to recover stream after retries');
  }
}
```

**Seanime Reference**: `internal/directstream/manager.go` - `StreamError` interface

#### 6.2 Torrent Fallback Chain
**Location**: Integrate into `TorrentStream`

```typescript
class TorrentStream implements VideoStream {
  async loadPlaybackInfo(): Promise<PlaybackInfo> {
    // 1. Check if fully downloaded locally
    const localPath = await this.completedFilePath();
    if (localPath) {
      return this.loadFromLocalFile(localPath);
    }
    
    // 2. Fall back to live torrent streaming
    return this.loadFromTorrentStream();
  }
  
  private async completedFilePath(): Promise<string | null> {
    // Check: {downloadDir}/{infoHash}/{filePath}
    // Verify file size matches torrent
  }
}
```

**Seanime Reference**: `internal/directstream/torrentstream.go` - `completedFilePath` method

---

### PRIORITY 7: Progress Tracking & Integration

#### 7.1 Continuity Manager
**File**: Create `playback/continuity-manager.ts`

```typescript
interface WatchPosition {
  animeId: number;
  episodeId: string;
  currentTime: number;
  duration: number;
  lastUpdated: Date;
  completed: boolean;
}

class ContinuityManager {
  private db: Database;  // Local storage or API
  
  async save(
    animeId: number,
    episodeId: string,
    currentTime: number,
    duration: number
  ): Promise<void> {
    await this.db.save({
      animeId,
      episodeId,
      currentTime,
      duration,
      lastUpdated: new Date(),
    });
  }
  
  async get(animeId: number, episodeId: string): Promise<WatchPosition | null> {
    return this.db.get(animeId, episodeId);
  }
  
  async markCompleted(animeId: number, episodeId: string): Promise<void> {
    const position = await this.get(animeId, episodeId);
    if (position) {
      position.completed = true;
      await this.save(animeId, episodeId, position.currentTime, position.duration);
    }
  }
}
```

#### 7.2 Auto-Progress Update on Completion
**File**: Create `playback/effects.ts`

```typescript
class PlaybackEffects {
  constructor(
    private eventBus: PlayerEventBus,
    private anilistApi: AniListApi,
    private continuityManager: ContinuityManager
  ) {
    this.subscribeToEvents();
  }
  
  private subscribeToEvents(): void {
    this.eventBus.subscribe('video-completed', (event: VideoCompletedEvent) => {
      this.onVideoCompleted(event);
    });
    
    this.eventBus.subscribe('video-error', (event: VideoErrorEvent) => {
      this.onVideoError(event);
    });
  }
  
  private async onVideoCompleted(event: VideoCompletedEvent): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.autoUpdateProgress) return;
    
    // Get anime collection
    const collection = await this.anilistApi.getCollection();
    const listEntry = collection.find(e => e.media.id === event.media.id);
    
    if (!listEntry) return;
    
    // Update if progress is higher
    const newProgress = event.episode.number;
    if (newProgress > listEntry.progress) {
      await this.anilistApi.updateProgress(event.media.id, newProgress);
      
      // Mark as completed locally
      await this.continuityManager.markCompleted(event.media.id, event.episode.id);
    }
  }
  
  private async onVideoError(event: VideoErrorEvent): Promise<void> {
    // Log error, clean up resources
    console.error('Playback error:', event.error);
  }
}
```

**Seanime Reference**: `internal/videocore/effects.go` - `setupSharedEffects` function

---

## Implementation Checklist

### Phase 1: Foundation (Weeks 1-2)
- [ ] Create Stream interface (all types inherit from it)
- [ ] Implement LocalFileStream, HTTPStream
- [ ] Create PlayerEventBus
- [ ] Define VideoEvent types

### Phase 2: Metadata (Weeks 2-3)
- [ ] Implement MKV parser (or use library)
- [ ] Create TrackInfo structures
- [ ] Extract codec information

### Phase 3: Subtitles (Weeks 3-4)
- [ ] Implement SubtitleManager
- [ ] Add format conversion (ASS ↔ VTT)
- [ ] Implement adaptive flushing
- [ ] Font serving from attachments

### Phase 4: Streaming (Weeks 4-5)
- [ ] Implement RangeRequestHandler
- [ ] Add StreamCache
- [ ] Test with various stream sources

### Phase 5: Playback (Weeks 5-6)
- [ ] Create PlaybackManager
- [ ] Implement ContinuityManager
- [ ] Add PlaybackEffects (auto-progress)

### Phase 6: Error Handling (Weeks 6-7)
- [ ] Implement PlayerErrorHandler
- [ ] Add torrent fallback logic
- [ ] Test error scenarios

---

## Testing Strategy

### Unit Tests
- Stream interface implementations
- Metadata parser
- Subtitle format conversion
- Range request parsing

### Integration Tests
- Full playback flow: stream → metadata → playback
- Subtitle streaming with adaptive flushing
- Progress tracking and recovery

### E2E Tests
- Local file playback
- HTTP stream playback
- Torrent stream (mocked)
- Subtitle synchronization
- Auto-progress update

---

## Performance Considerations

1. **Metadata Parsing**: Cache parsed metadata (EBML parsing is slow)
2. **Subtitle Flushing**: Tune flush intervals per stream type
3. **HTTP Caching**: Use file-backed cache for large files
4. **Event Processing**: Don't block on slow subscribers
5. **Memory**: Stream data, don't load entire video into RAM

