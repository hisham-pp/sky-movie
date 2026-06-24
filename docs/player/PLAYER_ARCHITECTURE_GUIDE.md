# Sky Movie Player Architecture - Seanime Patterns Applied

## Overview

This document outlines the refactored player architecture based on proven patterns from the **Seanime** video player. The improvements enable better codec support, error handling, and streaming capabilities.

---

## Architecture Layers

### Layer 1: Stream Abstraction (`stream.ts`)
**Pattern**: Unified Stream Interface from Seanime

**Problem Solved**: Allows uniform handling of different source types (local files, HTTP, torrents)

**Key Components**:
- `VideoStream` interface - abstract interface for all source types
- `LocalFileStream` - local file implementation
- `HTTPStream` - HTTP/HTTPS streaming implementation
- `TrackInfo` - unified track metadata format
- `VideoMetadata` - complete media information

**Usage**:
```typescript
const stream: VideoStream = new LocalFileStream(filePath);
const metadata = await stream.getMetadata();
const tracks = metadata.audioTracks; // Handle all track types uniformly
```

**Benefits**:
- Easy to add new stream types (Torrent, Debrid, etc.)
- Consistent API regardless of source
- Future-proof for streaming services

---

### Layer 2: Event Bus (`eventBus.ts`)
**Pattern**: Non-blocking Event Dispatcher from Seanime's VideoCore

**Problem Solved**: Prevents UI freezing during playback events, decouples components

**Key Components**:
- `PlayerEventBus` - event queue and dispatcher
- `VideoEvent` types - 18+ event types
- Non-blocking event processing with batch support

**Events Supported**:
- Loading: `video:loading`, `video:loaded`, `video:metadata-loaded`
- Playback: `video:playing`, `video:paused`, `video:time-update`
- Tracks: `track:audio-changed`, `track:subtitle-changed`
- Completion: `video:ended`, `video:completed`
- Errors: `video:error`, `video:terminated`

**Usage**:
```typescript
const eventBus = new PlayerEventBus();

// Subscribe to events
eventBus.subscribe('video:time-update', (event) => {
  updateProgress(event.data.currentTime);
});

// Dispatch events (non-blocking)
eventBus.dispatch({
  type: 'video:time-update',
  data: { currentTime: 45.5, duration: 120 }
});
```

**Benefits**:
- No UI blocking during event processing
- Async handlers supported
- Decoupled event producers and consumers
- Easy to add new event types

---

### Layer 3: Adaptive Buffering (`buffering.ts`)
**Pattern**: Intelligent Buffering by Stream Type from Seanime

**Problem Solved**: Optimizes streaming based on source type, prevents buffer exhaustion

**Key Components**:
- `BufferingConfig` - configuration for each stream type
- `AdaptiveBufferingManager` - manages buffering with intelligent flushing
- Pre-configured configs for local files, HTTP, torrents

**Configurations**:
| Stream Type | Flush Interval | Max Batch | Sleep After |
|------------|----------------|-----------|-------------|
| Local File | 300ms | 50 | 500ms |
| HTTP | 200ms | 30 | 200ms |
| Torrent | 250ms | 25 | 100ms |
| Debrid | 200ms | 30 | 200ms |

**Usage**:
```typescript
const bufferingMgr = new AdaptiveBufferingManager('http', async (batch) => {
  await sendToPlayer(batch);
});

await bufferingMgr.buffer(dataChunk, sizeInBytes);
// Automatically flushes based on batch size or interval
```

**Benefits**:
- Optimized for each stream type
- Prevents CPU spinning
- Handles backpressure automatically
- Easy to adjust for network conditions

---

### Layer 4: Error Recovery (`recovery.ts`)
**Pattern**: Error Recovery with Fallback Chains from Seanime

**Problem Solved**: Graceful degradation with exponential backoff and codec detection

**Key Components**:
- `ErrorRecoveryStrategy` - retry and fallback configuration
- `RetryManager` - handles exponential backoff
- `FallbackChainExecutor` - executes fallback sequence
- `CodecCompatibilityChecker` - detects codec support

**Error Types Supported**:
- `MEDIA_ERR_ABORTED` - retry once
- `MEDIA_ERR_NETWORK` - retry 3 times with exponential backoff
- `MEDIA_ERR_DECODE` - no retry, fallback to external player
- `MEDIA_ERR_SRC_NOT_SUPPORTED` - no retry, fallback to external player

**Usage**:
```typescript
const retryMgr = new RetryManager('MEDIA_ERR_NETWORK');

if (retryMgr.shouldRetry()) {
  const delay = retryMgr.getNextRetryDelay();
  setTimeout(() => retryStream(), delay);
} else {
  const fallback = retryMgr.getFallbackAction(); // 'external-player'
}
```

**Benefits**:
- Automatic retry with backoff
- Clear fallback strategies
- Codec detection prevents futile retries
- Easy to configure recovery behavior

---

### Layer 5: Existing Utilities (Enhanced)

#### `trackManagement.ts` (Existing)
- Enhanced to work with new `TrackInfo` structure
- Better audio/subtitle handling
- Ready for multi-track switching

