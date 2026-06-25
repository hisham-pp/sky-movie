/**
 * Audio and video track management utilities
 */

import type { ExtendedHTMLVideoElement, Setting, SettingOption } from './types';

/**
 * Ensures the first audio track is enabled if no track is currently enabled
 */
export function ensureAudioTrackEnabled(video: ExtendedHTMLVideoElement): void {
  if (!video.audioTracks || video.audioTracks.length === 0) {
    return;
  }

  const hasEnabledTrack = Array.from(video.audioTracks).some((track) => track.enabled);

  if (!hasEnabledTrack && video.audioTracks.length > 0) {
    video.audioTracks[0].enabled = true;
  }
}

/**
 * Ensures audio output is not muted and volume is set appropriately
 */
export function ensureAudioOutputEnabled(video: ExtendedHTMLVideoElement): void {
  if (video.muted) {
    video.muted = false;
  }

  if (video.volume === 0) {
    video.volume = 1.0;
  }
}

/**
 * Builds audio track options for the player settings
 */
export function buildAudioTrackOptions(video: ExtendedHTMLVideoElement): SettingOption[] {
  if (!video.audioTracks || video.audioTracks.length === 0) {
    return [{ html: 'Default', value: 'default', default: true }];
  }

  return [
    { html: 'Default', value: 'default', default: true },
    ...Array.from(video.audioTracks).map((track: any, index) => ({
      html: track.label || `Audio Track ${index + 1}`,
      value: index.toString()
    }))
  ];
}

/**
 * Builds subtitle/text track options for the player settings
 */
export function buildSubtitleTrackOptions(video: ExtendedHTMLVideoElement): SettingOption[] {
  if (!video.textTracks || video.textTracks.length === 0) {
    return [{ html: 'Off', value: 'off', default: true }];
  }

  return [
    { html: 'Off', value: 'off', default: true },
    ...Array.from(video.textTracks)
      .filter((track: TextTrack) => track.kind === 'subtitles' || track.kind === 'captions')
      .map((track: TextTrack, index) => ({
        html: track.label || `Subtitle ${index + 1}`,
        value: index.toString()
      }))
  ];
}

/**
 * Handles audio track selection from player settings
 */
export function handleAudioTrackSelection(
  video: ExtendedHTMLVideoElement,
  value: string
): void {
  if (!video.audioTracks) {
    return;
  }

  // 'default' means enable first track; otherwise enable the selected index
  const trackIndex = value === 'default' ? 0 : parseInt(value);

  for (let i = 0; i < video.audioTracks.length; i++) {
    video.audioTracks[i].enabled = i === trackIndex;
  }
}

/**
 * Handles subtitle track selection from player settings
 */
export function handleSubtitleTrackSelection(
  video: ExtendedHTMLVideoElement,
  value: string
): void {
  if (!video.textTracks) {
    return;
  }

  const trackIndex = value === 'off' ? -1 : parseInt(value);

  for (let i = 0; i < video.textTracks.length; i++) {
    video.textTracks[i].mode = i === trackIndex ? 'showing' : 'hidden';
  }
}

/**
 * Updates player settings with current audio and subtitle tracks
 */
export function updatePlayerSettings(
  artplayer: any,
  video: ExtendedHTMLVideoElement
): void {
  const settings = artplayer.setting as Setting[];

  const audioSettings = settings.find((s: Setting) => s.html === 'Audio Track');
  if (audioSettings) {
    audioSettings.selector = buildAudioTrackOptions(video);
    artplayer.setting.update(audioSettings);
  }

  const subtitleSettings = settings.find((s: Setting) => s.html === 'Subtitle');
  if (subtitleSettings) {
    subtitleSettings.selector = buildSubtitleTrackOptions(video);
    artplayer.setting.update(subtitleSettings);
  }
}
