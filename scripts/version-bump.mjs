#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import * as readline from 'node:readline';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const rootPackagePath = join(repoRoot, 'package.json');
const desktopPackagePath = join(repoRoot, 'desktop-app', 'package.json');
const changelogPath = join(repoRoot, 'CHANGELOG.md');

const bumpTypes = {
  major: 0,
  minor: 1,
  patch: 2
};

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  const bumpType = args[0];
  const customVersion = args.find(arg => arg.match(/^\d+\.\d+\.\d+$/));
  const skipConfirm = args.includes('--yes') || args.includes('-y');

  if (!bumpType && !customVersion) {
    console.error('Error: Specify bump type (major, minor, patch) or custom version (e.g., 1.2.3)');
    printHelp();
    process.exit(1);
  }

  // Read current version from desktop package
  const desktopPackage = readJson(desktopPackagePath);
  const currentVersion = desktopPackage.version;
  
  let newVersion;
  
  if (customVersion) {
    newVersion = customVersion;
    console.log(`Setting custom version: ${currentVersion} → ${newVersion}`);
  } else if (bumpTypes.hasOwnProperty(bumpType)) {
    newVersion = bumpVersion(currentVersion, bumpType);
    console.log(`Bumping ${bumpType} version: ${currentVersion} → ${newVersion}`);
  } else {
    console.error(`Error: Invalid bump type "${bumpType}". Use major, minor, or patch.`);
    process.exit(1);
  }

  console.log('\n📋 Dry run preview:\n');

  // Update desktop-app/package.json
  updatePackageVersion(desktopPackagePath, newVersion);
  console.log(`  ✓ Updated desktop-app/package.json`);

  // Update root package.json
  updatePackageVersion(rootPackagePath, newVersion);
  console.log(`  ✓ Updated package.json`);

  // Get commit count for changelog
  const commitCount = getCommitCount(currentVersion);
  
  // Update CHANGELOG.md
  updateChangelog(changelogPath, currentVersion, newVersion);
  console.log(`  ✓ Updated CHANGELOG.md with ${commitCount} commit${commitCount !== 1 ? 's' : ''}`);

  console.log(`\n📦 Version bumped to ${newVersion}`);
  
  // Show what will be committed
  console.log('\n📝 Git operations to be performed:');
  console.log(`  1. git add package.json desktop-app/package.json CHANGELOG.md`);
  console.log(`  2. git commit -m "chore: release v${newVersion}"`);
  console.log(`  3. git push origin main`);
  console.log(`  4. git tag v${newVersion}`);
  console.log(`  5. git push origin v${newVersion}`);

  // Ask for confirmation
  if (!skipConfirm) {
    const confirmed = await askConfirmation('\n❓ Do you want to commit, tag, and push these changes? (yes/no): ');
    
    if (!confirmed) {
      console.log('\n❌ Aborted. Changes are staged but not committed.');
      console.log('   You can manually commit with:');
      console.log(`   git add package.json desktop-app/package.json CHANGELOG.md`);
      console.log(`   git commit -m "chore: release v${newVersion}"`);
      return;
    }
  }

  console.log('\n🚀 Executing git operations...\n');

  // Git add
  const addResult = spawnSync('git', ['add', 'package.json', 'desktop-app/package.json', 'CHANGELOG.md'], {
    cwd: repoRoot,
    stdio: 'inherit'
  });

  if (addResult.status !== 0) {
    console.error('❌ Failed to stage files');
    process.exit(1);
  }
  console.log('  ✓ Staged files');

  // Git commit
  const commitResult = spawnSync('git', ['commit', '-m', `chore: release v${newVersion}`], {
    cwd: repoRoot,
    stdio: 'inherit'
  });

  if (commitResult.status !== 0) {
    console.error('❌ Failed to commit changes');
    process.exit(1);
  }
  console.log('  ✓ Created commit');

  // Git push changes first
  const pushResult = spawnSync('git', ['push', 'origin', 'main'], {
    cwd: repoRoot,
    stdio: 'inherit'
  });

  if (pushResult.status !== 0) {
    console.error('❌ Failed to push commits');
    process.exit(1);
  }
  console.log('  ✓ Pushed commits');

  // Git tag (after push)
  const tagResult = spawnSync('git', ['tag', `v${newVersion}`], {
    cwd: repoRoot,
    stdio: 'inherit'
  });

  if (tagResult.status !== 0) {
    console.error('❌ Failed to create tag');
    process.exit(1);
  }
  console.log('  ✓ Created tag');

  // Git push tag
  const pushTagResult = spawnSync('git', ['push', 'origin', `v${newVersion}`], {
    cwd: repoRoot,
    stdio: 'inherit'
  });

  if (pushTagResult.status !== 0) {
    console.error('❌ Failed to push tag');
    process.exit(1);
  }
  console.log('  ✓ Pushed tag');

  console.log(`\n✅ Successfully released version ${newVersion}!`);
  console.log(`\n🔗 GitHub Actions will now build and create the release.`);
  console.log(`   Watch the progress at: https://github.com/${getRepoPath()}/actions`);

  // Wait 7 minutes then check for newer versions
  console.log(`\n⏳ Waiting 7 minutes before checking for newer versions...`);
  await countdown(7 * 60); // 7 minutes in seconds

  console.log(`\n🔍 Checking for newer versions (6 attempts, 1 minute apart)...`);
  
  let newerVersionFound = null;
  
  for (let i = 0; i < 6; i++) {
    console.log(`\nAttempt ${i + 1}/6: Checking for newer version...`);
    const newerVersion = checkForNewerVersion(newVersion);
    
    if (newerVersion) {
      newerVersionFound = newerVersion;
      console.log(`✅ Found newer version: ${newerVersion}`);
      break;
    }
    
    console.log(`No newer version found yet.`);
    
    if (i < 5) {
      console.log(`Waiting 1 minute before next check...`);
      await sleep(60 * 1000); // 1 minute
    }
  }

  if (newerVersionFound) {
    console.log(`\n🚀 Newer version ${newerVersionFound} found. Running release:github --skip-sha...`);
    const releaseResult = spawnSync('pnpm', ['release:github', '--skip-sha'], {
      cwd: repoRoot,
      stdio: 'inherit'
    });

    if (releaseResult.status !== 0) {
      console.error(`❌ Failed to run release:github --skip-sha`);
      process.exit(1);
    }
    
    console.log(`\n✅ Successfully ran release:github --skip-sha for version ${newerVersionFound}`);
  } else {
    console.log(`\n✅ No newer version found after 6 attempts. Script completed.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

function bumpVersion(version, bumpType) {
  const parts = version.split('.').map(Number);
  const index = bumpTypes[bumpType];
  
  parts[index] += 1;
  
  // Reset lower parts to 0
  for (let i = index + 1; i < parts.length; i++) {
    parts[i] = 0;
  }
  
  return parts.join('.');
}

function updatePackageVersion(packagePath, newVersion) {
  const pkg = readJson(packagePath);
  pkg.version = newVersion;
  writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
}

function updateChangelog(changelogPath, oldVersion, newVersion) {
  let changelog = readFileSync(changelogPath, 'utf8');
  const today = new Date().toISOString().split('T')[0];
  
  // Check if version already exists
  if (changelog.includes(`## [${newVersion}]`)) {
    console.log(`⚠ Version ${newVersion} already exists in CHANGELOG.md`);
    return;
  }
  
  // Get commits since last version
  const commits = getCommitsSinceLastVersion(oldVersion);
  
  // Categorize commits
  const categories = {
    added: [],
    changed: [],
    fixed: [],
    other: []
  };
  
  commits.forEach(commit => {
    const msg = commit.message.toLowerCase();
    const author = commit.author || 'Unknown';
    const line = `- ${commit.message} (${author})`;
    
    if (msg.startsWith('feat:') || msg.startsWith('feat(')) {
      categories.added.push(line.replace(/^- feat(\([\w-]+\))?:\s*/i, '- '));
    } else if (msg.startsWith('fix:') || msg.startsWith('fix(')) {
      categories.fixed.push(line.replace(/^- fix(\([\w-]+\))?:\s*/i, '- '));
    } else if (msg.startsWith('chore:') || msg.startsWith('refactor:') || msg.startsWith('perf:')) {
      categories.changed.push(line.replace(/^- (chore|refactor|perf)(\([\w-]+\))?:\s*/i, '- '));
    } else if (!msg.startsWith('merge') && !msg.startsWith('bump')) {
      categories.other.push(line);
    }
  });
  
  // Build new entry
  const sections = [];
  sections.push(`## [${newVersion}] - ${today}`);
  sections.push('');
  
  if (categories.added.length > 0) {
    sections.push('### Added');
    sections.push('');
    sections.push(...categories.added);
    sections.push('');
  }
  
  if (categories.changed.length > 0) {
    sections.push('### Changed');
    sections.push('');
    sections.push(...categories.changed);
    sections.push('');
  }
  
  if (categories.fixed.length > 0) {
    sections.push('### Fixed');
    sections.push('');
    sections.push(...categories.fixed);
    sections.push('');
  }
  
  if (categories.other.length > 0) {
    sections.push('### Other');
    sections.push('');
    sections.push(...categories.other);
    sections.push('');
  }
  
  // If no commits found, add placeholder
  if (commits.length === 0) {
    sections.push('### Changed');
    sections.push('');
    sections.push('- Minor updates and improvements');
    sections.push('');
  }
  
  const newEntry = sections.join('\n');
  
  // Find where to insert new version (after the title and before first version)
  const lines = changelog.split('\n');
  let insertIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('## [')) {
      insertIndex = i;
      break;
    }
  }
  
  if (insertIndex === -1) {
    console.log('⚠ Could not find insertion point in CHANGELOG.md');
    return;
  }
  
  // Insert new entry
  lines.splice(insertIndex, 0, newEntry);
  
  // Update version link at bottom
  const versionLinkPattern = /\[[\d.]+\]:\s*https:\/\/github\.com\/[\w-]+\/[\w-]+\/releases\/tag\/v[\d.]+/;
  const lastVersionLinkIndex = lines.findLastIndex(line => versionLinkPattern.test(line));
  
  if (lastVersionLinkIndex !== -1) {
    const repoMatch = lines[lastVersionLinkIndex].match(/https:\/\/github\.com\/([\w-]+\/[\w-]+)\//);
    if (repoMatch) {
      const repoPath = repoMatch[1];
      const newLink = `[${newVersion}]: https://github.com/${repoPath}/releases/tag/v${newVersion}`;
      lines.splice(lastVersionLinkIndex + 1, 0, newLink);
    }
  }
  
  writeFileSync(changelogPath, lines.join('\n'));
}

