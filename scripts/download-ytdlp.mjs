/**
 * download-ytdlp.mjs
 *
 * Downloads the latest yt-dlp binary for the current platform and extracts it to:
 *   desktop-app/resources/bin/yt-dlp.exe (Windows)
 *   desktop-app/resources/bin/yt-dlp     (macOS / Linux)
 *
 * Run: node scripts/download-ytdlp.mjs
 */

import { createWriteStream, existsSync, mkdirSync, statSync, chmodSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const __dirname  = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, '..');
const RES_DIR    = join(ROOT, 'desktop-app', 'resources', 'bin');
const TMP_DIR    = join(ROOT, 'tmp', 'ytdlp-download');

const isWin = process.platform === 'win32';
const BINARY_NAME = isWin ? 'yt-dlp.exe' : 'yt-dlp';
const DEST       = join(RES_DIR, BINARY_NAME);

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

async function ps(cmd) {
  const { stdout } = await execAsync(
    `powershell -NoProfile -NonInteractive -Command "${cmd.replace(/"/g, '\\"')}"`,
    { maxBuffer: 20 * 1024 * 1024 }
  );
  return stdout.trim();
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'sky-movie-build-script', 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

async function downloadDirect(url, dest) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'sky-movie-build-script' },
    redirect: 'follow'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await pipeline(res.body, createWriteStream(dest));
}

async function downloadPS(url, dest) {
  await ps(
    `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; ` +
    `Invoke-WebRequest -Uri '${url}' -OutFile '${dest}' -UseBasicParsing`
  );
}

async function tryGitHub() {
  try {
    console.log('Trying GitHub releases (yt-dlp/yt-dlp)…');
    const release = await fetchJson(
      'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest'
    );
    const assets = release.assets ?? [];
    const targetAssetNames = isWin
      ? ['yt-dlp.exe']
      : process.platform === 'darwin'
        ? ['yt-dlp_macos', 'yt-dlp']
        : ['yt-dlp_linux', 'yt-dlp'];

    const asset = assets.find(a => targetAssetNames.includes(a.name));
    if (!asset) {
      console.log(`  No matching asset (${targetAssetNames.join(', ')}) found in latest release.`);
      return null;
    }
    console.log(`  Found: ${asset.name}`);
    return { url: asset.browser_download_url, filename: asset.name };
  } catch (err) {
    console.log(`  GitHub unavailable: ${err.message}`);
    return null;
  }
}

if (existsSync(DEST)) {
  console.log(`${BINARY_NAME} already present — skipping download.`);
  process.exit(0);
}

ensureDir(RES_DIR);
ensureDir(TMP_DIR);

let cleanupOnExit = true;
try {
  const source = await tryGitHub();

  if (!source) {
    console.error(
      '\nAll automatic download sources failed.\n' +
      'Download yt-dlp manually from:\n' +
      '  https://github.com/yt-dlp/yt-dlp/releases/latest\n\n' +
      'Place it at:\n' +
      `  ${DEST}\n`
    );
    process.exit(1);
  }

  const archivePath = join(TMP_DIR, source.filename);

  console.log(`\nDownloading ${source.filename}…`);
  try {
    await downloadDirect(source.url, archivePath);
  } catch (directErr) {
    if (isWin) {
      console.log('  Direct fetch failed, using PowerShell…');
      await downloadPS(source.url, archivePath);
    } else {
      throw directErr;
    }
  }
  console.log(`  ${(statSync(archivePath).size / 1024 / 1024).toFixed(1)} MB`);

  // Move the downloaded file to the destination
  const fs = await import('node:fs/promises');
  await fs.rename(archivePath, DEST);

  if (!isWin) {
    try {
      chmodSync(DEST, 0o755);
    } catch (e) {
      console.warn(`Could not set executable permission: ${e.message}`);
    }
  }

  console.log(`\n${BINARY_NAME} installed successfully:`);
  console.log(`  ${DEST}  ← ships with the app`);
} finally {
  if (cleanupOnExit) {
    await rm(TMP_DIR, { recursive: true, force: true }).catch(() => {});
  }
}
