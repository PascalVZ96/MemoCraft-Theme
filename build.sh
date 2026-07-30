#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$ROOT_DIR/build"
SOURCE_DIR="$BUILD_DIR/webmin"
THEME_DIR="$BUILD_DIR/memocraft-theme"
OUTPUT_DIR="$ROOT_DIR/dist"

rm -rf "$BUILD_DIR" "$OUTPUT_DIR"
mkdir -p "$BUILD_DIR" "$OUTPUT_DIR"

# Build from the exact Webmin version used on Pascal's server.
git clone --depth 1 --branch 2.653 https://github.com/webmin/webmin.git "$SOURCE_DIR"
cp -a "$SOURCE_DIR/gray-theme" "$THEME_DIR"

# Keep all internal gray-theme references and filenames intact.
# Only the installation directory and visible metadata are changed.
cat > "$THEME_DIR/theme.info" <<'EOF'
desc=MemoCraft Theme
longdesc=A standalone MemoCraft variant of Webmin's Framed Theme
version=0.1.1
webmin=1
usermin=1
depends=2.000 1.860 2.653
EOF

# Add MemoCraft styling to the original stylesheet that the theme already loads.
printf '\n/* MemoCraft Theme custom styles */\n' >> "$THEME_DIR/unauthenticated/gray-theme.css"
cat "$ROOT_DIR/src/memocraft.css" >> "$THEME_DIR/unauthenticated/gray-theme.css"

# Preserve executable bits and package the theme directory at archive root.
tar -C "$BUILD_DIR" -czf "$OUTPUT_DIR/memocraft-theme.wbt.gz" memocraft-theme

echo "Built: $OUTPUT_DIR/memocraft-theme.wbt.gz"
