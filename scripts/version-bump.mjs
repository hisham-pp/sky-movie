#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

  // Update desktop-app/package.json
  updatePackageVersion(desktopPackagePath, newVersion);
  console.log(`✓ Updated desktop-app/package.json`);

  // Update root package.json
  updatePackageVersion(rootPackagePath, newVersion);
  console.log(`✓ Updated package.json`);

  // Update CHANGELOG.md
  updateChangelog(changelogPath, currentVersion, newVersion);
  console.log(`✓ Updated CHANGELOG.md`);

  console.log(`\n✅ Version bumped to ${newVersion}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Update CHANGELOG.md with release notes`);
  console.log(`  2. git add package.json desktop-app/package.json CHANGELOG.md`);
  console.log(`  3. git commit -m "chore: bump version to ${newVersion}"`);
  console.log(`  4. git tag v${newVersion}`);
  console.log(`  5. git push origin main --tags`);
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
  
  // Create new version entry
  const newEntry = [
    `## [${newVersion}] - ${today}`,
    '',
    '### Added',
    '- ',
    '',
    '### Changed',
    '- ',
    '',
    '### Fixed',
    '- ',
    '',
    ''
  ].join('\n');
  
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

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function printHelp() {
  console.log(`Version Bump Script

Usage:
  pnpm version:major                 Bump major version (1.0.0 → 2.0.0)
  pnpm version:minor                 Bump minor version (1.0.0 → 1.1.0)
  pnpm version:patch                 Bump patch version (1.0.0 → 1.0.1)
  pnpm version:set <version>         Set specific version (e.g., 2.5.3)

Examples:
  pnpm version:major                 # 0.1.4 → 1.0.0
  pnpm version:minor                 # 0.1.4 → 0.2.0
  pnpm version:patch                 # 0.1.4 → 0.1.5
  pnpm version:set 2.0.0            # Set to 2.0.0

The script updates:
  - package.json
  - desktop-app/package.json
  - CHANGELOG.md (adds new version entry)
`);
}
