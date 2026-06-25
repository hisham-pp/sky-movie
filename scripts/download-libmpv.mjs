/**
 * download-libmpv.mjs
 *
 * Downloads the latest libmpv Windows dev build and extracts:
 *
 *   Packaging (ships with app):   desktop-app/resources/mpv/mpv-2.dll
 *   Compilation:                  desktop-app/native/mpv-player/lib/mpv.lib
 *                                 desktop-app/native/mpv-player/include/mpv/client.h
 *                                 desktop-app/native/mpv-player/include/mpv/render.h
 *
 * Sources tried in order:
 *   1. GitHub releases (zhongfly/mpv-winbuild)
 *   2. SourceForge via PowerShell
 *
 * Run: node scripts/download-libmpv.mjs
 * Linux/macOS: install libmpv-dev via your package manager instead.
 */

import { createWriteStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { copyFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const __dirname  = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, '..');
const NATIVE     = join(ROOT, 'desktop-app', 'native', 'mpv-player');
const LIB_DIR    = join(NATIVE, 'lib');
const INC_DIR    = join(NATIVE, 'include', 'mpv');
const RES_DIR    = join(ROOT, 'desktop-app', 'resources', 'mpv');
const TMP_DIR    = join(ROOT, 'tmp', 'libmpv-download');

const NEED = {
  dll:     join(RES_DIR, 'mpv-2.dll'),
  dllLib:  join(LIB_DIR, 'mpv-2.dll'),   // also needed in lib/ for binding.gyp copies step
  lib:     join(LIB_DIR, 'mpv.lib'),
  clientH: join(INC_DIR, 'client.h'),
  renderH: join(INC_DIR, 'render.h'),
};

// ── helpers ──────────────────────────────────────────────────────────────────

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

/** List every file recursively in dir. */
async function listAllFiles(dir, results = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) await listAllFiles(full, results);
    else results.push(full);
  }
  return results;
}

/** Find first file whose name (case-insensitive) matches any of the given names. */
async function findFile(dir, ...names) {
  const lower = names.map(n => n.toLowerCase());
  const all = await listAllFiles(dir);
  return all.find(f => lower.includes(basename(f).toLowerCase())) ?? null;
}

async function extractArchive(archive, outDir) {
  if (archive.endsWith('.zip')) {
    await ps(`Expand-Archive -Path '${archive}' -DestinationPath '${outDir}' -Force`);
    return;
  }
  // .7z — try 7-Zip paths
  const sevenZipPaths = [
    'C:\\Program Files\\7-Zip\\7z.exe',
    'C:\\Program Files (x86)\\7-Zip\\7z.exe',
    '7z', '7za'
  ];
  for (const tool of sevenZipPaths) {
    try {
      await execAsync(`"${tool}" x "${archive}" -o"${outDir}" -y`);
      return;
    } catch { /* try next */ }
  }
  // Auto-install via winget
  console.log('  7-Zip not found — installing via winget…');
  try {
    await execAsync(
      'winget install --id 7zip.7zip -e --silent --accept-source-agreements --accept-package-agreements',
      { timeout: 120_000 }
    );
    await execAsync(`"C:\\Program Files\\7-Zip\\7z.exe" x "${archive}" -o"${outDir}" -y`);
    return;
  } catch (e) {
    throw new Error(
      '7-Zip install failed. Install manually: winget install 7zip.7zip\n' + e.message
    );
  }
}

/**
 * Generate mpv.lib (MSVC import library) from the DLL.
 *
 * Tries tools in order:
 *   1. dlltool from Git for Windows (most common on dev machines)
 *   2. llvm-dlltool (from LLVM / clang-cl)
 *   3. MSVC dumpbin + lib (via vswhere)
 */
