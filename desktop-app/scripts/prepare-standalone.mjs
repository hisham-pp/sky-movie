import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const appDir = path.resolve(import.meta.dirname, '..');
const srcStatic = path.join(appDir, '.next/static');
const destStatic = path.join(appDir, '.next/standalone/desktop-app/.next/static');

if (fs.existsSync(srcStatic)) {
  fs.mkdirSync(destStatic, { recursive: true });
  fs.cpSync(srcStatic, destStatic, { recursive: true });
  console.log('✓ Copied .next/static to .next/standalone/desktop-app/.next/static');
} else {
  console.warn('Warning: .next/static not found. Run next build first.');
}

const srcPublic = path.join(appDir, 'public');
const destPublic = path.join(appDir, '.next/standalone/desktop-app/public');
if (fs.existsSync(srcPublic)) {
  fs.mkdirSync(destPublic, { recursive: true });
  fs.cpSync(srcPublic, destPublic, { recursive: true });
  console.log('✓ Copied public to .next/standalone/desktop-app/public');
}

console.log('Rebuilding native modules for Electron ABI...');
try {
  execSync('npx electron-rebuild -v 37.10.3 -w better-sqlite3 -s', {
    cwd: appDir,
    stdio: 'inherit'
  });
  console.log('✓ Rebuilt native modules for Electron');
} catch (e) {
  console.error('Error rebuilding for Electron:', e.message);
}
