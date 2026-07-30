#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
THEME_DIR="$ROOT_DIR/memocraft-theme"
DIST_DIR="$ROOT_DIR/dist"
OUTPUT="$DIST_DIR/memocraft-theme.wbt.gz"
LISTING="$DIST_DIR/package-files.txt"

fail() {
  echo "FOUT: $*" >&2
  exit 1
}

[[ -d "$THEME_DIR" ]] || fail "Map ontbreekt: $THEME_DIR"
[[ -f "$THEME_DIR/theme.info" ]] || fail "theme.info ontbreekt"
grep -q '^desc=' "$THEME_DIR/theme.info" || fail "theme.info bevat geen desc="

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
