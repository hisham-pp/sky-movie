# GitHub Releases

Sky Movie supports GitHub Releases for distributing desktop app downloads. This provides built-in hosting and integrates with your website's releases page.

## Overview

The GitHub release workflow:
1. Builds desktop apps for Windows (x64, ARM64), macOS (x64, ARM64), and Linux (x64, ARM64)
2. Creates a GitHub release with all artifacts
3. Updates `website/public/releases.json` so the website can show downloads
4. Works alongside or instead of the R2 release flow

## GitHub Actions Workflow

The `.github/workflows/release.yml` workflow triggers on:
- **Tag push**: Push a tag like `v0.1.0` to trigger a release
- **Manual dispatch**: Run the workflow manually from GitHub Actions UI

### Creating a Release

#### Option 1: Push a Tag

```powershell
git tag v0.1.0
git push origin v0.1.0
```

The workflow will build all platforms and create the GitHub release automatically.

#### Option 2: Manual Workflow Dispatch

1. Go to **Actions** > **Release** in your GitHub repository
2. Click **Run workflow**
3. Enter the version (e.g., `0.1.0`)
4. Click **Run workflow**

## Build Targets

The workflow builds for all major platforms:

### Windows
- x64 installer (NSIS)
- ARM64 installer (NSIS)

### macOS
- x64 DMG and ZIP
- ARM64 DMG and ZIP (Apple Silicon)

### Linux
- x64 AppImage, DEB, tar.gz
- ARM64 AppImage, DEB, tar.gz

## Updating Website Release Manifest

After the GitHub release is created, update your website's `releases.json`.

### Setup

Copy the example env file and configure your GitHub token:

```powershell
Copy-Item envs\.env.github.example envs\.env.github
```

Edit `envs/.env.github` and add your GitHub token:

```text
GITHUB_TOKEN=ghp_your_github_personal_access_token_here
```

**Security**: `envs/.env.github` is in `.gitignore` and will not be committed.

### Usage

```powershell
# Update releases.json from GitHub release
pnpm run release:github

# Or specify version explicitly
pnpm run release:github -- --version 0.1.0
```

The script will:
1. Fetch the release from GitHub
2. Download each artifact to compute SHA-256 hashes
3. Update `website/public/releases.json` with download URLs
4. Commit the changes

### Options

```powershell
# Skip SHA-256 computation (faster)
pnpm run release:github -- --skip-sha

# Don't commit the changes
pnpm run release:github -- --no-commit

# Specify repo details
pnpm run release:github -- --owner your-org --repo sky-movie
```

## GitHub Token

The release script needs a GitHub token to fetch release data and download artifacts.

### Creating a Token

1. Go to **GitHub Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Select scopes:
   - `repo` (Full control of private repositories)
   - OR just `public_repo` for public repositories only
4. Generate and copy the token

### Configuration

**Option 1: Environment File (Recommended)**

```powershell
Copy-Item envs\.env.github.example envs\.env.github
```

Edit `envs/.env.github`:
```text
GITHUB_TOKEN=ghp_your_github_personal_access_token_here
```

**Option 2: Command Line**

```powershell
# Pass as argument
pnpm run release:github -- --token ghp_your_token_here

# Or set environment variable temporarily
$env:GITHUB_TOKEN = "ghp_your_token_here"
pnpm run release:github
```

## Release Workflow Options

### Draft Releases

To create draft releases (not immediately public):

Edit `.github/workflows/release.yml`:

```yaml
- name: Create Release
  uses: softprops/action-gh-release@v1
  with:
    draft: true  # Change to true
```

### Pre-releases

For alpha/beta releases, use prerelease tags:

```powershell
git tag v0.1.0-beta.1
git push origin v0.1.0-beta.1
```

Or mark as prerelease in the workflow:

```yaml
- name: Create Release
  uses: softprops/action-gh-release@v1
  with:
    prerelease: true  # Change to true
```

## Release Notes

The workflow tries to extract release notes from `CHANGELOG.md`. If not found, it uses a generic message.

To customize, edit the release manually on GitHub after creation, or create a `CHANGELOG.md`:

```markdown
# Changelog

## [0.1.0] - 2026-01-15

### Added
- Initial desktop app release
- Windows, macOS, and Linux support
- ARM64 builds for all platforms

### Changed
- Improved performance

### Fixed
- Bug fixes
```

## Choosing Between R2 and GitHub Releases

| Feature | GitHub Releases | Cloudflare R2 |
|---------|----------------|---------------|
| Setup complexity | Easy (built-in) | Moderate (configure R2) |
| Cost | Free | Pay per storage/bandwidth |
| Download speed | Good (CDN) | Excellent (global CDN) |
| Storage limits | None for releases | Configurable |
| Custom domain | github.com | Your domain |

You can use both:
- GitHub Releases for public open-source distribution
- R2 for additional hosting or custom domains

## Troubleshooting

### Workflow fails to build

Check the Actions logs. Common issues:
- Missing native dependencies on Linux
- Code signing issues on macOS (set `CSC_IDENTITY_AUTO_DISCOVERY: false` to skip)
- Insufficient disk space

### Release script can't find release

Ensure:
- The tag matches the version (e.g., `v0.1.0` for version `0.1.0`)
- The GitHub release was created
- Your token has correct permissions

### Missing artifacts

Check that:
- All build jobs completed successfully
- Artifact extensions match expectations
- `electron-builder.yml` targets are configured correctly
