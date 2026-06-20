#!/usr/bin/env node
import { createHash, createSign } from 'node:crypto';
import { createReadStream, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, extname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const desktopPackagePath = join(repoRoot, 'desktop-app', 'package.json');
const manifestPath = join(repoRoot, 'website', 'public', 'releases.json');
const defaultArtifactsDir = join(repoRoot, 'desktop-app', 'dist');

const artifactExtensions = ['.exe', '.dmg', '.zip', '.AppImage', '.deb', '.tar.gz'];

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadEnvFile(args.envFile ?? '.env.drive');
  const version = args.version ?? readJson(desktopPackagePath).version;
  const artifactsDir = resolve(args.artifactsDir ?? defaultArtifactsDir);
  const folderId = args.folderId ?? process.env.GOOGLE_DRIVE_FOLDER_ID;
  const credentials = readServiceAccountCredentials(args.credentials);
  const packageTarget = args.packageTarget;
  const sourceCommit = getSourceCommit();
  const manifest = readJson(manifestPath);
  const changes = args.changes?.length ? args.changes : getReleaseChanges(manifest, version, sourceCommit);

  if (!folderId) {
    throw new Error('Missing Google Drive folder id. Pass --folder-id or set GOOGLE_DRIVE_FOLDER_ID.');
  }

  if (packageTarget) {
    runPackage(packageTarget);
  }

  if (!existsSync(artifactsDir)) {
    throw new Error(`Artifacts directory does not exist: ${artifactsDir}`);
  }

  const artifactPaths = findArtifacts(artifactsDir);
  if (!artifactPaths.length) {
    throw new Error(`No release artifacts found in ${artifactsDir}. Expected ${artifactExtensions.join(', ')} files.`);
  }

  const accessToken = await getAccessToken(credentials);
  await assertCanWriteToParentFolder(accessToken, folderId, credentials.client_email);
  const releaseFolder = await ensureReleaseFolder(accessToken, folderId, `v${version}`);
  const uploadedArtifacts = [];

  for (const artifactPath of artifactPaths) {
    const fileName = basename(artifactPath);
    const stats = statSync(artifactPath);
    const mimeType = getMimeType(fileName);
    const driveFile = await uploadFile({
      accessToken,
      folderId: releaseFolder.id,
      filePath: artifactPath,
      fileName,
      mimeType,
      size: stats.size
    });
    await makeFilePublic(accessToken, driveFile.id);

    uploadedArtifacts.push({
      ...classifyArtifact(fileName),
      fileName,
      size: stats.size,
      sha256: sha256File(artifactPath),
      driveFileId: driveFile.id,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${driveFile.id}`,
      webViewUrl: driveFile.webViewLink ?? `https://drive.google.com/file/d/${driveFile.id}/view`
    });

    console.log(`Uploaded ${fileName} -> ${driveFile.id}`);
  }

  const now = new Date().toISOString();
  const nextRelease = {
    version,
    releasedAt: now,
    driveFolderId: releaseFolder.id,
    driveFolderUrl: releaseFolder.webViewLink ?? `https://drive.google.com/drive/folders/${releaseFolder.id}`,
    sourceCommit,
    notes: args.notes ?? `Sky Movie ${version}`,
    changes,
    artifacts: uploadedArtifacts
  };

  manifest.latestVersion = version;
  manifest.updatedAt = now;
  manifest.releases = [
    nextRelease,
    ...(manifest.releases ?? []).filter((release) => release.version !== version)
  ];

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Updated website release manifest: ${manifestPath}`);

  if (args.commit) {
    commitReleaseManifest(version);
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--version') {
      parsed.version = requireValue(arg, next);
      index += 1;
    } else if (arg === '--folder-id') {
      parsed.folderId = requireValue(arg, next);
      index += 1;
    } else if (arg === '--credentials') {
      parsed.credentials = requireValue(arg, next);
      index += 1;
    } else if (arg === '--artifacts-dir') {
      parsed.artifactsDir = requireValue(arg, next);
      index += 1;
    } else if (arg === '--notes') {
      parsed.notes = requireValue(arg, next);
      index += 1;
    } else if (arg === '--change') {
      parsed.changes = [...(parsed.changes ?? []), requireValue(arg, next)];
      index += 1;
    } else if (arg === '--env-file') {
      parsed.envFile = requireValue(arg, next);
      index += 1;
    } else if (arg === '--package') {
      parsed.packageTarget = next && !next.startsWith('--') ? next : 'all';
      if (next && !next.startsWith('--')) {
        index += 1;
      }
    } else if (arg === '--no-commit') {
      parsed.commit = false;
    } else if (arg === '--commit') {
      parsed.commit = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return {
    commit: true,
    ...parsed
  };
}

function requireValue(name, value) {
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}

function printHelp() {
  console.log(`Release Sky Movie artifacts to Google Drive.

Usage:
  node scripts/release-google-drive.mjs [options]

Options:
  --package [target]        Build artifacts before uploading. target: all, current, win, mac, linux.
  --version <version>       Release version. Defaults to desktop-app/package.json version.
  --artifacts-dir <path>    Directory containing packaged artifacts. Defaults to desktop-app/dist.
  --folder-id <id>          Google Drive folder id. Or set GOOGLE_DRIVE_FOLDER_ID.
  --credentials <path>      Service account JSON path. Or set GOOGLE_APPLICATION_CREDENTIALS.
  --env-file <path>         Local env file to load. Defaults to .env.drive.
  --notes <text>            Release notes stored in website/public/releases.json.
  --change <text>           Add a curated What's New line. Can be repeated. Defaults to git log since previous release.
  --commit                  Commit website/public/releases.json after upload. Default.
  --no-commit               Update JSON without creating a git commit.

Credentials can also be provided with GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON containing raw JSON.`);
}

function loadEnvFile(envFile) {
  const envPath = resolve(repoRoot, envFile);
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] == null) {
      process.env[key] = value;
    }
  }
}

function runPackage(target) {
  const normalizedTarget = target === 'windows' ? 'win' : target;
  const validTargets = new Set(['all', 'current', 'win', 'mac', 'linux']);
  if (!validTargets.has(normalizedTarget)) {
    throw new Error(`Unknown package target "${target}". Use all, current, win, mac, or linux.`);
  }

  const scriptName = normalizedTarget === 'current' ? 'package:current' : `package:${normalizedTarget}`;
  const result = spawnSync(getPnpmCommand(), ['--filter', '@sky-movie/desktop-app', scriptName], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false
  });

  if (result.status !== 0) {
    throw new Error(`Packaging failed with exit code ${result.status ?? 'unknown'}.`);
  }
}

function getSourceCommit() {
  return {
    sha: runGit(['rev-parse', 'HEAD']).trim(),
    message: runGit(['log', '-1', '--pretty=%B']).trim()
  };
}

function getReleaseChanges(manifest, version, sourceCommit) {
  const previousRelease = (manifest.releases ?? []).find((release) => release.version !== version && release.sourceCommit?.sha);
  if (previousRelease?.sourceCommit?.sha) {
    try {
      const logOutput = runGit(['log', '--pretty=format:%s', `${previousRelease.sourceCommit.sha}..${sourceCommit.sha}`]).trim();
      const changes = logOutput
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !line.startsWith('chore(release):'));

      if (changes.length) {
        return [...new Set(changes)];
      }
    } catch (error) {
      console.warn(`Could not generate changes from previous release commit: ${error instanceof Error ? error.message : error}`);
    }
  }

  const fallbackChanges = sourceCommit.message
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return fallbackChanges.length ? fallbackChanges : [`Sky Movie ${version}`];
}

function commitReleaseManifest(version) {
  runGit(['add', 'website/public/releases.json'], { inherit: true });
  const diffCheck = spawnSync(getGitCommand(), ['diff', '--cached', '--quiet', '--', 'website/public/releases.json'], {
    cwd: repoRoot,
    shell: false
  });

  if (diffCheck.status === 0) {
    console.log('No release manifest changes to commit.');
    return;
  }

  runGit(['commit', '-m', `chore(release): publish Sky Movie ${version} downloads`], { inherit: true });
}

function runGit(args, options = {}) {
  const result = spawnSync(getGitCommand(), args, {
    cwd: repoRoot,
    encoding: options.inherit ? undefined : 'utf8',
    stdio: options.inherit ? 'inherit' : 'pipe',
    shell: false
  });

  if (result.status !== 0) {
    const stderr = result.stderr ? String(result.stderr).trim() : '';
    throw new Error(`git ${args.join(' ')} failed${stderr ? `: ${stderr}` : ''}`);
  }

  return result.stdout ? String(result.stdout) : '';
}

function getPnpmCommand() {
  return process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
}

function getGitCommand() {
  return process.platform === 'win32' ? 'git.exe' : 'git';
}

function readServiceAccountCredentials(credentialsPath) {
  if (process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON);
  }

  const resolvedPath = credentialsPath ?? process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!resolvedPath) {
    throw new Error('Missing Google service account credentials. Pass --credentials, set GOOGLE_APPLICATION_CREDENTIALS, or set GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON.');
  }

  return readJson(resolve(resolvedPath));
}

async function getAccessToken(credentials) {
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Service account credentials must include client_email and private_key.');
  }

  const now = Math.floor(Date.now() / 1000);
  const jwtHeader = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const jwtClaim = base64Url(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }));
  const unsignedJwt = `${jwtHeader}.${jwtClaim}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsignedJwt);
  signer.end();
  const signature = signer.sign(credentials.private_key, 'base64url');
  const assertion = `${unsignedJwt}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });

  if (!response.ok) {
    throw new Error(`Google OAuth token request failed: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json();
  return payload.access_token;
}

