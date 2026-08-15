#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCHIVE="$ROOT_DIR/dist/memocraft-theme.wbt.gz"

fail(){ echo "FOUT: $*" >&2; exit 1; }
[[ -f "$ARCHIVE" ]] || fail "Build ontbreekt: $ARCHIVE"
gzip -t "$ARCHIVE"

TMP_LIST="$(mktemp)"
TMP_DIR="$(mktemp -d)"
trap 'rm -f "$TMP_LIST"; rm -rf "$TMP_DIR"' EXIT

tar -tzf "$ARCHIVE" > "$TMP_LIST"

required=(
  memocraft-theme/theme.info
  memocraft-theme/left.cgi
  memocraft-theme/right.cgi
  memo-network/module.info
  memo-network/live-stats.cgi
  memo-network/activity.cgi
  memo-network/reliability.cgi
  memo-network/intelligence.cgi
  memo-network/readiness.cgi
  memo-network/control-center-healthscore.js
  memo-network/control-center-intelligence.js
  memo-network/control-center-readiness.js
)

for file in "${required[@]}"; do
  grep -Fxq "$file" "$TMP_LIST" || fail "RC-pakket mist: $file"
done

# Extract only the files whose contents need validation. This avoids SIGPIPE
# from `tar -xOf | grep -q` while `set -o pipefail` is active.
tar -xzf "$ARCHIVE" -C "$TMP_DIR" -- \
  memocraft-theme/left.cgi \
  memo-network/readiness.cgi

grep -Fq '5.0.0-rc1' "$TMP_DIR/memocraft-theme/left.cgi" || fail "Sidebar bevat niet versie 5.0.0-rc1"
grep -Fq "version => '5.0.0-rc1'" "$TMP_DIR/memo-network/readiness.cgi" || fail "Readiness backend bevat niet versie 5.0.0-rc1"
grep -Fq 'ready_for_stable' "$TMP_DIR/memo-network/readiness.cgi" || fail "Stable readiness-check ontbreekt"

echo "RC1 package check: OK"
echo "Bestanden gecontroleerd: ${#required[@]}"
echo "Archive: $ARCHIVE"
