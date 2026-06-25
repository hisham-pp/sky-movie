/**
 * build-native.mjs
 *
 * Builds the mpv_player N-API addon for the current platform.
 *
 * Windows: links against downloaded mpv.lib / mpv-2.dll
 * macOS:   links against system libmpv (brew install mpv)
 * Linux:   links against system libmpv (apt install libmpv-dev)
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

if (process.platform === 'win32') {
  const libPath = join(ROOT, 'desktop-app', 'native', 'mpv-player', 'lib', 'mpv.lib');
  if (!existsSync(libPath)) {
    console.error('build-native: mpv.lib not found — run `npm run prepare:libmpv` first.');
    process.exit(1);
  }
}

console.log(`build-native: compiling mpv_player addon for Electron (${process.platform})…`);
execSync(
  'electron-rebuild -f -m . && node ../../../scripts/copy-native.mjs',
  {
    cwd: join(ROOT, 'desktop-app', 'native', 'mpv-player'),
    stdio: 'inherit',
    shell: true,
  }
);
console.log('build-native: done.');
