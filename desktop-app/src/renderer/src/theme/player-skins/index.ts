import type { PlayerStyle } from '@shared/ipc';
import type { PlayerSkin } from './PlayerSkin';
import { DefaultSkin } from './default/DefaultSkin';

// ── Skin registry ─────────────────────────────────────────────────────────────
// To register a new skin: import it and add an entry below.

const registry: Record<PlayerStyle, PlayerSkin> = {
  default: new DefaultSkin()
};

export function getSkin(style: PlayerStyle): PlayerSkin {
  return registry[style] ?? registry.default;
}

export { PlayerSkin } from './PlayerSkin';
export type { PlayerKeyMap, SkinControlsProps, SkinPlayerState, SkinTrack, SkinSidecar } from './PlayerSkin';