#### `errorHandling.ts` (Existing)
- Now works with recovery strategies
- Integrates with codec checker
- Provides detailed diagnostics

#### `progressTracking.ts` (Existing)
- Unchanged, still handles watch position
- Compatible with new event bus

#### `playerConfig.ts` (Existing)
- Ready for integration with event bus
- Can dispatch events from settings changes

---

## Refactored Component

### `usePlayer.ts` Hook

The custom hook now uses the new architecture:

```typescript
const { containerRef, playbackError } = usePlayer(player, onOpenExternal);
```

**Integration Points**:
1. ✅ Initializes `PlayerEventBus` for non-blocking events
2. ✅ Uses `VideoStream` abstraction (ready for implementation)
3. ✅ Applies `AdaptiveBufferingManager` configuration
4. ✅ Uses `RetryManager` for error recovery
5. ✅ Integrated with `CodecCompatibilityChecker`

---

## Future Implementation Roadmap

### Phase 1: Core Integration (Current)
- ✅ Stream abstraction interface
- ✅ Event bus system
- ✅ Buffering configuration
- ✅ Error recovery strategies

### Phase 2: Stream Implementations
- [ ] Implement `LocalFileStream.getMetadata()` with MKV parsing
- [ ] Implement `HTTPStream` with range requests
- [ ] Add `TorrentStream` for P2P sources
- [ ] Add `DebridStream` for debrid services

### Phase 3: Advanced Features
- [ ] Subtitle extraction and caching
- [ ] HLS/DASH streaming support
- [ ] Codec auto-detection
- [ ] Network condition adaptation

### Phase 4: Performance Optimization
- [ ] Profile event bus performance
- [ ] Optimize buffering for different networks
- [ ] Implement intelligent prefetching
- [ ] Cache frequently played files

---

## Code Organization

```
src/renderer/src/
├── utils/player/
│   ├── types.ts              # Type definitions
│   ├── stream.ts             # Stream abstraction (NEW)
│   ├── eventBus.ts           # Event dispatcher (NEW)
│   ├── buffering.ts          # Buffering config (NEW)
│   ├── recovery.ts           # Error recovery (NEW)
│   ├── trackManagement.ts    # Track handling
│   ├── errorHandling.ts      # Error messages
│   ├── progressTracking.ts   # Watch progress
│   └── playerConfig.ts       # Player setup
├── hooks/
│   └── usePlayer.ts          # Main player hook (REFACTORED)
└── components/
    └── PlayerPanel.tsx       # UI component (SIMPLIFIED)
```

---

## Migration Guide for Future Changes

### Adding a New Stream Type

1. Create class in `stream.ts`:
```typescript
export class TorrentStream implements VideoStream {
  // Implement required methods
}
```

2. Use in hook or component:
```typescript
const stream = new TorrentStream(magnetLink);
const metadata = await stream.getMetadata();
```

### Adding New Event Types

1. Add to `VideoEventType` in `eventBus.ts`
2. Create specific event interface
3. Subscribe in component:
```typescript
eventBus.subscribe('my-new-event', (event) => {
  // Handle event
});
```

### Adjusting Buffering for Network Conditions

1. Update config in `buffering.ts`:
```typescript
BUFFERING_CONFIGS['http'].flushIntervalMs = 150; // More aggressive
```

2. Or dynamically adjust:
```typescript
bufferingMgr.updateConfig({
  flushIntervalMs: 150,
  maxBatchSize: 20
});
```

### Adding New Error Recovery

1. Add to `ERROR_RECOVERY_STRATEGIES`:
```typescript
'CUSTOM_ERROR': {
  maxRetries: 2,
  baseDelayMs: 500,
  maxDelayMs: 5000,
  recoverable: true,
  fallback: 'external-player'
}
```

---

## Performance Considerations

### Memory Usage
- Event queue size capped at 1000 events
- Buffering uses per-stream-type limits (15-50MB)
- Track metadata cached in memory

### CPU Usage
- Event processing yields to browser every 10 events
- Buffering sleeps after flush to prevent spinning
- Lazy evaluation of codecs

### Network
- Adaptive flushing reduces network overhead
- Range request support enables seeking without re-download
- Subtitle streaming independent from video

---

## Testing Recommendations

### Unit Tests
- `stream.ts` - test each stream type implementation
- `eventBus.ts` - test event queue, subscribers, async handlers
- `buffering.ts` - test flush timing, batch sizes, backpressure
- `recovery.ts` - test retry math, fallback chains

### Integration Tests
- `usePlayer.ts` - test full lifecycle with mock stream
- Error scenarios - test all recovery paths
- Event handling - test UI updates from events

### Performance Tests
- Buffer memory usage under load
- Event queue processing speed
- Network throughput with different configs

---

## References

- Seanime Project: https://github.com/5rahim/seanime
- [SEANIME_PLAYER_ANALYSIS.md](./SEANIME_PLAYER_ANALYSIS.md) - Detailed analysis
- [SEANIME_IMPLEMENTATION_GUIDE.md](./SEANIME_IMPLEMENTATION_GUIDE.md) - Code examples
