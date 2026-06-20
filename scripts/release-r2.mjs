#!/usr/bin/env node
import { createHash, createHmac } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
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
  loadEnvFile(args.envFile ?? 'envs/.env.r2');

  const version = args.version ?? readJson(desktopPackagePath).version;
  const artifactsDir = resolve(args.artifactsDir ?? defaultArtifactsDir);
  const packageTarget = args.packageTarget;
  const r2 = readR2Config(args);
  const sourceCommit = getSourceCommit();
  const manifest = readJson(manifestPath);
  const changes = args.changes?.length ? args.changes : getReleaseChanges(manifest, version, sourceCommit);
  const releasePrefix = joinObjectKey(r2.prefix, `v${version}`);

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

  const uploadedArtifacts = [];

  for (const artifactPath of artifactPaths) {
    const fileName = basename(artifactPath);
    const objectKey = joinObjectKey(releasePrefix, fileName);
    const stats = statSync(artifactPath);
    const contentType = getMimeType(fileName);
    const body = readFileSync(artifactPath);

    await putR2Object({
      ...r2,
      objectKey,
      contentType,
      body
    });

    uploadedArtifacts.push({
      ...classifyArtifact(fileName),
      fileName,
      size: stats.size,
      sha256: sha256Buffer(body),
      r2Bucket: r2.bucket,
      r2Key: objectKey,
      downloadUrl: publicObjectUrl(r2.publicBaseUrl, objectKey),
      webViewUrl: publicObjectUrl(r2.publicBaseUrl, objectKey)
    });

    console.log(`Uploaded ${fileName} -> r2://${r2.bucket}/${objectKey}`);
  }

  const now = new Date().toISOString();
  const nextRelease = {
    version,
    releasedAt: now,
    storageProvider: 'cloudflare-r2',
    storageBucket: r2.bucket,
    storagePrefix: releasePrefix,
    storageFolderUrl: publicObjectUrl(r2.publicBaseUrl, `${releasePrefix}/`),
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
  console.log(`Release Sky Movie artifacts to Cloudflare R2.

Usage:
  node scripts/release-r2.mjs [options]

Options:
  --package [target]        Build artifacts before uploading. target: all, current, win, mac, linux.
  --version <version>       Release version. Defaults to desktop-app/package.json version.
  --artifacts-dir <path>    Directory containing packaged artifacts. Defaults to desktop-app/dist.
  --env-file <path>         Local env file to load. Defaults to envs/.env.r2.
  --notes <text>            Release notes stored in website/public/releases.json.
  --change <text>           Add a curated What's New line. Can be repeated. Defaults to git log since previous release.
  --commit                  Commit website/public/releases.json after upload. Default.
  --no-commit               Update JSON without creating a git commit.`);
}

function readR2Config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL;
  const prefix = trimSlashes(process.env.CLOUDFLARE_R2_PREFIX ?? '');

  const missing = [];
  if (!accountId) missing.push('CLOUDFLARE_ACCOUNT_ID');
  if (!bucket) missing.push('CLOUDFLARE_R2_BUCKET');
  if (!accessKeyId) missing.push('CLOUDFLARE_R2_ACCESS_KEY_ID');
  if (!secretAccessKey) missing.push('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
  if (!publicBaseUrl) missing.push('CLOUDFLARE_R2_PUBLIC_BASE_URL');

  if (missing.length) {
    throw new Error(`Missing R2 configuration: ${missing.join(', ')}. Fill envs/.env.r2 or pass environment variables.`);
  }

  return {
    accountId,
    bucket,
    accessKeyId,
    secretAccessKey,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    publicBaseUrl: publicBaseUrl.replace(/\/+$/, ''),
    prefix
  };
}

async function putR2Object({ endpoint, bucket, accessKeyId, secretAccessKey, objectKey, contentType, body }) {
  const service = 's3';
  const region = 'auto';
  const method = 'PUT';
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Buffer(body);
  const encodedKey = encodeObjectKey(objectKey);
  const host = new URL(endpoint).host;
  const canonicalUri = `/${bucket}/${encodedKey}`;
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`
  ].join('\n') + '\n';
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [
    method,
    canonicalUri,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join('\n');
  const signingKey = getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(`${endpoint}${canonicalUri}`, {
    method,
    headers: {
      Authorization: authorization,
      'Content-Type': contentType,
      'X-Amz-Content-Sha256': payloadHash,
      'X-Amz-Date': amzDate
    },
    body
  });

  if (!response.ok) {
    throw new Error(`Cloudflare R2 upload failed for ${objectKey}: ${response.status} ${await response.text()}`);
  }
}

function getSignatureKey(secretAccessKey, dateStamp, region, service) {
  const kDate = createHmac('sha256', `AWS4${secretAccessKey}`).update(dateStamp).digest();
  const kRegion = createHmac('sha256', kDate).update(region).digest();
  const kService = createHmac('sha256', kRegion).update(service).digest();
  return createHmac('sha256', kService).update('aws4_request').digest();
}

function toAmzDate(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function sha256Hex(value) {
  return createHash('sha256').update(value).digest('hex');
}

function sha256Buffer(value) {
  return createHash('sha256').update(value).digest('hex');
}

function encodeObjectKey(objectKey) {
  return objectKey.split('/').map(encodeURIComponent).join('/');
}

function publicObjectUrl(publicBaseUrl, objectKey) {
  return `${publicBaseUrl.replace(/\/+$/, '')}/${encodeObjectKey(objectKey)}`;
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

function trimSlashes(value) {
  return value.replace(/^\/+|\/+$/g, '');
}

function joinObjectKey(...parts) {
  return parts.map((part) => trimSlashes(String(part))).filter(Boolean).join('/');
}

function getPnpmCommand() {
  return process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
}

function getGitCommand() {
  return process.platform === 'win32' ? 'git.exe' : 'git';
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}
