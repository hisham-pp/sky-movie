# Seanime Video Player Analysis - Documentation Index

This directory contains a comprehensive analysis of the Seanime video player implementation, extracted from their open-source codebase at `c:\workspace\projects\seanime-ref`.

## Documents

### 1. **SEANIME_EXECUTIVE_SUMMARY.md** ⭐ START HERE
   - High-level overview of the architecture
   - Key insights for each component
   - Quick reference table for buffering strategies
   - Recommended adoption priorities
   - **Read time**: 5-10 minutes

### 2. **SEANIME_PLAYER_ANALYSIS.md** 📊 DETAILED REFERENCE
   - Complete technical deep-dive
   - All 8 major components analyzed
   - Code examples from actual implementation
   - Design patterns explained
   - Sections:
     1. Player Architecture
     2. Video/Audio Codec Support
     3. Player UI Components & Configuration
     4. Error Handling & Fallback Mechanisms
     5. Streaming & Buffering Management
     6. Track & Subtitle Management
     7. Custom Video Player Libraries & Patterns
     8. Playback Progress Tracking
   - **Read time**: 30-45 minutes

### 3. **SEANIME_ARCHITECTURE_DIAGRAMS.md** 🎨 VISUAL REFERENCE
   - High-level flow diagrams
   - Subtitle streaming flow
   - External player flow
   - Progress tracking & effects system
   - Codec support decision tree
   - Use these to understand interactions between components
   - **Read time**: 10-15 minutes

### 4. **SEANIME_IMPLEMENTATION_GUIDE.md** 🛠️ PRACTICAL GUIDE
   - Step-by-step implementation instructions
   - TypeScript/Go code snippets
   - Organized by priority (7 phases)
   - Testing strategy included
   - Implementation checklist
   - Performance considerations
   - **Read time**: 20-30 minutes (reference while coding)

---

## Quick Navigation

### By Use Case

**"I want to understand the overall architecture"**
→ Start with: SEANIME_EXECUTIVE_SUMMARY.md
→ Then read: SEANIME_ARCHITECTURE_DIAGRAMS.md

**"I need to understand codec support"**
→ Go to: SEANIME_PLAYER_ANALYSIS.md, Section 2

**"I'm building error handling"**
→ Go to: SEANIME_PLAYER_ANALYSIS.md, Section 4
→ Implementation: SEANIME_IMPLEMENTATION_GUIDE.md, Section 6.1

**"I need to implement subtitles"**
→ Go to: SEANIME_PLAYER_ANALYSIS.md, Section 6
→ Implementation: SEANIME_IMPLEMENTATION_GUIDE.md, Section 3

**"I'm setting up buffering strategies"**
→ Go to: SEANIME_PLAYER_ANALYSIS.md, Section 5
→ Implementation: SEANIME_IMPLEMENTATION_GUIDE.md, Section 4

**"I need progress tracking"**
→ Go to: SEANIME_PLAYER_ANALYSIS.md, Section 7
→ Implementation: SEANIME_IMPLEMENTATION_GUIDE.md, Section 7

---

## Key Takeaways

### 1. Stream Interface Pattern
**Problem**: Multiple stream sources (torrent, HTTP, local file, debrid)
**Solution**: Single `Stream` interface implemented by all types
**Benefit**: Unified error handling, lifecycle management, metadata caching

### 2. Event Bus Architecture
**Problem**: Playback events need to be dispatched without blocking
**Solution**: Non-blocking async event bus with subscribers
**Benefit**: Responsive UI, decoupled event handlers

### 3. Adaptive Buffering
**Problem**: Different stream types need different flush rates
**Solution**: Configuration per stream type (local files vs. torrents vs. HTTP)
**Benefit**: Optimal responsiveness for each source type

### 4. Codec Delegation
**Problem**: Supporting all video/audio codecs is impractical
**Solution**: Backend extracts metadata, lets player decide codec support
**Benefit**: Smaller codebase, player-agnostic, automatic codec support

### 5. Subtitle Streaming Pipeline
**Problem**: Large MKV files with embedded subtitles
**Solution**: Extract subtitles while streaming video, batch and flush adaptively
**Benefit**: Streaming without downloading entire file

### 6. Error Fallback Chain
**Problem**: Streams can fail unpredictably
**Solution**: Fallback options (torrent → local file, HTTP → retry)
**Benefit**: Better user experience, graceful degradation

---

## Directory Structure