async function generateLib(dllPath, libPath) {
  const dllName = basename(dllPath); // e.g. libmpv-2.dll
  // Always use the normalised shipping name so the addon searches for mpv-2.dll at runtime
  const normalizedName = 'mpv-2';

  // ── Strategy 1: dlltool from Git for Windows ──
  const gitDlltoolPaths = [
    'C:\\Program Files\\Git\\mingw64\\bin\\dlltool.exe',
    'C:\\Program Files\\Git\\usr\\bin\\dlltool.exe',
    'C:\\Program Files (x86)\\Git\\mingw64\\bin\\dlltool.exe',
  ];

  for (const dlltool of gitDlltoolPaths) {
    if (!existsSync(dlltool)) continue;
    try {
      console.log(`  Using dlltool from Git for Windows: ${dlltool}`);
      // Use normalizedName so the .node will search for mpv-2.dll at runtime
      await execAsync(`"${dlltool}" -D "${normalizedName}.dll" -l "${libPath}" -m i386:x86-64`);
      console.log(`  Generated ${libPath}`);
      return;
    } catch (e) {
      console.log(`  dlltool failed: ${e.message}`);
    }
  }

  // ── Strategy 2: llvm-dlltool (from LLVM install or PATH) ──
  const llvmDlltoolPaths = [
    'C:\\Program Files\\LLVM\\bin\\llvm-dlltool.exe',
    'C:\\Program Files (x86)\\LLVM\\bin\\llvm-dlltool.exe',
  ];
  // Also try PATH via `where`
  try {
    const { stdout } = await execAsync('where llvm-dlltool 2>nul');
    const found = stdout.trim().split('\n')[0].trim();
    if (found) llvmDlltoolPaths.unshift(found);
  } catch { /* not in PATH */ }

  for (const llvmDlltool of llvmDlltoolPaths) {
    if (!existsSync(llvmDlltool)) continue;
    try {
      console.log(`  Using llvm-dlltool: ${llvmDlltool}`);
      // Use normalizedName so the .node will search for mpv-2.dll at runtime
      await execAsync(`"${llvmDlltool}" -D "${normalizedName}.dll" -l "${libPath}" -m i386:x86-64`);
      console.log(`  Generated ${libPath}`);
      return;
    } catch (e) {
      console.log(`  llvm-dlltool failed: ${e.message}`);
    }
  }

  // ── Strategy 3: MSVC dumpbin + lib ──
  let vsDir = '';
  try {
    vsDir = (await execAsync(
      '"C:\\Program Files (x86)\\Microsoft Visual Studio\\Installer\\vswhere.exe"' +
      ' -latest -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath'
    )).stdout.trim();
  } catch { /* vswhere not available */ }

  if (!vsDir) {
    for (const p of [
      'C:\\Program Files\\Microsoft Visual Studio\\2022\\BuildTools',
      'C:\\Program Files\\Microsoft Visual Studio\\2022\\Community',
      'C:\\Program Files\\Microsoft Visual Studio\\2022\\Professional',
      'C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools',
      'C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\Community',
      'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\BuildTools',
      'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Community',
    ]) {
      if (existsSync(p)) { vsDir = p; break; }
    }
  }

  if (vsDir) {
    try {
      const msvcBase = join(vsDir, 'VC', 'Tools', 'MSVC');
      const versions = await readdir(msvcBase);
      const latest   = versions.filter(v => /^\d+\.\d+/.test(v)).sort().at(-1);
      if (!latest) throw new Error('No MSVC version found');
      // Try both Hostx64 and Hostx86
      let toolsDir = join(msvcBase, latest, 'bin', 'Hostx64', 'x64');
      if (!existsSync(join(toolsDir, 'lib.exe'))) {
        toolsDir = join(msvcBase, latest, 'bin', 'Hostx86', 'x64');
      }
      const dumpbin  = join(toolsDir, 'dumpbin.exe');
      const libExe   = join(toolsDir, 'lib.exe');

      if (existsSync(dumpbin) && existsSync(libExe)) {
        console.log(`  Using MSVC tools from ${toolsDir}`);
        const defPath = libPath.replace(/\.lib$/, '.def');
        const { stdout: exp } = await execAsync(`"${dumpbin}" /exports "${dllPath}"`);
        const lines   = exp.split('\n');
        const ordIdx  = lines.findIndex(l => /ordinal\s+hint\s+RVA/i.test(l));
        const symbols = lines.slice(ordIdx + 1)
          .map(l => l.trim().match(/^\d+\s+\w+\s+\w+\s+(\S+)/)?.[1])
          .filter(Boolean);
        // Use normalizedName so the compiled .node searches for mpv-2.dll at runtime
        await writeFile(defPath,
          `LIBRARY "${normalizedName}"\nEXPORTS\n${symbols.map(s => `  ${s}`).join('\n')}\n`
        );
        await execAsync(`"${libExe}" /def:"${defPath}" /out:"${libPath}" /machine:x64`);
        console.log(`  Generated ${libPath}`);
        return;
      }
    } catch (e) {
      console.log(`  MSVC tools failed: ${e.message}`);
    }
  }

  throw new Error(
    'Cannot generate mpv.lib — no suitable tool found.\n\n' +
    'Install one of:\n' +
    '  Git for Windows (includes dlltool): https://git-scm.com/download/win\n' +
    '  LLVM/clang:                         winget install LLVM.LLVM\n' +
    '  VS Build Tools:                     winget install Microsoft.VisualStudio.2022.BuildTools\n\n' +
    'Then re-run: node scripts/download-libmpv.mjs'
  );
}

