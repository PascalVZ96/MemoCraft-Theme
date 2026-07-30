#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
THEME_DIR="$ROOT_DIR/memocraft-theme"
DIST_DIR="$ROOT_DIR/dist"
OUTPUT="$DIST_DIR/memocraft-theme.wbt.gz"

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
tar -tzf "$OUTPUT" | grep -qx 'memocraft-theme/theme.info' \
  || fail "Pakket bevat theme.info niet op de juiste plaats"

if tar -tzf "$OUTPUT" | grep -qE '(^|/)\.\.?(/|$)'; then
  fail "Pakket bevat een ongeldig pad"
fi

echo "Gereed: $OUTPUT"
echo "Inhoud:"
tar -tzf "$OUTPUT"
