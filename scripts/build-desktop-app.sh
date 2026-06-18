#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-current}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DESKTOP_APP="$REPO_ROOT/desktop-app"
DIST_PATH="$DESKTOP_APP/dist"

case "$TARGET" in
  current|windows|mac|linux|all) ;;
  *)
    echo "Usage: scripts/build-desktop-app.sh [current|windows|mac|linux|all]" >&2
    exit 2
    ;;
esac

package_script_for_target() {
  case "$TARGET" in
    current)
      case "$(uname -s)" in
        Darwin) echo "package:mac" ;;
        Linux) echo "package:linux" ;;
        MINGW*|MSYS*|CYGWIN*) echo "package:win" ;;
        *) echo "package:current" ;;
      esac
      ;;
    windows) echo "package:win" ;;
    mac) echo "package:mac" ;;
    linux) echo "package:linux" ;;
    all) echo "package:all" ;;
  esac
}

if [[ "$TARGET" == "all" && "$(uname -s)" != "Darwin" ]]; then
  echo "Note: macOS DMG/ZIP artifacts should be built on macOS for reliable packaging, signing, and notarization." >&2
fi

cd "$REPO_ROOT"
export CSC_IDENTITY_AUTO_DISCOVERY=false

echo "Sky Movie desktop app build"
echo "Repository: $REPO_ROOT"
echo "Target: $TARGET"

echo
echo "1/4 Installing workspace dependencies..."
pnpm install

echo
echo "2/4 Rebuilding native modules for Electron..."
pnpm --filter "@sky-movie/desktop-app" run rebuild:electron

echo
echo "3/4 Building desktop app bundles..."
pnpm --filter "@sky-movie/desktop-app" run build

echo
echo "4/4 Packaging desktop app..."
rm -rf "$DIST_PATH"
pnpm --filter "@sky-movie/desktop-app" run "$(package_script_for_target)"

echo
echo "Build complete."
echo "Output:"
echo "  $DIST_PATH"
