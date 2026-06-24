/**
 * FFmpeg bundle installer
 * Copies a locally installed ffmpeg-static binary into desktop-app/resources/ffmpeg
 * Run: node scripts/download-ffmpeg.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'node:module';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const ffmpegDir = path.join(projectRoot, 'desktop-app', 'resources', 'ffmpeg');
const resourceFfmpeg = path.join(ffmpegDir, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');

const workspaceRequire = createRequire(path.join(projectRoot, 'package.json'));
const desktopAppRequire = createRequire(path.join(projectRoot, 'desktop-app', 'package.json'));
let ffmpegStatic;
try {
  ffmpegStatic = workspaceRequire('ffmpeg-static');
} catch {
  try {
    ffmpegStatic = desktopAppRequire('ffmpeg-static');
  } catch (error) {
    throw new Error('ffmpeg-static is not installed in the workspace. Run pnpm install from the workspace root.');
  }
}

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyStaticBinary() {
  if (!ffmpegStatic) {
    throw new Error('ffmpeg-static binary not found. Run pnpm install or add ffmpeg-static to dependencies.');
  }

  if (!fs.existsSync(ffmpegStatic)) {
    throw new Error(`ffmpeg-static path does not exist: ${ffmpegStatic}`);
  }

  ensureDirectory(ffmpegDir);
  fs.copyFileSync(ffmpegStatic, resourceFfmpeg);
  fs.chmodSync(resourceFfmpeg, 0o755);
  console.log('✅ FFmpeg binary copied to:', resourceFfmpeg);
}

function ensureBundledFfmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe', timeout: 5000 });
    console.log('✅ FFmpeg available in system PATH');
  } catch {
    console.log('⚠️  FFmpeg not found in system PATH');
  }

  console.log('ℹ️  Bundling ffmpeg-static binary for the desktop app');
  copyStaticBinary();
}

function main() {
  ensureDirectory(ffmpegDir);

  if (fs.existsSync(resourceFfmpeg)) {
    console.log('✅ FFmpeg already bundled at:', resourceFfmpeg);
    process.exit(0);
  }

  ensureBundledFfmpeg();
  process.exit(0);
}

try {
  main();
} catch (error) {
  console.error('❌ FFmpeg installation failed:', error.message);
  process.exit(1);
}