async function uploadFile({ accessToken, folderId, filePath, fileName, mimeType, size }) {
  const metadataResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink&supportsAllDrives=true', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(size)
    },
    body: JSON.stringify({
      name: fileName,
      parents: [folderId],
      mimeType
    })
  });

  if (!metadataResponse.ok) {
    throw new Error(`Google Drive upload session failed for ${fileName}: ${metadataResponse.status} ${await metadataResponse.text()}`);
  }

  const uploadUrl = metadataResponse.headers.get('location');
  if (!uploadUrl) {
    throw new Error(`Google Drive did not return an upload URL for ${fileName}.`);
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(size),
      'Content-Type': mimeType
    },
    body: createReadStream(filePath),
    duplex: 'half'
  });

  if (!uploadResponse.ok) {
    throw new Error(`Google Drive upload failed for ${fileName}: ${uploadResponse.status} ${await uploadResponse.text()}`);
  }

  return uploadResponse.json();
}

async function assertCanWriteToParentFolder(accessToken, parentFolderId, serviceAccountEmail) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${parentFolderId}?fields=id,name,mimeType,capabilities(canAddChildren)&supportsAllDrives=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      [
        `Cannot access Google Drive parent folder ${parentFolderId}: ${response.status} ${await response.text()}`,
        '',
        'Check that:',
        `- GOOGLE_DRIVE_FOLDER_ID is the real folder id from drive.google.com/drive/folders/<id>.`,
        `- The folder is shared with the service account email as Editor: ${serviceAccountEmail}`,
        '- If the folder is in a Shared Drive, the service account is a member with permission to add files.'
      ].join('\n')
    );
  }

  const folder = await response.json();
  if (folder.mimeType !== 'application/vnd.google-apps.folder' || !folder.capabilities?.canAddChildren) {
    throw new Error(
      [
        `Google Drive parent "${folder.name ?? parentFolderId}" is not writable by the service account.`,
        '',
        'Fix:',
        `- Share that folder with ${serviceAccountEmail} as Editor.`,
        '- Make sure you used the parent folder id, not a shortcut, file, or public share link id.',
        '- Re-run: pnpm run release:drive -- --no-commit'
      ].join('\n')
    );
  }
}

