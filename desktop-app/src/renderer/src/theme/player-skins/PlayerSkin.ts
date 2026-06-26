import type { ReactNode, PointerEvent as ReactPointerEvent } from 'react';
import type { PlayerStyle } from '@shared/ipc';

// ── Key map ───────────────────────────────────────────────────────────────────

export interface PlayerKeyMap {
  togglePlay: string[];
  seekBack: string[];
  seekForward: string[];
  seekBackLarge: string[];
  seekForwardLarge: string[];
  volumeUp: string[];
  volumeDown: string[];
  toggleMute: string[];
  toggleFullscreen: string[];
  seekBackSeconds: number;
  seekForwardSeconds: number;
  seekBackLargeSeconds: number;
  seekForwardLargeSeconds: number;
}

// ── Props passed into renderControls ─────────────────────────────────────────

export interface SkinPlayerState {
  playing: boolean;
  position: number;
  duration: number;
  volume: number;
  muted: boolean;
  speed: number;
  buffering: boolean;
}

export interface SkinTrack {
  id: number;
  type: 'audio' | 'sub' | 'video';
  title: string | null;
  lang: string | null;
  codec: string | null;
  selected: boolean;
}

export interface SkinSidecar {
  url: string;
  label: string;
  type: string;
}

export interface SkinControlsProps {
  state: SkinPlayerState;
  tracks: SkinTrack[];
  isVisible: boolean;
  seekOsdVisible: boolean;
  isFullscreen: boolean;
  showMenu: 'settings' | null;
  sidecarSubtitles: SkinSidecar[];
  onTogglePlay(): void;
  onToggleMute(): void;
  onChangeVolume(v: number): void;
  onToggleFullscreen(): void;
  onSeekTo(seconds: number): void;
  onSetSpeed(s: number): void;
  onSetAudioTrack(id: number): void;
  onSetSubTrack(id: number): void;
  onSetSubFile(path: string): void;
  onSetShowMenu(m: 'settings' | null): void;
  onSeekBarDown(e: ReactPointerEvent<HTMLDivElement>): void;
  onSeekBarMove(e: ReactPointerEvent<HTMLDivElement>): void;
  onSeekBarUp(e: ReactPointerEvent<HTMLDivElement>): void;
}

// ── Abstract base ─────────────────────────────────────────────────────────────
//
// To create a new skin:
//   1. Extend PlayerSkin in a new file under theme/player-skins/
//   2. Implement all abstract members (id, name, description, keyMap, renderControls)
//   3. Register the instance in index.ts
//   4. Add the id to the PlayerStyle union in shared/ipc.ts

export abstract class PlayerSkin {
  abstract readonly id: PlayerStyle;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly keyMap: PlayerKeyMap;
  readonly volumeMax: number = 100;
  readonly volumeBoostMax: number = 0;

  abstract renderControls(props: SkinControlsProps): ReactNode;
}
