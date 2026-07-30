#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$ROOT_DIR/build"
SOURCE_DIR="$BUILD_DIR/webmin"
THEME_DIR="$BUILD_DIR/memocraft-theme"
OUTPUT_DIR="$ROOT_DIR/dist"

rm -rf "$BUILD_DIR" "$OUTPUT_DIR"
mkdir -p "$BUILD_DIR" "$OUTPUT_DIR"

git clone --depth 1 https://github.com/webmin/webmin.git "$SOURCE_DIR"
cp -a "$SOURCE_DIR/gray-theme" "$THEME_DIR"

# Rename internal references so this becomes an independent theme.
while IFS= read -r -d '' file; do
  if grep -Iq . "$file"; then
    sed -i 's/gray-theme/memocraft-theme/g' "$file"
  fi
done < <(find "$THEME_DIR" -type f -print0)

cat > "$THEME_DIR/theme.info" <<'EOF'
desc=MemoCraft Theme
longdesc=A standalone dark Webmin theme based on the official Framed Theme
version=0.1.0
webmin=1
usermin=0
depends=2.000
EOF

# Append our own styling while keeping the proven Framed Theme implementation.
cat "$ROOT_DIR/src/memocraft.css" >> "$THEME_DIR/unauthenticated/memocraft-theme.css"

# Webmin packages require the theme directory as the archive root.
tar -C "$BUILD_DIR" -czf "$OUTPUT_DIR/memocraft-theme.wbt.gz" memocraft-theme

echo "Built: $OUTPUT_DIR/memocraft-theme.wbt.gz"
