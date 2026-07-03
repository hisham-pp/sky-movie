# Code Signing Guide

## Why Code Signing?

When users download and install Sky Movie on Windows or macOS, they may see security warnings like:

**Windows SmartScreen:**
```
Windows protected your PC
Microsoft Defender SmartScreen prevented an unrecognized app from starting.
Publisher: Unknown publisher
```

**macOS Gatekeeper:**
```
"Sky Movie" cannot be opened because it is from an unidentified developer
```

These warnings appear because the application binaries are not digitally signed with a trusted certificate.

## Solutions

### For Users (Temporary Workaround)

**Windows:**
1. Click "More info" on the SmartScreen warning
2. Click "Run anyway"
3. The app will install normally

**macOS:**
1. Right-click the .dmg or .app file
2. Select "Open"
3. Click "Open" in the dialog
4. Or use Terminal: `xattr -cr /path/to/Sky\ Movie.app`

### For Developers (Permanent Solution)

#### Windows Code Signing

**Option 1: Purchase a Code Signing Certificate**
- Buy from: DigiCert, Sectigo, GlobalSign (~$300-500/year)
- For open source: Consider [SignPath.io](https://about.signpath.io/) (free for OSS)
- Requires company/organization verification

**Option 2: Use GitHub Actions with Azure Key Vault**
1. Store certificate in Azure Key Vault
2. Use in CI/CD pipeline
3. Example workflow:

```yaml
- name: Sign Windows executable
  uses: dlemstra/code-sign-action@v1
  with:
    certificate: '${{ secrets.CERTIFICATE }}'
    password: '${{ secrets.CERTIFICATE_PASSWORD }}'
    folder: 'desktop-app/dist'
```

**Configure electron-builder:**

```yaml
win:
  certificateFile: path/to/cert.pfx
  certificatePassword: ${env.WINDOWS_CERT_PASSWORD}
  # Or use certificate from Windows store
  certificateSha1: ${env.WINDOWS_CERT_SHA1}
  signDlls: true
```

**Environment variables needed:**
```bash
export WINDOWS_CERTIFICATE_PASSWORD="your-cert-password"
# Or for SHA1
export WINDOWS_CERTIFICATE_SHA1="thumbprint-from-cert-store"
```

#### macOS Code Signing

**Requirements:**
- Apple Developer Program membership ($99/year)
- Developer ID Application certificate
- For macOS 10.15+: Notarization required

**Steps:**

1. Get certificates from Apple Developer portal
2. Install in Keychain Access
3. Configure electron-builder:

```yaml
mac:
  identity: "Developer ID Application: Your Name (TEAM_ID)"
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  notarize:
    teamId: ${env.APPLE_TEAM_ID}
    appleId: ${env.APPLE_ID}
    appleIdPassword: ${env.APPLE_APP_SPECIFIC_PASSWORD}
```

4. Create `build/entitlements.mac.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
</dict>
</plist>
```

**Environment variables:**
```bash
export APPLE_ID="your@email.com"
export APPLE_APP_SPECIFIC_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="YOUR_TEAM_ID"
```

#### Linux

Linux doesn't enforce code signing at the OS level, but signing packages is good practice for repository distribution and user trust.

##### GPG Signing for DEB Packages

**Generate a GPG key:**
```bash
gpg --full-generate-key
# Select: RSA and RSA
# Key size: 4096
# Valid for: 1y (or your preference)
# Enter your name and email
```

**Export the public key:**
```bash
gpg --armor --export your@email.com > public.key
# Share this key with users so they can verify signatures
```

**Sign the package:**
```bash
# Install dpkg-sig if not available
sudo apt install dpkg-sig

# Sign the .deb package
dpkg-sig -k YOUR_KEY_ID --sign builder Sky-Movie-*-linux-x64.deb
```

**Verify the signature:**
```bash
# Users can verify with:
dpkg-sig --verify Sky-Movie-*-linux-x64.deb

# Or import your public key first:
gpg --import public.key
dpkg-sig --verify Sky-Movie-*-linux-x64.deb
```

**AutomATE in CI/CD:**

The GitHub Actions workflows (`.github/workflows/release.yml` and `.github/workflows/build-desktop.yml`) now include automatic GPG signing for DEB packages.

**Setup:**

1. **Generate a GPG key** (if you don't have one):
```bash
gpg --full-generate-key
# Select: RSA and RSA
# Key size: 4096
# Valid for: 1y (or your preference)
# Enter your name and email
```

2. **Export your private key**:
```bash
gpg --armor --export-secret-keys your@email.com > private-key.asc
```

3. **Add secrets to GitHub**:
   - Go to your repository **Settings** > **Secrets and variables** > **Actions**
   - Add the following secrets:
     - `GPG_PRIVATE_KEY`: Contents of `private-key.asc` (the entire file including BEGIN/END markers)
     - `GPG_PASSPHRASE`: The passphrase you set when creating the key

4. **Export your public key** for users:
```bash
gpg --armor --export your@email.com > public.key
```
Replace the placeholder `public.key` file in the `platfrom/` folder with your exported key. Users can download it from:
```
https://github.com/hisham-pp/sky-movie/raw/main/platfrom/public.key
```

**How it works:**

The CI/CD workflow will:
- Install `dpkg-sig` on Linux runners
- Import your GPG private key from secrets
- Automatically sign all `.deb` packages after building
- Upload signed packages to the release

**Note:** electron-builder doesn't have built-in GPG signing for DEB packages. The workflow handles this as a post-build step.

##### Alternative: Use AppImage

AppImage format is recommended for Linux distribution as it:
- Doesn't require installation or root privileges
- Avoids package manager conflicts
- Self-contained with all dependencies
- No signing required for basic usage

Users can simply:
```bash
chmod +x Sky-Movie-*-linux-x64.AppImage
./Sky-Movie-*-linux-x64.AppImage
```

##### Package Dependencies

The `electron-builder.yml` now includes proper Linux dependencies to prevent installation issues:

```yaml
deb:
  depends:
    - libgtk-3-0
    - libnotify4
    - libnss3
    - libxss1
    - libxtst6
    - xdg-utils
    - libatspi2.0-0
    - libuuid1
    - libsecret-1-0
  priority: optional
```

This ensures all required system libraries are installed automatically.

## Free Alternatives for Open Source Projects

### 1. SignPath Foundation (Windows)
- Free for open source projects
- Automated signing in CI/CD
- Apply at: https://about.signpath.io/product/open-source

### 2. Build Reputation (Windows)
- Keep publishing regular releases
- After enough downloads without issues, SmartScreen learns your app is safe
- This takes time (months to years)

### 3. Publish via Microsoft Store
- No code signing certificate needed
- Microsoft handles signing
- Requires store approval process

### 4. Homebrew Cask (macOS)
- Distribute via Homebrew
- Users expect warnings from cask installations
- Command: `brew install --cask sky-movie`

## Current Status

Sky Movie is currently **unsigned**. This means:

✅ The app is safe and open source
❌ Security warnings will appear on first install
⚠️ Users must manually bypass warnings

**Recommended for production:**
- Obtain code signing certificates before 1.0 release
- Apply for SignPath Foundation for free Windows signing
- Consider Apple Developer membership for macOS

## Adding Checksums

Until signing is implemented, provide SHA256 checksums for verification:

```bash
# Generate checksums
shasum -a 256 dist/*.exe dist/*.dmg dist/*.deb > checksums.txt

# Users verify with:
shasum -a 256 -c checksums.txt
```

Add checksums to releases.json and display on download page.

## References

- [Electron Code Signing](https://www.electron.build/code-signing)
- [Windows Code Signing Best Practices](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)
- [macOS Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [SignPath for Open Source](https://about.signpath.io/product/open-source)
