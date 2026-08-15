#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCHIVE="$ROOT_DIR/dist/memocraft-theme.wbt.gz"

fail(){ echo "FOUT: $*" >&2; exit 1; }
[[ -f "$ARCHIVE" ]] || fail "Build ontbreekt: $ARCHIVE"
gzip -t "$ARCHIVE"

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
tar -tzf "$ARCHIVE" > "$TMP"

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
  grep -Fxq "$file" "$TMP" || fail "RC-pakket mist: $file"
done

tar -xOf "$ARCHIVE" memocraft-theme/left.cgi | grep -Fq '5.0.0-rc1' || fail "Sidebar bevat niet versie 5.0.0-rc1"
tar -xOf "$ARCHIVE" memo-network/readiness.cgi | grep -Fq "version => '5.0.0-rc1'" || fail "Readiness backend bevat niet versie 5.0.0-rc1"
tar -xOf "$ARCHIVE" memo-network/readiness.cgi | grep -Fq 'ready_for_stable' || fail "Stable readiness-check ontbreekt"

echo "RC1 package check: OK"
echo "Bestanden gecontroleerd: ${#required[@]}"
echo "Archive: $ARCHIVE"
