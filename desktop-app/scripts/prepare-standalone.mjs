import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const appDir = path.resolve(import.meta.dirname, '..');
const repoRoot = path.resolve(appDir, '..');
const standaloneDir = path.join(appDir, '.next', 'standalone');

function parseCliArgs(argv) {
  let targetArch = process.arch;
  let targetPlatform = process.platform;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--arch' && argv[i + 1]) {
      targetArch = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--arch=')) {
      targetArch = arg.slice('--arch='.length);
    } else if (arg === '--x64') {
      targetArch = 'x64';
    } else if (arg === '--arm64') {
      targetArch = 'arm64';
    } else if (arg === '--platform' && argv[i + 1]) {
      targetPlatform = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--platform=')) {
      targetPlatform = arg.slice('--platform='.length);
    }
  }

  return { targetArch, targetPlatform };
}

function resolveElectronVersion() {
  const electronPkgPath = require.resolve('electron/package.json', { paths: [appDir, repoRoot] });
  const electronPkg = JSON.parse(fs.readFileSync(electronPkgPath, 'utf8'));
  return electronPkg.version;
}

function findPackageDirs(rootDir, packageName) {
  const matches = [];
  if (!fs.existsSync(rootDir)) return matches;

  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.name === packageName && path.basename(current) === 'node_modules') {
        if (fs.existsSync(path.join(fullPath, 'package.json'))) {
          matches.push(fullPath);
        }
        continue;
      }
      if (entry.name === '.next' || entry.name === 'build' || entry.name === 'prebuilds') continue;
      stack.push(fullPath);
    }
  }
  return matches;
}

function installPrebuild({ pkgDir, runtime, target, platform, arch }) {
  const prebuildBin = require.resolve('prebuild-install/bin.js', { paths: [pkgDir, appDir, repoRoot] });
  const args = [prebuildBin, '--runtime', runtime];
  if (target) args.push('--target', target);
  args.push('--platform', platform, '--arch', arch, '--force');

  execFileSync(process.execPath, args, {
    cwd: pkgDir,
    stdio: 'inherit'
  });
}

const { targetArch, targetPlatform } = parseCliArgs(process.argv.slice(2));
const electronVersion = resolveElectronVersion();

const srcStatic = path.join(appDir, '.next/static');
const destStatic = path.join(standaloneDir, 'desktop-app/.next/static');

if (!fs.existsSync(srcStatic)) {
  throw new Error(`.next/static not found at ${srcStatic}. Run next build first.`);
}

fs.mkdirSync(destStatic, { recursive: true });
fs.cpSync(srcStatic, destStatic, { recursive: true });
console.log('✓ Copied .next/static to .next/standalone/desktop-app/.next/static');

const srcPublic = path.join(appDir, 'public');
const destPublic = path.join(standaloneDir, 'desktop-app/public');
if (fs.existsSync(srcPublic)) {
  fs.mkdirSync(destPublic, { recursive: true });
  fs.cpSync(srcPublic, destPublic, { recursive: true });
  console.log('✓ Copied public to .next/standalone/desktop-app/public');
}

console.log(`Preparing native modules for Electron ${electronVersion} (${targetPlatform}-${targetArch})...`);

const betterSqliteDirs = findPackageDirs(standaloneDir, 'better-sqlite3');
if (betterSqliteDirs.length === 0) {
  throw new Error(`better-sqlite3 not found inside ${standaloneDir}`);
}

for (const sqliteDir of betterSqliteDirs) {
  try {
    installPrebuild({
      pkgDir: sqliteDir,
      runtime: 'electron',
      target: electronVersion,
      platform: targetPlatform,
      arch: targetArch
    });
    console.log(`✓ Installed Electron prebuild for better-sqlite3 in ${path.relative(standaloneDir, sqliteDir)}`);
  } catch (prebuildErr) {
    console.warn(`prebuild-install failed for better-sqlite3 (${prebuildErr.message}), falling back to electron-rebuild...`);
    const rebuildBin = require.resolve('@electron/rebuild/lib/cli.js', { paths: [appDir, repoRoot] });
    execFileSync(
      process.execPath,
      [rebuildBin, '-v', electronVersion, '-a', targetArch, '-w', 'better-sqlite3', '-m', path.resolve(sqliteDir, '../..'), '-f'],
      { cwd: appDir, stdio: 'inherit' }
    );
    console.log(`✓ Rebuilt better-sqlite3 via electron-rebuild in ${path.relative(standaloneDir, sqliteDir)}`);
  }
}

if (targetArch !== process.arch || targetPlatform !== process.platform) {
  const dataChannelDirs = findPackageDirs(standaloneDir, 'node-datachannel');
  for (const dcDir of dataChannelDirs) {
    try {
      installPrebuild({
        pkgDir: dcDir,
        runtime: 'napi',
        platform: targetPlatform,
        arch: targetArch
      });
      console.log(`✓ Installed N-API prebuild for node-datachannel (${targetPlatform}-${targetArch})`);
    } catch (err) {
      console.warn(`Warning: failed to install node-datachannel prebuild for ${targetPlatform}-${targetArch}: ${err.message}`);
    }
  }

  const targetPrebuildSubdir = `${targetPlatform}-${targetArch}`;
  for (const pkgName of ['fs-native-extensions', 'utp-native', 'bufferutil', 'utf-8-validate']) {
    const srcPrebuild = path.join(repoRoot, 'node_modules', pkgName, 'prebuilds', targetPrebuildSubdir);
    if (!fs.existsSync(srcPrebuild)) continue;
    for (const standalonePkgDir of findPackageDirs(standaloneDir, pkgName)) {
      const destPrebuild = path.join(standalonePkgDir, 'prebuilds', targetPrebuildSubdir);
      fs.mkdirSync(destPrebuild, { recursive: true });
      fs.cpSync(srcPrebuild, destPrebuild, { recursive: true });
      console.log(`✓ Copied ${pkgName}/prebuilds/${targetPrebuildSubdir}`);
    }
  }
}
