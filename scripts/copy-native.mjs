/**
 * copy-native.mjs
 *
 * After `node-gyp rebuild` builds the native addon, copy the compiled
 * mpv_player.node into desktop-app/resources/mpv/ so electron-builder
 * picks it up via extraResources.
 *
 * Both mpv_player.node and mpv-2.dll end up in the same resources/mpv/
 * directory. Windows finds mpv-2.dll automatically when loading the .node
 * because it searches the directory of the loading module first.
 */

import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync }       from 'node:fs';
import { join, dirname }    from 'node:path';
import { fileURLToPath }    from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');

const SRC = join(ROOT, 'desktop-app', 'native', 'mpv-player', 'build', 'Release', 'mpv_player.node');
const DST = join(ROOT, 'desktop-app', 'resources', 'mpv', 'mpv_player.node');

if (!existsSync(SRC)) {
  console.warn(
    `copy-native: built addon not found at:\n  ${SRC}\n` +
    'Run `npm run rebuild:native` first.'
  );
  process.exit(0); // non-fatal — fallback to Artplayer will activate
}

await mkdir(join(ROOT, 'desktop-app', 'resources', 'mpv'), { recursive: true });
await copyFile(SRC, DST);
console.log(`copy-native: ${DST}`);
