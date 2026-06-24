# Seanime Player Architecture Diagram

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (HTML5 Video Player)                        │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ VideoCore Event Subscribers                                           │   │
│  │ - VideoLoaded, MetadataLoaded, CanPlay                              │   │
│  │ - Paused, Resumed, Status, Completed, Error                        │   │
│  │ - SubtitleTrack, AudioTrack, Seeked                                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                   ▲                                          │
│                                   │                                          │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │ WebSocket
                                    │ Events
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SERVER BACKEND (Go)                                   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ VideoCore (internal/videocore/videocore.go)                        │   │
│  │                                                                     │   │
│  │  playbackStatus ──────┐                                            │   │
│  │  playbackState        ├─→ Event Bus → Dispatcher → Subscribers    │   │
│  │  playbackMkvEvents ───┘                   ▲                        │   │
│  │                                           │                        │   │
│  │  Effects/Hooks:                           │                        │   │
│  │  - Discord RPC presence update            │                        │   │
│  │  - Auto-progress update (AniList API)     │                        │   │
│  │  - Continuity manager (watch position)    │                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   ▲                                          │
│                                   │ coordinates                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ DirectStream Manager (internal/directstream/manager.go)            │   │
│  │                                                                     │   │
│  │ Stream Lifecycle:                                                  │   │
│  │ 1. BeginOpen(clientId) → Prepare stream                           │   │
│  │ 2. LoadPlaybackInfo() → Metadata + PlaybackInfo                  │   │
│  │ 3. ServeEchoStream() → HTTP range request handler                │   │
│  │ 4. Terminate() → Cleanup                                          │   │
│  │                                                                     │   │
│  │ Current State:                                                     │   │
│  │ - currentStream: mo.Option[Stream]                                │   │
│  │ - playbackCtx, playbackCtxCancelFunc                             │   │
│  │ - parserCache: *result.Cache[string, *MetadataParser]           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         ▲         ▲         ▲         ▲         ▲                           │
│         │         │         │         │         │                           │
│         ├─────────┼─────────┼─────────┼─────────┤                           │
│         │         │         │         │         │                           │
│  ┌──────┴───┬──────┴────┬─────┴────┬──────┴────┬─┴─────────────┐            │
│  │          │           │          │           │               │            │
│ ┌┴─────┐  ┌┴────────┐ ┌┴─────────┐┌┴────────┐ ┌┴──────────┐ ┌┴──────────┐ │
│ │Local │  │Torrent  │ │HTTP Base ││ Debrid  │ │   URL    │ │  Nakama  │ │
│ │File  │  │ Stream  │ │ Stream   ││ Stream  │ │ Stream   │ │ Stream   │ │
│ └──────┘  └──────────┘ └──────────┘└────────┘ └──────────┘ └──────────┘ │
│   ▲         ▲            ▲           ▲          ▲           ▲            │
│   │         │            │           │          │           │            │
│   └─────────┼────────────┴───────────┴──────────┴───────────┘            │
│             │                                                             │
│   ┌─────────┴──────────────────────────────────────────────────────┐     │
│   │  All Streams (BaseStream)                                      │     │
│   │                                                                │     │
│   │  Common Interface:                                             │     │
│   │  - Type() → StreamType                                         │     │
│   │  - LoadContentType() → "video/mp4", "video/x-matroska", etc  │     │
│   │  - LoadPlaybackInfo() → PlaybackInfo with metadata            │     │
│   │  - GetStreamHandler() → HTTP handler for range requests       │     │
│   │  - StreamError(err) → Error propagation to client             │     │
│   │  - Terminate() → Cleanup resources                            │     │
│   │                                                                │     │
│   │  Metadata Pipeline:                                            │     │
│   │  1. newMetadataReader() → io.ReadSeekCloser                  │     │
│   │  2. mkvparser.NewMetadataParser(reader)                      │     │
│   │  3. Parse: Tracks, Chapters, Attachments                     │     │
│   │  4. Build PlaybackInfo with SubtitleTracks, Fonts            │     │
│   └────────────────────────────────────────────────────────────────┘     │
│                             │                                             │
│                             ▼                                             │
│   ┌──────────────────────────────────────────────────────────────┐       │
│   │ MKV/EBML Parser (internal/mkvparser/)                        │       │
│   │                                                               │       │
│   │ Metadata {                                                   │       │
│   │   Tracks: [VideoTrack, AudioTrack, SubtitleTrack]           │       │
│   │   Chapters: [ChapterInfo]                                    │       │
│   │   Attachments: [AttachmentInfo] ← Fonts for ASS             │       │
│   │   MimeCodec: "hvc1.1.6.L123.B0" (RFC 6381)                 │       │
│   │ }                                                            │       │
│   └──────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Subtitle Streaming Flow

