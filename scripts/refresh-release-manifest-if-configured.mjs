#!/usr/bin/env node
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifestPath = join(repoRoot, 'website', 'public', 'releases.json');
const envFile = join(repoRoot, 'envs', '.env.github');
const hasEnvFile = existsSync(envFile);
const defaultOwner = process.env.GITHUB_OWNER;
const defaultRepo = process.env.GITHUB_REPO;
const token = process.env.GITHUB_TOKEN || (hasEnvFile ? readGithubTokenFromEnvFile(envFile) : undefined);

if (!token || (!defaultOwner && !defaultRepo)) {
  console.log('Skipping website release manifest refresh: GITHUB_TOKEN and repo metadata are not configured.');
  process.exit(0);
}

const owner = defaultOwner || resolveGitHubOwner();
const repo = defaultRepo || resolveGitHubRepo();

try {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      console.log('Skipping website release manifest refresh: no GitHub release exists yet.');
      process.exit(0);
    }
    throw new Error(`GitHub API error: ${response.status} ${await response.text()}`);
  }

  const release = await response.json();
  const version = String(release.tag_name || '').replace(/^v/, '');
  if (!version) {
    console.log('Skipping website release manifest refresh: release tag is missing.');
    process.exit(0);
  }

  const result = spawnSync('node', ['scripts/release-github.mjs', '--skip-sha', '--no-commit', '--owner', owner, '--repo', repo, '--token', token], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: { ...process.env, GITHUB_TOKEN: token, GITHUB_OWNER: owner, GITHUB_REPO: repo }
  });

  if (result.status !== 0) {
    throw new Error(`release-github update failed with exit code ${result.status}`);
  }

  console.log(`Updated website release manifest for ${owner}/${repo} from latest GitHub release (${version}).`);
} catch (error) {
  console.warn('Website release manifest refresh was skipped:', error instanceof Error ? error.message : String(error));
  process.exit(0);
}

function readGithubTokenFromEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const match = content.match(/(?:^|\n)\s*GITHUB_TOKEN\s*=\s*['"]?([^\r\n'"#]+)['"]?/);
    return match ? match[1].trim() : undefined;
  } catch {
    return undefined;
  }
}

function resolveGitHubOwner() {
  const remote = process.env.GITHUB_REPOSITORY || fetchGitRemoteUrl();
  if (!remote) return undefined;
  const match = remote.match(/github\.com[:/](.+?)\/(.+?)(?:\.git)?$/i);
  return match ? match[1] : undefined;
}

function resolveGitHubRepo() {
  const remote = process.env.GITHUB_REPOSITORY || fetchGitRemoteUrl();
  if (!remote) return undefined;
  const match = remote.match(/github\.com[:/](.+?)\/(.+?)(?:\.git)?$/i);
  return match ? match[2] : undefined;
}

function fetchGitRemoteUrl() {
  try {
    return execSync('git remote get-url origin', { cwd: repoRoot, encoding: 'utf8' }).trim();
  } catch {
    return undefined;
  }
}
