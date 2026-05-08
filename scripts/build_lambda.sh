#!/usr/bin/env bash
# Packages the FastAPI backend into a Lambda-compatible zip.
# Output: infra/dist/lambda.zip
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$REPO_ROOT/infra/dist"
SITE_PACKAGES="$BUILD_DIR/site-packages"
LAMBDA_ZIP="$BUILD_DIR/lambda.zip"

echo "Building Lambda package..."
rm -rf "$BUILD_DIR"
mkdir -p "$SITE_PACKAGES"

pip install \
  --quiet \
  --target "$SITE_PACKAGES" \
  -r "$REPO_ROOT/backend/requirements.txt"

cp -r "$REPO_ROOT/backend/app" "$SITE_PACKAGES/app"

cd "$SITE_PACKAGES"
zip -qr "$LAMBDA_ZIP" .

SIZE=$(du -sh "$LAMBDA_ZIP" | cut -f1)
echo "Done: $LAMBDA_ZIP ($SIZE)"