```
Client requests: GET /api/v1/directstream/stream?id=...

Server Response:
┌─────────────────────────────────────────────────────────────────┐
│ HTTP Headers:                                                    │
│ - Accept-Ranges: bytes                                          │
│ - Content-Type: video/x-matroska                               │
│ - Content-Length: 500000000                                     │
│ - Connection: keep-alive                                        │
│ - Cache-Control: no-store                                       │
└─────────────────────────────────────────────────────────────────┘
                          ▼
            ┌──────────────────────────────┐
            │ Video + Subtitle Streaming   │
            │ (Simultaneous)               │
            └──────────────────────────────┘
            │                              │
      ┌─────┴────────┐              ┌──────┴────────┐
      ▼              ▼              ▼               ▼
   ┌──────────┐  ┌────────────┐ ┌─────────────┐ ┌────────────┐
   │HTTP Range│  │File Reading│ │Subtitle     │ │Adaptive    │
   │Requests  │  │(io.Reader) │ │Parsing      │ │Flushing    │
   └──────────┘  └────────────┘ └─────────────┘ └────────────┘
                      ▲               │              │
                      │               ▼              ▼
                      │        ┌──────────────────────────┐
                      │        │ SubtitleFlushConfig      │
                      │        │ (Per Stream Type)        │
                      │        │                          │
                      │        │ File: 300ms flush        │
                      │        │ Torrent: 250ms flush     │
                      │        │ (Resume: faster)         │
                      │        └──────────────────────────┘
                      │               │
                      │               ▼
                      │        ┌──────────────────────┐
                      │        │ Batch & Send Events  │
                      │        │ maxBatchSize: 25-50  │
                      │        │ minSendInterval: 75m │
                      │        └──────────────────────┘
                      │               │
                      └───────────────┴──→ Client receives:
                                    - Video chunks
                                    - Subtitle events
```

## External Player Flow

```
┌──────────────────────────────────────────────────────┐
│ External Players (MPV, VLC, MPC-HC, IINA)           │
└──────────────────────────────────────────────────────┘
         ▲                    │
         │                    │
  ┌──────┴───────────┐  ┌────┴──────────────┐
  │ Player Launch    │  │ Playback Events   │
  │ File: /path/to/ │  │ - Started         │
  │      file.mkv   │  │ - Position        │
  │      or HTTP URL│  │ - Paused/Resumed  │
  └──────┬───────────┘  │ - Stopped         │
         │              └────┬──────────────┘
         │                   │
   ┌─────▼──────────────────────────────────────────┐
   │ MediaPlayer.Repository                         │
   │ (internal/mediaplayers/mediaplayer/)           │
   │                                                │
   │ Default Player: MPV (IPC) → VLC → MPC-HC      │
   │                                                │
   │ Tracking:                                      │
   │ - PlaybackType.File (external player)          │
   │ - PlaybackType.Stream (native player)          │
   │                                                │
   │ Subscribers:                                   │
   │ - TrackingStartedEvent                         │
   │ - TrackingRetryEvent                           │
   │ - VideoCompletedEvent                          │
   │ - TrackingStoppedEvent                         │
   │ - PlaybackStatusEvent                          │
   └─────┬──────────────────────────────────────────┘
         │
         ▼
   ┌─────────────────────────────┐
   │ MPV IPC (JSON over socket)  │
   │                             │
   │ Windows: Named pipes        │
   │ Unix: Domain sockets        │
   │                             │
   │ Commands:                   │
   │ - set property              │
   │ - get property              │
   │ - play-next                 │
   │                             │
   │ Events:                     │
   │ - file-loaded               │
   │ - seek                       │
   │ - property-change           │
   │ - end-file                   │
   └─────────────────────────────┘
```

## Progress Tracking & Effects System

```
┌────────────────────────────────────────────────────┐
│ VideoCore Event System                             │
│                                                    │
│ Event Queue → Dispatcher → Effects Subscribers    │
└────────────────────────────────────────────────────┘
         │                      │
         │         ┌────────────┼────────────┐
         │         │            │            │
         ▼         ▼            ▼            ▼
   ┌──────────────────────────────────────────────┐
   │ Effects (setupSharedEffects)                 │
   │                                              │
   │ VideoPausedEvent                             │
   │ → Update Discord RPC (paused=true)          │
   │                                              │
   │ VideoResumedEvent                            │
   │ → Update Discord RPC (paused=false)         │
   │                                              │
   │ VideoCompletedEvent                          │
   │ → Check AutoUpdateProgress setting           │
   │ → Get AniList collection                     │
   │ → Find list entry                            │
   │ → Update progress (if higher than before)    │
   │ → Call refreshAnimeCollectionFunc()          │
   │                                              │
   │ VideoLoadedMetadataEvent                     │
   │ → Set Discord RPC activity with show info    │
   │                                              │
   │ VideoErrorEvent                              │
   │ → Close Discord RPC                          │
   │                                              │
   │ VideoEndedEvent                              │
   │ → Close Discord RPC                          │
   └──────────────────────────────────────────────┘
```

## Codec Support Decision Tree

```
┌─────────────────────────────────────────┐
│ Request Playback Start                   │
│ Anime + Episode + Stream Source          │
└─────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Choose Stream Type               │
│ - Local File                     │
│ - Torrent                        │
│ - HTTP (URL/Debrid)             │
│ - Nakama (watch party)           │
└──────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Determine Player                 │
│ - External (MPV/VLC/MPC-HC)     │
│ - Native (HTML5 + libass)       │
└──────────────────────────────────┘
           │
    ┌──────┴───────┐
    │              │
    ▼              ▼
┌──────────┐  ┌──────────────────┐
│External  │  │Native Player     │
│Player    │  │                  │
│          │  │ Browser handles: │
│Delegate  │  │ - VP9, H.264,    │
│all codec │  │   H.265 (via OS) │
│support   │  │ - Audio codecs   │
│to MPV/   │  │                  │
│VLC/MPC   │  │ Server sends:    │
└──────────┘  │ - Metadata       │
              │ - Track info     │
              │ - RFC 6381       │
              │   codec string   │
              │ - Subtitle data  │
              │ - Fonts          │
              └──────────────────┘
                    │
                    ▼
              ┌───────────────┐
              │ Player plays  │
              │ based on its  │
              │ capabilities  │
              └───────────────┘
```

