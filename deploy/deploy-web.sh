#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_WORKSPACE="@webexplorer/web"
DIST_DIR="$ROOT_DIR/packages/web/dist"
DEFAULT_TARGET="/var/www/www.webexplorer.app"
TARGET="${DEPLOY_TARGET:-${1:-$DEFAULT_TARGET}}"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required to build $WEB_WORKSPACE" >&2
  exit 1
fi

pushd "$ROOT_DIR" >/dev/null
if [ ! -d node_modules ]; then
  echo "Installing workspace dependencies..."
  npm install
fi

echo "Building $WEB_WORKSPACE..."
npm run build --workspace "$WEB_WORKSPACE"
popd >/dev/null

if [ ! -d "$DIST_DIR" ]; then
  echo "Build output not found at $DIST_DIR" >&2
  exit 1
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required to transfer build artifacts" >&2
  exit 1
fi

if [ ! -d "$TARGET" ]; then
  echo "Creating target directory $TARGET"
  mkdir -p "$TARGET"
fi

echo "Syncing artifacts to $TARGET"
rsync -av --delete "$DIST_DIR/" "$TARGET/"

echo "Deployment complete. Point Nginx's root to $TARGET to serve https://www.webexplorer.app/."
