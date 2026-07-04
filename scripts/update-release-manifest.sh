#!/usr/bin/env bash
#
# update-release-manifest.sh
#
# CI replacement for `node scripts/release-github.mjs --skip-sha --no-commit`,
# written in bash + curl + jq so the release job needs no Node/pnpm install.
# The .mjs script remains the tool for local use (SHA hashing, env files, commit).
#
# Usage:
#   GITHUB_TOKEN=... GITHUB_REPOSITORY=owner/repo scripts/update-release-manifest.sh [tag]
#
# With no tag argument, the latest GitHub release is used.
# Writes website/public/releases.json; committing is left to the caller.

set -euo pipefail

REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY (owner/repo) is required}"
TOKEN="${GITHUB_TOKEN:?GITHUB_TOKEN is required}"
TAG="${1:-}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="$ROOT/website/public/releases.json"

if [ -n "$TAG" ]; then
  API_URL="https://api.github.com/repos/$REPO/releases/tags/$TAG"
else
  API_URL="https://api.github.com/repos/$REPO/releases/latest"
fi

echo "Fetching GitHub release: $API_URL"
RELEASE_JSON="$(curl -fsSL \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "$API_URL")"

NOW="$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"

NEXT_RELEASE="$(jq -e '
  def classify:
    . as $name
    | (if test("arm64|aarch64"; "i") then "arm64"
       elif test("ia32"; "i") or (test("x86"; "i") and (test("x64"; "i") | not)) then "ia32"
       else "x64" end) as $arch
    | (if endswith(".exe") then {platform: "windows", arch: $arch, kind: "installer"}
       elif endswith(".dmg") then {platform: "macos", arch: $arch, kind: "dmg"}
       elif endswith(".zip") then {platform: "macos", arch: $arch, kind: "zip"}
       elif endswith(".AppImage") then {platform: "linux", arch: $arch, kind: "appimage"}
       elif endswith(".deb") then {platform: "linux", arch: $arch, kind: "deb"}
       elif endswith(".tar.gz") then {platform: "linux", arch: $arch, kind: "tar.gz"}
       else {platform: "unknown", arch: $arch, kind: "file"} end);

  . as $r
  | ($r.tag_name | sub("^v"; "")) as $version
  | (($r.body // "")
     | split("\r?\n"; "")
     | map(gsub("^\\s+|\\s+$"; ""))
     | map(select(length > 0 and (startswith("#") | not) and (startswith("Release") | not)))
    ) as $changes
  | [$r.assets[]
     | select(.name | (endswith(".exe") or endswith(".dmg") or endswith(".zip")
                       or endswith(".AppImage") or endswith(".deb") or endswith(".tar.gz")))
     | (.name | classify) + {
         fileName: .name,
         size: .size,
         sha256: null,
         downloadUrl: .browser_download_url,
         webViewUrl: $r.html_url
       }
    ] as $artifacts
  | if ($artifacts | length) == 0 then error("No valid release artifacts found in GitHub release.") else . end
  | {
      version: $version,
      releasedAt: $r.published_at,
      storageProvider: "github-releases",
      storageFolderUrl: $r.html_url,
      sourceCommit: { sha: $r.target_commitish, message: ("Release " + $version) },
      notes: ("Sky Movie " + $version),
      changes: (if ($changes | length) > 0 then $changes else ["Sky Movie " + $version] end),
      artifacts: $artifacts
    }
' <<<"$RELEASE_JSON")"

VERSION="$(jq -r '.version' <<<"$NEXT_RELEASE")"
echo "Found release: v$VERSION ($(jq -r '.artifacts | length' <<<"$NEXT_RELEASE") artifacts)"

if [ -f "$MANIFEST" ]; then
  EXISTING="$(cat "$MANIFEST")"
else
  EXISTING='{"releases":[]}'
fi

jq --argjson next "$NEXT_RELEASE" --arg now "$NOW" '
  .latestVersion = $next.version
  | .updatedAt = $now
  | .releases = (([$next] + ((.releases // []) | map(select(.version != $next.version)))) | .[:20])
' <<<"$EXISTING" >"$MANIFEST.tmp"
mv "$MANIFEST.tmp" "$MANIFEST"

echo "Updated website release manifest: $MANIFEST"