// ── source strategies ─────────────────────────────────────────────────────────

async function tryGitHub() {
  try {
    console.log('Trying GitHub releases (zhongfly/mpv-winbuild)…');
    const release = await fetchJson(
      'https://api.github.com/repos/zhongfly/mpv-winbuild/releases/latest'
    );
    const assets = release.assets ?? [];

    // Prefer .zip (no 7-Zip needed), fall back to .7z
    const asset =
      assets.find(a => /mpv-dev-x86_64.*\.zip$/i.test(a.name)) ??
      assets.find(a => /mpv-dev-x86_64.*\.7z$/i.test(a.name));

    if (!asset) {
      console.log('  No mpv-dev-x86_64 asset found in latest release.');
      return null;
    }
    console.log(`  Found: ${asset.name}`);
    return { url: asset.browser_download_url, filename: asset.name };
  } catch (err) {
    console.log(`  GitHub unavailable: ${err.message}`);
    return null;
  }
}

async function trySourceForge() {
  try {
    console.log('Trying SourceForge (via PowerShell)…');
    const html = await ps(
      `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; ` +
      `(Invoke-WebRequest -Uri 'https://sourceforge.net/projects/mpv-player-windows/files/libmpv/' -UseBasicParsing).Content`
    );
    const pattern = /mpv-dev-x86_64-\d{8}-git-[a-f0-9]+\.7z/g;
    const names = [...new Set(html.match(pattern) ?? [])].sort((a, b) => b.localeCompare(a));
    if (!names.length) throw new Error('No filenames found');
    const filename = names[0];
    console.log(`  Found: ${filename}`);
    return {
      url: `https://sourceforge.net/projects/mpv-player-windows/files/libmpv/${filename}/download`,
      filename
    };
  } catch (err) {
    console.log(`  SourceForge unavailable: ${err.message}`);
    return null;
  }
}

// ── main ─────────────────────────────────────────────────────────────────────

if ([NEED.dll, NEED.lib, NEED.clientH, NEED.renderH].every(existsSync)) {
  console.log('libmpv files already present — skipping download.');
  process.exit(0);
}

// If DLL + headers are present but .lib is missing, regenerate without re-downloading
if (existsSync(NEED.dll) && existsSync(NEED.clientH) && existsSync(NEED.renderH) && !existsSync(NEED.lib)) {
  console.log('mpv.lib missing — regenerating from existing DLL…');
  ensureDir(LIB_DIR);
  ensureDir(RES_DIR);
  const genPath = join(dirname(NEED.lib), 'mpv.lib');
  await generateLib(NEED.dll, genPath);
  // Copy DLL to lib/ as well (for binding.gyp copies step)
  ensureDir(LIB_DIR);
  await copyFile(NEED.dll, NEED.dllLib).catch(() => {});
  console.log('Done.');
  process.exit(0);
}

if (process.platform !== 'win32') {
  // On macOS/Linux the addon links against the system libmpv.
  // Just verify the library is reachable; if not, print install instructions.
  const { execSync: es } = await import('node:child_process');
  let found = false;
  try {
    if (process.platform === 'darwin') {
      es('pkg-config --exists mpv 2>/dev/null || test -f /opt/homebrew/lib/libmpv.dylib || test -f /usr/local/lib/libmpv.dylib', { shell: true });
    } else {
      es('pkg-config --exists mpv', { shell: true });
    }
    found = true;
  } catch { /* not found */ }

  if (!found) {
    console.error(
      'libmpv not found. Install it before building the native addon:\n' +
      '  Ubuntu/Debian: sudo apt install libmpv-dev\n' +
      '  Fedora:        sudo dnf install mpv-libs-devel\n' +
      '  macOS:         brew install mpv\n'
    );
    process.exit(1);
  }
  console.log('libmpv detected — system library will be used at build time.');
  process.exit(0);
}

