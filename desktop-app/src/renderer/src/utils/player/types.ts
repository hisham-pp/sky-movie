/**
 * Type definitions for the video player and media management
 */

export interface ExtendedHTMLVideoElement extends HTMLVideoElement {
  audioTracks?: AudioTrackList;
}

export interface AudioTrack {
  enabled: boolean;
  label: string;
}

export interface AudioTrackList extends Array<AudioTrack> {
  length: number;
}

export interface SettingOption {
  html: string;
  value: string;
  default?: boolean;
}

export interface Setting {
  html: string;
  icon: string;
  selector: SettingOption[];
  onSelect?: (item: SettingOption) => string;
}

export interface MediaError {
  code: number;
  message: string;
}

export interface PlaybackErrorDetails {
  code: number | undefined;
  message: string | undefined;
  type: 'unsupported-codec' | 'network' | 'aborted' | 'unknown';
}
