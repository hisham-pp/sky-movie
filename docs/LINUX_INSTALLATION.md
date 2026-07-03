# Linux Installation Guide

This guide covers installation and troubleshooting for Sky Movie on Linux distributions.

## Installation Methods

All methods below fetch the latest release version dynamically, so the commands never go stale:

```bash
# Resolve the latest release tag (e.g. v0.7.9)
VERSION=$(curl -fsSL https://api.github.com/repos/hisham-pp/sky-movie/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
```

Run this once per session, then use `$VERSION` in the commands for whichever method you choose.

### Method 1: AppImage (Recommended)

AppImage is the recommended format for Linux as it's self-contained and doesn't require installation.

```bash
# Download the AppImage
wget https://github.com/hisham-pp/sky-movie/releases/download/${VERSION}/Sky-Movie-${VERSION#v}-linux-x64.AppImage

# Make it executable
chmod +x Sky-Movie-${VERSION#v}-linux-x64.AppImage

# Run it
./Sky-Movie-${VERSION#v}-linux-x64.AppImage
```

**To install system-wide:**
```bash
sudo mv Sky-Movie-${VERSION#v}-linux-x64.AppImage /usr/local/bin/sky-movie
sudo chmod +x /usr/local/bin/sky-movie
```

### Method 2: DEB Package (Ubuntu/Debian)

```bash
# Download the .deb package
wget https://github.com/hisham-pp/sky-movie/releases/download/${VERSION}/Sky-Movie-${VERSION#v}-linux-x64.deb

# Install using apt
sudo apt install ./Sky-Movie-${VERSION#v}-linux-x64.deb

# Or using dpkg
sudo dpkg -i Sky-Movie-${VERSION#v}-linux-x64.deb
sudo apt-get install -f  # Fix any dependency issues
```

### Method 3: tar.gz Archive

```bash
# Download and extract
wget https://github.com/hisham-pp/sky-movie/releases/download/${VERSION}/Sky-Movie-${VERSION#v}-linux-x64.tar.gz
tar -xzf Sky-Movie-${VERSION#v}-linux-x64.tar.gz

# Run from the extracted directory
cd sky-movie
./sky-movie
```

## Troubleshooting

### "Already Installed" Error

If you see an error saying the package is already installed:

```bash
# Remove existing installation
sudo apt remove sky-movie

# Or force remove with dpkg
sudo dpkg -r sky-movie

# Clean up any remaining files
sudo rm -rf /opt/sky-movie
sudo rm -rf ~/.local/share/sky-movie

# Reinstall
sudo apt install ./Sky-Movie-*-linux-x64.deb
```

### "Unknown Publisher" Warning

This warning appears because the package isn't signed with a GPG key. This is normal for unsigned Electron apps.

**To proceed with installation:**
```bash
# Install anyway using dpkg
sudo dpkg -i Sky-Movie-*-linux-x64.deb

# Fix any missing dependencies
sudo apt-get install -f
```

**Or use AppImage to avoid this issue entirely:**
```bash
chmod +x Sky-Movie-*-linux-x64.AppImage
./Sky-Movie-*-linux-x64.AppImage
```

### Dependency Issues

If you encounter missing dependency errors:

```bash
# Update package lists
sudo apt update

# Install missing dependencies manually
sudo apt install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libuuid1 libsecret-1-0

# Then reinstall
sudo apt install ./Sky-Movie-*-linux-x64.deb
```

### AppImage Won't Run

If the AppImage fails to execute:

```bash
# Ensure it's executable
chmod +x Sky-Movie-*-linux-x64.AppImage

# Try running with FUSE
./Sky-Movie-*-linux-x64.AppImage

# If FUSE issues, extract and run
./Sky-Movie-*-linux-x64.AppImage --appimage-extract
./squashfs-root/sky-movie
```

### Permission Denied

If you get permission errors:

```bash
# For AppImage
chmod +x Sky-Movie-*-linux-x64.AppImage

# For extracted files
chmod +x sky-movie/sky-movie
```

### App Won't Start

If the app doesn't start after installation:

```bash
# Check for missing libraries
ldd /opt/sky-movie/sky-movie

# Run from terminal to see error messages
/opt/sky-movie/sky-movie

# Check logs
journalctl -xe
```

## Package Verification

To verify the integrity of downloaded packages:

```bash
# Generate SHA256 checksum
sha256sum Sky-Movie-${VERSION#v}-linux-x64.AppImage

# Compare with the checksum provided in the release
```

### GPG Signature Verification

If the DEB packages are GPG-signed, you can verify the signature:

```bash
# Install dpkg-sig if not available
sudo apt install dpkg-sig

# Download the public key from the project
wget https://github.com/hisham-pp/sky-movie/raw/main/platfrom/public.key

# Or clone the repo and use the key directly
git clone https://github.com/hisham-pp/sky-movie.git
gpg --import sky-movie/platfrom/public.key

# Import the public key
gpg --import public.key

# Verify the package signature
dpkg-sig --verify Sky-Movie-${VERSION#v}-linux-x64.deb
```

You should see output like:
```
GOODSIG
Signature made by Sky Movie <your@email.com>
```

## System Requirements

- **OS:** Ubuntu 20.04+, Debian 11+, or compatible distributions
- **Architecture:** x64 (AMD64) or ARM64
- **Dependencies:** GTK3, libnotify, NSS, libXScrnSaver, libXtst, xdg-utils, AT-SPI, libuuid, libsecret

## Uninstallation

### AppImage
```bash
# Simply delete the file
rm Sky-Movie-*-linux-x64.AppImage

# If installed system-wide
sudo rm /usr/local/bin/sky-movie
```

### DEB Package
```bash
sudo apt remove sky-movie
```

### tar.gz
```bash
# Remove the extracted directory
rm -rf sky-movie
```

## Recommended Distribution

For the best experience on Linux, we recommend using the **AppImage** format because:
- No installation required
- No root privileges needed
- Self-contained with all dependencies
- Avoids package manager conflicts
- Easy to uninstall (just delete the file)

## Additional Resources

- [Code Signing Guide](CODE_SIGNING.md) - Information about package signing
- [GitHub Releases](https://github.com/hisham-pp/sky-movie/releases) - Download latest releases
- [Issue Tracker](https://github.com/hisham-pp/sky-movie/issues) - Report problems