function getCommitsSinceLastVersion(version) {
  // Try to find last version tag
  const result = spawnSync('git', ['tag', '-l', `v${version}`], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  
  let gitRange = 'HEAD';
  
  if (result.status === 0 && result.stdout.trim()) {
    // Tag exists, get commits since that tag
    gitRange = `v${version}..HEAD`;
  } else {
    // No tag found, try to get last N commits
    gitRange = 'HEAD~10..HEAD';
  }
  
  // Get commits with author name
  const logResult = spawnSync('git', ['log', gitRange, '--pretty=format:%s|%an', '--no-merges'], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  
  if (logResult.status !== 0 || !logResult.stdout.trim()) {
    return [];
  }
  
  return logResult.stdout
    .trim()
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const [message, author] = line.split('|');
      return { 
        message: message.trim(),
        author: author ? author.trim() : 'Unknown'
      };
    });
}

function getCommitCount(version) {
  const commits = getCommitsSinceLastVersion(version);
  return commits.length;
}

function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'yes' || normalized === 'y');
    });
  });
}

function getRepoPath() {
  const result = spawnSync('git', ['remote', 'get-url', 'origin'], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  
  if (result.status !== 0) {
    return 'your-org/your-repo';
  }
  
  const match = result.stdout.match(/github\.com[/:]([\w-]+\/[\w-]+)/);
  return match ? match[1].replace(/\.git$/, '') : 'your-org/your-repo';
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function checkForNewerVersion(currentVersion) {
  console.log(`   Current version: ${currentVersion}`);
  
  // Fetch all tags from remote
  const fetchResult = spawnSync('git', ['fetch', '--tags', '--force'], {
    cwd: repoRoot,
    stdio: 'inherit'
  });

  if (fetchResult.status !== 0) {
    console.error('❌ Failed to fetch tags');
    return null;
  }

  // Get all version tags from remote
  const tagResult = spawnSync('git', ['ls-remote', '--tags', 'origin'], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  if (tagResult.status !== 0) {
    console.error('❌ Failed to get remote tags');
    return null;
  }

  const tags = tagResult.stdout
    .trim()
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.split('\t')[1].replace(/^refs\/tags\//, '').replace(/\^\{\}$/, ''));

  console.log(`   Found ${tags.length} remote tags: ${tags.slice(0, 5).join(', ')}${tags.length > 5 ? '...' : ''}`);

  // Filter version tags
  const versionTags = tags
    .filter(tag => tag.match(/^v\d+\.\d+\.\d+$/))
    .map(tag => tag.replace(/^v/, ''));

  console.log(`   Version tags: ${versionTags.join(', ')}`);

  if (versionTags.length === 0) {
    console.log('   No version tags found');
    return null;
  }

  // Find the latest version
  const latestVersion = versionTags
    .sort((a, b) => {
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);
      for (let i = 0; i < 3; i++) {
        if (aParts[i] !== bParts[i]) {
          return bParts[i] - aParts[i];
        }
      }
      return 0;
    })[0];

  console.log(`   Latest version: ${latestVersion}`);

  // Compare versions
  const currentParts = currentVersion.split('.').map(Number);
  const latestParts = latestVersion.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (latestParts[i] > currentParts[i]) {
      console.log(`   ✅ ${latestVersion} is newer than ${currentVersion}`);
      return latestVersion;
    }
    if (latestParts[i] < currentParts[i]) {
      console.log(`   ${latestVersion} is older than ${currentVersion}`);
      return null;
    }
  }

  console.log(`   ${latestVersion} is the same as ${currentVersion}`);
  return null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function countdown(seconds) {
  for (let i = seconds; i >= 0; i--) {
    const minutes = Math.floor(i / 60);
    const secs = i % 60;
    process.stdout.write(`\r   ${minutes}:${secs.toString().padStart(2, '0')} remaining`);
    await sleep(1000);
  }
  process.stdout.write('\r');
}

function printHelp() {
  console.log(`Version Bump Script

Usage:
  pnpm version:major                 Bump major version (1.0.0 → 2.0.0)
  pnpm version:minor                 Bump minor version (1.0.0 → 1.1.0)
  pnpm version:patch                 Bump patch version (1.0.0 → 1.0.1)
  pnpm version:set <version>         Set specific version (e.g., 2.5.3)

Options:
  -y, --yes                          Skip confirmation prompt

Examples:
  pnpm version:major                 # 0.1.5 → 1.0.0 (with confirmation)
  pnpm version:minor                 # 0.1.5 → 0.2.0 (with confirmation)
  pnpm version:patch                 # 0.1.5 → 0.1.6 (with confirmation)
  pnpm version:patch -- --yes        # 0.1.5 → 0.1.6 (skip confirmation)
  pnpm version:set 2.0.0            # Set to 2.0.0

The script:
  1. Updates package.json and desktop-app/package.json
  2. Generates CHANGELOG.md entry from git commits
  3. Shows a preview of changes
  4. Asks for confirmation (unless --yes)
  5. Commits, tags, and pushes automatically
`);
}