async function ensureReleaseFolder(accessToken, parentFolderId, folderName) {
  const escapedName = folderName.replaceAll("'", "\\'");
  const query = [
    `name = '${escapedName}'`,
    `'${parentFolderId}' in parents`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `trashed = false`
  ].join(' and ');

  const findResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&pageSize=1&supportsAllDrives=true&includeItemsFromAllDrives=true`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!findResponse.ok) {
    throw new Error(`Failed to check Google Drive release folder: ${findResponse.status} ${await findResponse.text()}`);
  }

  const found = await findResponse.json();
  if (found.files?.[0]) {
    console.log(`Using existing Google Drive release folder ${folderName}: ${found.files[0].id}`);
    return found.files[0];
  }

  const createResponse = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink&supportsAllDrives=true', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId]
    })
  });

  if (!createResponse.ok) {
    throw new Error(`Failed to create Google Drive release folder ${folderName}: ${createResponse.status} ${await createResponse.text()}`);
  }

  const created = await createResponse.json();
  await makeFilePublic(accessToken, created.id);
  console.log(`Created Google Drive release folder ${folderName}: ${created.id}`);
  return created;
}

async function makeFilePublic(accessToken, fileId) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone'
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to make Google Drive file public (${fileId}): ${response.status} ${await response.text()}`);
  }
}

