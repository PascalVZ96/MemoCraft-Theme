#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
THEME_DIR="$ROOT_DIR/memocraft-theme"
DIST_DIR="$ROOT_DIR/dist"
OUTPUT="$DIST_DIR/memocraft-theme.wbt.gz"
LISTING="$DIST_DIR/package-files.txt"
SOURCE_CSS="$ROOT_DIR/src/memocraft.css"
TARGET_CSS="$THEME_DIR/unauthenticated/gray-theme.css"

fail() {
  echo "FOUT: $*" >&2
  exit 1
}

[[ -d "$THEME_DIR" ]] || fail "Map ontbreekt: $THEME_DIR"
[[ -f "$THEME_DIR/theme.info" ]] || fail "theme.info ontbreekt"
[[ -f "$SOURCE_CSS" ]] || fail "Bron-CSS ontbreekt: $SOURCE_CSS"
[[ -f "$TARGET_CSS" ]] || fail "Gray Theme CSS ontbreekt: $TARGET_CSS"
grep -q '^desc=' "$THEME_DIR/theme.info" || fail "theme.info bevat geen desc="

# Replace an earlier MemoCraft block instead of appending duplicates on every build.
python3 - "$TARGET_CSS" "$SOURCE_CSS" <<'PY'
from pathlib import Path
import sys

target = Path(sys.argv[1])
source = Path(sys.argv[2])
css = target.read_text(encoding="utf-8")

markers = (
    "/* MEMOCRAFT-CUSTOM-START",
    "/* MemoCraft Theme */",
)
positions = [css.find(marker) for marker in markers if css.find(marker) >= 0]
if positions:
    css = css[:min(positions)].rstrip() + "\n\n"
else:
    css = css.rstrip() + "\n\n"

custom = source.read_text(encoding="utf-8").strip() + "\n"
target.write_text(css + custom, encoding="utf-8")
PY

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

tar \
  --create \
  --gzip \
  --file "$OUTPUT" \
  --directory "$ROOT_DIR" \
  --owner=0 \
  --group=0 \
  --numeric-owner \
  memocraft-theme

gzip -t "$OUTPUT"
tar -tzf "$OUTPUT" > "$LISTING"

grep -Fxq 'memocraft-theme/theme.info' "$LISTING" \
  || fail "Pakket bevat theme.info niet op de juiste plaats"

if grep -Eq '(^|/)\.\.?(/|$)' "$LISTING"; then
  fail "Pakket bevat een ongeldig pad"
fi

echo "Gereed: $OUTPUT"
echo "Aantal bestanden: $(wc -l < "$LISTING")"
echo "Eerste 30 onderdelen:"
head -30 "$LISTING"
