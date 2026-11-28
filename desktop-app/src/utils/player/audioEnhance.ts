// Builds the mpv audio filter chain for the player enhancement toggles.
// Mirrors the Web Audio chain the skins use on the ArtPlayer (HTML5) path,
// where a <video> element exists; mpv plays through its own pipeline, so
// enhancements must be applied as mpv `af` (libavfilter) filters instead.

export interface AudioEnhanceState {
  bassBoost: boolean;
  trebleBoost: boolean;
  voiceBoost: boolean;
  stableVolume: boolean;
  aiAudio: boolean;
}

export function buildMpvAudioFilter(s: AudioEnhanceState): string {
  const filters: string[] = [];

  // AI audio applies a gentler always-on preset; explicit toggles win.
  const bassGain   = s.bassBoost   ? 8 : s.aiAudio ? 5 : 0;
  const trebleGain = s.trebleBoost ? 6 : s.aiAudio ? 4 : 0;
  const voiceGain  = s.voiceBoost  ? 6 : s.aiAudio ? 3 : 0;

  if (bassGain)   filters.push(`bass=g=${bassGain}:f=120`);
  if (trebleGain) filters.push(`treble=g=${trebleGain}:f=3000`);
  if (voiceGain)  filters.push(`equalizer=f=2000:width_type=q:width=1.5:g=${voiceGain}`);

  if (s.aiAudio) {
    filters.push('acompressor=threshold=-20dB:ratio=3.5:knee=25');
  } else if (s.stableVolume) {
    filters.push('acompressor=threshold=-24dB:ratio=4:knee=30');
  }

  return filters.length ? `lavfi=[${filters.join(',')}]` : '';
}
