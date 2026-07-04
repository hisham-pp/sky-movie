# Scripts

Helper scripts for building, packaging, and releasing Sky Movie.

## Build Scripts

### `build-desktop-app.sh` / `build-desktop-app.ps1`
Build the desktop app for the current platform.

```bash
# macOS/Linux
./scripts/build-desktop-app.sh

# Windows
.\scripts\build-desktop-app.ps1
```

### `build-windows-app.ps1`
Build Windows desktop app with native module rebuilding.

```powershell
.\scripts\build-windows-app.ps1
```

## Release Scripts

### `release-r2.mjs`
Upload release artifacts to Cloudflare R2 and update `website/public/releases.json`.

See [RELEASES_R2.md](../docs/RELEASES_R2.md) for full documentation.

```powershell
# Upload already-built artifacts
pnpm run release:r2

# Package then upload
pnpm run release:r2:package

# Custom options
node scripts/release-r2.mjs --version 0.1.0 --package all
```

### `release-github.mjs`
Fetch GitHub release data and update `website/public/releases.json`.

See [RELEASES_GITHUB.md](../docs/RELEASES_GITHUB.md) for full documentation.

```powershell
# Update from latest GitHub release
$env:GITHUB_TOKEN = "your-token"
pnpm run release:github

# Custom options
node scripts/release-github.mjs --version 0.1.0 --skip-sha
```

### `update-release-manifest.sh`
CI-only bash + curl + jq equivalent of `release-github.mjs --skip-sha --no-commit`. Used by the release job in `.github/workflows/release.yml` so it doesn't need a Node/pnpm install. Keep its output format in sync with `release-github.mjs` if the manifest schema changes.

```bash
GITHUB_TOKEN=... GITHUB_REPOSITORY=owner/repo scripts/update-release-manifest.sh v0.1.0
```

### `release-google-drive.mjs`
(Deprecated) Upload releases to Google Drive. R2 is the current release target.

See [RELEASES_GOOGLE_DRIVE.md](../docs/RELEASES_GOOGLE_DRIVE.md) for historical reference.

## Version Management

Update version across all files automatically:

```powershell
# Bump major version (0.1.4 → 1.0.0)
pnpm version:major

# Bump minor version (0.1.4 → 0.2.0)
pnpm version:minor

# Bump patch version (0.1.4 → 0.1.5)
pnpm version:patch

# Set custom version
pnpm version:set 2.0.0
```

This updates:
- `package.json`
- `desktop-app/package.json`
- `CHANGELOG.md` (creates new version entry)

## Release Workflows

### GitHub Releases (Recommended for Open Source)

1. **Create Release via Tag**
   ```powershell
   git tag v0.1.0
   git push origin v0.1.0
   ```
   
   This triggers `.github/workflows/release.yml` which builds all platforms and creates a GitHub release.

2. **Update Website**
   ```powershell
   $env:GITHUB_TOKEN = "your-token"
   pnpm run release:github
   ```

### Cloudflare R2 (Recommended for Self-Hosted)

1. **Configure R2**
   ```powershell
   Copy-Item envs\.env.r2.example envs\.env.r2
   # Edit envs/.env.r2 with your credentials
   ```

2. **Package and Upload**
   ```powershell
   pnpm run release:r2:package
   ```

This automatically updates `website/public/releases.json` and commits it.

## Platform Support

All release workflows support:

- **Windows**: x64, ARM64 (NSIS installer)
- **macOS**: x64, ARM64 (DMG, ZIP)
- **Linux**: x64, ARM64 (AppImage, DEB, tar.gz)

## Environment Files

Release scripts load environment variables from:

- `envs/.env.r2` - Cloudflare R2 configuration
- `envs/.env.drive` - Google Drive configuration (deprecated)

Template files are in `envs.example/`.

**Security**: Never commit actual `.env` files. They're in `.gitignore`.
