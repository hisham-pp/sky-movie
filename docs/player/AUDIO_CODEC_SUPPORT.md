# Audio Codec Support

## Supported Formats

The Sky Movie desktop app now includes enhanced audio codec support:

### Fully Supported
- **AAC** - Advanced Audio Coding
- **MP3** - MPEG Audio Layer 3
- **Opus** - Open audio codec
- **Vorbis** - Open audio codec
- **FLAC** - Free Lossless Audio Codec

### Proprietary Codec Support (Platform-dependent)
- **AC-3** (Dolby Digital)
- **E-AC-3** (Enhanced AC-3 / Dolby Digital Plus)
- **E-AC-3+Atmos** (Dolby Atmos with Enhanced AC-3)
- **DTS** (Digital Theater Systems)
- **TrueHD** (Dolby TrueHD)
- **AAC-HE** (High-Efficiency AAC)

## Video Codec Support

### Fully Supported
- **H.264/AVC** - Advanced Video Coding (widely supported)
- **VP8** - WebM video codec
- **VP9** - Modern WebM video codec
- **AV1** - Next-gen open video codec

### Platform-Dependent Support
- **HEVC/H.265** - Requires system codec support
  - Windows: Native support on Windows 10+
  - macOS: Native support on macOS 10.13+
  - Linux: Requires appropriate GStreamer plugins

## Container Format Support

### Streaming-Optimized (Best Performance)
- **MP4** - MPEG-4 Part 14
- **WebM** - Web-optimized container

### Full Support with Custom Protocol
- **MKV** - Matroska container (uses custom streaming protocol)
- **AVI** - Audio Video Interleave
- **MOV** - QuickTime container
- **TS/M2TS** - MPEG Transport Stream

## Implementation

The app enables these codecs through Chromium command-line switches:

```javascript
app.commandLine.appendSwitch('enable-ac3-eac3-audio-demuxing');
app.commandLine.appendSwitch('enable-features', 'PlatformEncryptedDolbyVision,PlatformHEVCDecoderSupport');
```

### Custom Media Protocol

The app includes a custom `sky-media://` protocol handler for advanced streaming scenarios, but currently uses standard `file://` URLs for maximum compatibility across platforms. The custom protocol remains available for future enhancements:
- Proper byte-range requests for seeking
- Optimized streaming for large files
- Cross-origin isolation support

## Platform-Specific Notes

### Windows
- E-AC-3 and Dolby Atmos require system codec support
- Windows 10/11 include Dolby Digital Plus codecs by default
- Additional Dolby Atmos support may require the Dolby Access app
- HEVC support included in Windows 10 1709+

### macOS
- Native support for AC-3 and E-AC-3 through Core Audio
- Dolby Atmos support available on macOS 10.14+
- HEVC hardware acceleration on compatible Macs

### Linux
- Requires appropriate GStreamer plugins or ffmpeg libraries
- Install `gstreamer1.0-plugins-bad` or `gstreamer1.0-libav` for codec support
- HEVC requires `gstreamer1.0-vaapi` or similar hardware acceleration

## Fallback to System Player

If the built-in player cannot decode audio or video:
1. Click "Open in system player" button
2. The file will open in your default media player (VLC, MPC-HC, etc.)
3. System players typically have broader codec support

## Troubleshooting

### E-AC-3/Atmos Issues

If E-AC-3 with Atmos metadata doesn't play:
1. **Restart the app** after installation to ensure flags are applied
2. **Check system codecs** - ensure your OS supports the codec
3. **Use system player** - external players like VLC have built-in codec support
4. **Update drivers** - ensure audio drivers are current
5. **Check audio output** - some audio devices don't support Atmos passthrough

### MKV Playback Issues

If MKV files don't play (even with supported codecs like H.264):
1. **Check codec support** - ensure audio codec is supported (see above)
2. **Try system player** - MKV is fully supported in VLC/MPC-HC
3. **Check file integrity** - corrupted MKV files may not play
4. **Review container** - some MKV files have unusual features that browsers don't support

### HEVC/H.265 Videos

If HEVC videos show "codec not supported":
1. **Verify system support** - check if your OS has HEVC codecs installed
2. **Use system player** - HEVC requires platform-specific support
3. **Windows users** - Install "HEVC Video Extensions" from Microsoft Store if needed

## Technical Details

### E-AC-3 with Atmos Example
```
Format: E-AC-3
Format profile: E-AC-3+Atmos / E-AC-3
Channels: 15 objects / 6 channels
Bit rate: 448 kb/s
Codec ID: A_EAC3
```

This is Enhanced AC-3 with Dolby Atmos object-based audio metadata. The player will:
1. Attempt to decode using system codecs
2. Downmix to stereo/5.1 if needed
3. Fall back to system player if unsupported

### H.264/AVC in MKV Example
```
Format: AVC (H.264)
Format profile: High@L4
Container: MKV (Matroska)
Resolution: 1920x800
Frame rate: 24 fps
```

Standard H.264 video in MKV container. Uses custom protocol for proper streaming.
