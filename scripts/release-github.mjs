#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const desktopPackagePath = join(repoRoot, 'desktop-app', 'package.json');
const manifestPath = join(repoRoot, 'website', 'public', 'releases.json');
const artifactExtensions = ['.exe', '.dmg', '.zip', '.AppImage', '.deb', '.tar.gz'];

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  
  // Load environment from envs/.env.github if it exists
  loadEnvFile(args.envFile ?? 'envs/.env.github');
  
  const owner = args.owner ?? process.env.GITHUB_OWNER ?? await getRepoOwner();
  const repo = args.repo ?? process.env.GITHUB_REPO ?? await getRepoName();
  const token = args.token ?? process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable or --token argument required.');
  }

  console.log(`Fetching latest GitHub release for ${owner}/${repo}...`);

  const release = args.version 
    ? await fetchGitHubRelease(owner, repo, `v${args.version}`, token)
    : await fetchLatestGitHubRelease(owner, repo, token);
    
  if (!release) {
    const versionMsg = args.version ? `v${args.version}` : 'latest';
    throw new Error(`GitHub release ${versionMsg} not found. Create the release first with the GitHub Actions workflow.`);
  }

  const version = release.tag_name.replace(/^v/, '');
  console.log(`Found release: ${release.name} (${release.tag_name})`);
  console.log(`Published: ${release.published_at}`);
  console.log(`Assets: ${release.assets.length}`);

  const artifacts = release.assets
    .filter((asset) => artifactExtensions.some((ext) => asset.name.endsWith(ext)))
    .map((asset) => ({
      ...classifyArtifact(asset.name),
      fileName: asset.name,
      size: asset.size,
      sha256: args.skipSha ? null : undefined,
      downloadUrl: asset.browser_download_url,
      webViewUrl: release.html_url
    }));

  if (!artifacts.length) {
    throw new Error('No valid release artifacts found in GitHub release.');
  }

  if (!args.skipSha) {
    console.log('Downloading artifacts to compute SHA-256 hashes...');
    for (const artifact of artifacts) {
      const buffer = await downloadAsset(artifact.downloadUrl, token);
      artifact.sha256 = sha256Buffer(buffer);
      console.log(`  ${artifact.fileName}: ${artifact.sha256}`);
    }
  }

  const manifest = existsSync(manifestPath) ? readJson(manifestPath) : { releases: [] };
  const now = new Date().toISOString();

  const releaseNotes = release.body?.trim() || `Sky Movie ${version}`;
  const changes = releaseNotes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('Release'));

  const nextRelease = {
    version,
    releasedAt: release.published_at,
    storageProvider: 'github-releases',
    storageFolderUrl: release.html_url,
    sourceCommit: {
      sha: release.target_commitish,
      message: `Release ${version}`
    },
    notes: `Sky Movie ${version}`,
    changes: changes.length ? changes : [`Sky Movie ${version}`],
    artifacts
  };

  manifest.latestVersion = version;
  manifest.updatedAt = now;
  manifest.releases = [
    nextRelease,
    ...(manifest.releases ?? []).filter((r) => r.version !== version)
  ].slice(0, 20);

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nUpdated website release manifest: ${manifestPath}`);

  if (args.commit) {
    const { spawnSync } = await import('node:child_process');
    spawnSync('git', ['add', 'website/public/releases.json'], { cwd: repoRoot, stdio: 'inherit' });
    const diffCheck = spawnSync('git', ['diff', '--cached', '--quiet', '--', 'website/public/releases.json'], { cwd: repoRoot });
    if (diffCheck.status !== 0) {
      spawnSync('git', ['commit', '-m', `chore(release): publish Sky Movie ${version} downloads from GitHub`], {
        cwd: repoRoot,
        stdio: 'inherit'
      });
      console.log('Committed release manifest.');
    } else {
      console.log('No changes to commit.');
    }
  }
}

function parseArgs(argv) {
  const parsed = { commit: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--version') {
      parsed.version = requireValue(arg, next);
      i++;
    } else if (arg === '--owner') {
      parsed.owner = requireValue(arg, next);
      i++;
    } else if (arg === '--repo') {
      parsed.repo = requireValue(arg, next);
      i++;
    } else if (arg === '--token') {
      parsed.token = requireValue(arg, next);
      i++;
    } else if (arg === '--env-file') {
      parsed.envFile = requireValue(arg, next);
      i++;
    } else if (arg === '--skip-sha') {
      parsed.skipSha = true;
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
  return parsed;
}

function requireValue(name, value) {
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}

function printHelp() {
  console.log(`Update releases.json from GitHub releases.

Usage:
  node scripts/release-github.mjs [options]

Options:
  --version <version>    Specific release version to fetch. If omitted, fetches the latest release.
  --owner <owner>        GitHub repository owner. Defaults to GITHUB_OWNER env var or git remote origin.
  --repo <repo>          GitHub repository name. Defaults to GITHUB_REPO env var or git remote origin.
  --token <token>        GitHub token. Defaults to GITHUB_TOKEN env var.
  --env-file <path>      Local env file to load. Defaults to envs/.env.github.
  --skip-sha             Skip SHA-256 hash computation (faster but less secure).
  --commit               Commit website/public/releases.json after update. Default.
  --no-commit            Update JSON without creating a git commit.
  --help, -h             Show this help message.`);
}

async function fetchGitHubRelease(owner, repo, tag, token) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`GitHub API error: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function fetchLatestGitHubRelease(owner, repo, token) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`GitHub API error: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function downloadAsset(url, token) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/octet-stream'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download asset: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

function sha256Buffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function classifyArtifact(fileName) {
  const normalized = fileName.toLowerCase();
  let arch = 'x64';
  if (normalized.includes('arm64') || normalized.includes('aarch64')) {
    arch = 'arm64';
  } else if (normalized.includes('ia32') || normalized.includes('x86') && !normalized.includes('x64')) {
    arch = 'ia32';
  }

  if (fileName.endsWith('.exe')) {
    return { platform: 'windows', arch, kind: 'installer' };
  }
  if (fileName.endsWith('.dmg')) {
    return { platform: 'macos', arch, kind: 'dmg' };
  }
  if (fileName.endsWith('.zip')) {
    return { platform: 'macos', arch, kind: 'zip' };
  }
  if (fileName.endsWith('.AppImage')) {
    return { platform: 'linux', arch, kind: 'appimage' };
  }
  if (fileName.endsWith('.deb')) {
    return { platform: 'linux', arch, kind: 'deb' };
  }
  if (fileName.endsWith('.tar.gz')) {
    return { platform: 'linux', arch, kind: 'tar.gz' };
  }
  return { platform: 'unknown', arch, kind: 'file' };
}

async function getRepoOwner() {
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync('git', ['remote', 'get-url', 'origin'], { cwd: repoRoot, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error('Could not determine repository owner from git remote. Use --owner.');
  }
  const match = result.stdout.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);
  if (!match) {
    throw new Error('Could not parse GitHub owner from git remote. Use --owner.');
  }
  return match[1];
}

async function getRepoName() {
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync('git', ['remote', 'get-url', 'origin'], { cwd: repoRoot, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error('Could not determine repository name from git remote. Use --repo.');
  }
  const match = result.stdout.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);
  if (!match) {
    throw new Error('Could not parse GitHub repo from git remote. Use --repo.');
  }
  return match[2].replace(/\.git$/, '');
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
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