ensureDir(LIB_DIR);
ensureDir(INC_DIR);
ensureDir(RES_DIR);
ensureDir(TMP_DIR);

let cleanupOnExit = true;
try {
  const source = (await tryGitHub()) ?? (await trySourceForge());

  if (!source) {
    console.error(
      '\nAll automatic download sources failed.\n' +
      'Download libmpv manually from:\n' +
      '  https://sourceforge.net/projects/mpv-player-windows/files/libmpv/\n\n' +
      'Extract and place:\n' +
      `  mpv-2.dll  → ${NEED.dll}\n` +
      `  mpv.lib    → ${NEED.lib}\n` +
      `  client.h   → ${NEED.clientH}\n` +
      `  render.h   → ${NEED.renderH}\n`
    );
    process.exit(1);
  }

  const ext         = source.filename.endsWith('.zip') ? '.zip' : '.7z';
  const archivePath = join(TMP_DIR, `mpv-dev${ext}`);
  const extractPath = join(TMP_DIR, 'extracted');

  console.log(`\nDownloading ${source.filename}…`);
  try {
    await downloadDirect(source.url, archivePath);
  } catch {
    console.log('  Direct fetch failed, using PowerShell…');
    await downloadPS(source.url, archivePath);
  }
  console.log(`  ${(statSync(archivePath).size / 1024 / 1024).toFixed(1)} MB`);

  console.log('Extracting…');
  ensureDir(extractPath);
  await extractArchive(archivePath, extractPath);

  // List all extracted files for diagnostics
  const allFiles = await listAllFiles(extractPath);
  console.log(`  Extracted ${allFiles.length} files.`);
  if (process.env.DEBUG_LIBMPV) {
    console.log('  Files:\n' + allFiles.map(f => '    ' + f).join('\n'));
  }

  // Locate files — accept alternative names (libmpv-2.dll, etc.)
  const dll     = await findFile(extractPath, 'mpv-2.dll', 'libmpv-2.dll', 'mpv.dll');
  const clientH = await findFile(extractPath, 'client.h');
  const renderH = await findFile(extractPath, 'render.h');
  let   libFile = await findFile(extractPath, 'mpv.lib', 'libmpv.lib', 'mpv-2.lib');

  if (!dll) {
    console.error(
      'mpv-2.dll not found in archive.\n' +
      'Set DEBUG_LIBMPV=1 and re-run to see all extracted files.\n' +
      'Extracted to: ' + extractPath
    );
    cleanupOnExit = false; // leave files for inspection
    process.exit(1);
  }

  // If no .lib shipped, generate one from the DLL using MSVC tools
  if (!libFile) {
    console.log('  mpv.lib not in archive — generating from DLL…');
    const genPath = join(TMP_DIR, 'mpv.lib');
    await generateLib(dll, genPath);
    libFile = genPath;
  }

  if (!clientH || !renderH) {
    console.error(`Missing headers: ${!clientH ? 'client.h ' : ''}${!renderH ? 'render.h' : ''}`);
    console.error('Run with DEBUG_LIBMPV=1 to list all extracted files.');
    cleanupOnExit = false;
    process.exit(1);
  }

  // Install — normalise DLL name to mpv-2.dll regardless of source name
  await copyFile(dll,     NEED.dll);     // libmpv-2.dll → resources/mpv/mpv-2.dll
  await copyFile(dll,     NEED.dllLib);  // also → native/lib/mpv-2.dll (for binding.gyp copies step)
  await copyFile(libFile, NEED.lib);
  await copyFile(clientH, NEED.clientH);
  await copyFile(renderH, NEED.renderH);

  console.log('\nlibmpv installed successfully:');
  console.log(`  ${NEED.dll}  ← ships with the app`);
  console.log(`  ${NEED.lib}`);
  console.log(`  ${NEED.clientH}`);
  console.log(`  ${NEED.renderH}`);
} finally {
  if (cleanupOnExit) {
    await rm(TMP_DIR, { recursive: true, force: true }).catch(() => {});
  }
}