function findArtifacts(directory) {
  const results = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.endsWith('-unpacked') && entry.name !== 'builder-debug.yml' && entry.name !== 'builder-effective-config.yaml') {
        results.push(...findArtifacts(entryPath));
      }
      continue;
    }

    if (artifactExtensions.some((extension) => entry.name.endsWith(extension))) {
      results.push(entryPath);
    }
  }
  return results.sort();
}

function classifyArtifact(fileName) {
  if (fileName.endsWith('.exe')) {
    return { platform: 'windows', arch: inferArch(fileName), kind: 'installer' };
  }
  if (fileName.endsWith('.dmg')) {
    return { platform: 'macos', arch: inferArch(fileName), kind: 'dmg' };
  }
  if (fileName.endsWith('.zip')) {
    return { platform: 'macos', arch: inferArch(fileName), kind: 'zip' };
  }
  if (fileName.endsWith('.AppImage')) {
    return { platform: 'linux', arch: inferArch(fileName), kind: 'appimage' };
  }
  if (fileName.endsWith('.deb')) {
    return { platform: 'linux', arch: inferArch(fileName), kind: 'deb' };
  }
  if (fileName.endsWith('.tar.gz')) {
    return { platform: 'linux', arch: inferArch(fileName), kind: 'tar.gz' };
  }
  return { platform: 'unknown', arch: inferArch(fileName), kind: extname(fileName).replace('.', '') || 'file' };
}

function inferArch(fileName) {
  const normalized = fileName.toLowerCase();
  if (normalized.includes('arm64') || normalized.includes('aarch64')) {
    return 'arm64';
  }
  if (normalized.includes('ia32') || normalized.includes('x86')) {
    return 'ia32';
  }
  return 'x64';
}

function getMimeType(fileName) {
  if (fileName.endsWith('.exe')) {
    return 'application/vnd.microsoft.portable-executable';
  }
  if (fileName.endsWith('.dmg')) {
    return 'application/x-apple-diskimage';
  }
  if (fileName.endsWith('.zip')) {
    return 'application/zip';
  }
  if (fileName.endsWith('.AppImage')) {
    return 'application/octet-stream';
  }
  if (fileName.endsWith('.deb')) {
    return 'application/vnd.debian.binary-package';
  }
  if (fileName.endsWith('.tar.gz')) {
    return 'application/gzip';
  }
  return 'application/octet-stream';
}

function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}