```
sky-movie/
├── SEANIME_EXECUTIVE_SUMMARY.md         ← Overview & quick reference
├── SEANIME_PLAYER_ANALYSIS.md           ← Detailed technical analysis
├── SEANIME_ARCHITECTURE_DIAGRAMS.md     ← Visual reference
├── SEANIME_IMPLEMENTATION_GUIDE.md      ← Practical coding guide
└── SEANIME_ANALYSIS_INDEX.md            ← This file
```

---

## Key Files in Seanime Repository

### Stream Management
- `internal/directstream/stream.go` - Stream interface
- `internal/directstream/manager.go` - Lifecycle management
- `internal/directstream/httpstream.go` - HTTP streams
- `internal/directstream/torrentstream.go` - Torrent streams
- `internal/directstream/localfile.go` - Local file streams

### Metadata & Codecs
- `internal/mkvparser/metadata.go` - MKV parsing
- `internal/mkvparser/structs.go` - Track information
- `internal/mkvparser/mkvparser.go` - EBML parser

### Subtitles & Effects
- `internal/directstream/subtitles.go` - Subtitle streaming
- `internal/videocore/subtitles.go` - Format conversion
- `internal/videocore/effects.go` - Event handlers
- `internal/videocore/videocore.go` - Event bus

### Player Integration
- `internal/mediaplayers/mediaplayer/repository.go` - Player abstraction
- `internal/mediaplayers/mpv/mpv.go` - MPV control
- `internal/mediaplayers/mpvipc/mpvipc.go` - IPC protocol
- `internal/nativeplayer/nativeplayer.go` - HTML5 player

### Handlers
- `internal/handlers/mediaplayer.go` - HTTP endpoints
- `internal/handlers/directstream.go` - Streaming endpoints

---

## Implementation Priority

### Phase 1: Foundation (Weeks 1-2) ⚡ Critical
- [ ] Stream interface
- [ ] PlayerEventBus
- [ ] Basic error handling

### Phase 2: Metadata (Weeks 2-3) 📊 Important
- [ ] MKV parser
- [ ] Track information extraction
- [ ] Codec detection

### Phase 3: Subtitles (Weeks 3-4) 📝 Important
- [ ] Subtitle manager
- [ ] Format conversion
- [ ] Adaptive flushing

### Phase 4: Streaming (Weeks 4-5) 🔄 Important
- [ ] Range requests
- [ ] Caching strategy
- [ ] Buffering config

### Phase 5: Playback (Weeks 5-6) ▶️ Standard
- [ ] PlaybackManager
- [ ] ContinuityManager
- [ ] Progress effects

### Phase 6: Error Handling (Weeks 6-7) 🛡️ Standard
- [ ] Error recovery
- [ ] Fallback chains
- [ ] Retry logic

### Phase 7: Integration (Weeks 7+) 🎯 Optional
- [ ] External player support
- [ ] Discord RPC
- [ ] Watch party sync

---

## Common Questions

**Q: Do I need to support all player types (MPV, VLC, etc.)?**
A: No, start with HTML5 player. External players are bonus integration.

**Q: Should I implement codec validation?**
A: No, delegate to player. Just extract and report metadata.

**Q: How do I handle large video files?**
A: HTTP Range requests + chunked streaming + metadata-only parsing.

**Q: Should I support all subtitle formats?**
A: Start with ASS/SRT. Others can be auto-converted.

**Q: How do I prevent UI freezing on buffering?**
A: Use non-blocking event bus + async processing.

---

## External References

- **Seanime GitHub**: https://github.com/5rahim/seanime
- **Seanime Docs**: https://seanime.app/docs
- **EBML Specification**: https://github.com/ietf-wg-cellar/ebml-specification
- **MKV Container Format**: https://www.matroska.org/technical/specs/index.html
- **RFC 6381 (Codec Strings)**: https://tools.ietf.org/html/rfc6381
- **MPV IPC Protocol**: https://mpv.io/manual/master/#json-ipc
- **HTTP Range Requests**: https://tools.ietf.org/html/rfc7233

---

## Notes

- All code examples are extracted from actual Seanime implementation
- Go code examples are directly from source; TypeScript examples show equivalent patterns
- This analysis focuses on player implementation, not on UI/UX
- Performance considerations are included where relevant

---

**Last Updated**: 2026-06-22
**Analysis Source**: Seanime Repository (c:\workspace\projects\seanime-ref)
**Target Project**: Sky-Movie (c:\workspace\projects\sky-movie)
