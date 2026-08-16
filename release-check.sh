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
  memocraft-theme/memo-dashboard.cgi
  memo-network/module.info
  memo-network/live-stats.cgi
  memo-network/activity.cgi
  memo-network/reliability.cgi
  memo-network/intelligence.cgi
  memo-network/readiness.cgi
  memo-network/language.cgi
  memo-network/legacy-dashboard.cgi
  memo-network/control-center-healthscore.js
  memo-network/control-center-intelligence.js
  memo-network/control-center-readiness.js
)

for file in "${required[@]}"; do
  grep -Fxq "$file" "$TMP_LIST" || fail "Stable-pakket mist: $file"
done

tar -xzf "$ARCHIVE" -C "$TMP_DIR" -- \
  memocraft-theme/left.cgi \
  memocraft-theme/right.cgi \
  memo-network/readiness.cgi \
  memo-network/language.cgi \
  memo-network/legacy-dashboard.cgi

grep -Fq '5.0.3' "$TMP_DIR/memocraft-theme/left.cgi" || fail "Sidebar bevat niet versie 5.0.3"
grep -Fq 'const dashboardUrl = "/memo-network/control-center.html";' "$TMP_DIR/memocraft-theme/left.cgi" || fail "Control Center is niet ingesteld als standaard startpagina"
grep -Fq 'stabilizeControlCenterChrome' "$TMP_DIR/memocraft-theme/left.cgi" || fail "Vaste Control Center navigatie ontbreekt"
grep -Fq 'memoStableLabelObserver' "$TMP_DIR/memocraft-theme/left.cgi" || fail "Stable cleanup voor Alpha-labels ontbreekt"
grep -Fq 'languageUrl = "/memo-network/language.cgi"' "$TMP_DIR/memocraft-theme/left.cgi" || fail "Webmin-taalsynchronisatie ontbreekt"
grep -Fq 'Status: 302 Found' "$TMP_DIR/memocraft-theme/right.cgi" || fail "right.cgi bevat geen server-side redirect"
grep -Fq 'Location: /memo-network/control-center.html' "$TMP_DIR/memocraft-theme/right.cgi" || fail "right.cgi opent niet direct het Control Center"
grep -Fq "version => '5.0.3'" "$TMP_DIR/memo-network/readiness.cgi" || fail "Readiness backend bevat niet versie 5.0.3"
grep -Fq "release_stage => 'stable'" "$TMP_DIR/memo-network/readiness.cgi" || fail "Readiness backend staat niet op stable"
grep -Fq 'stable_verified' "$TMP_DIR/memo-network/readiness.cgi" || fail "Stable-verificatie ontbreekt"
grep -Fq "my \$language = \$webmin_language || \$hint || 'en';" "$TMP_DIR/memo-network/language.cgi" || fail "WebminCore is niet leidend voor de taalkeuze"
grep -Fq "my \$source = '/usr/share/webmin/memocraft-theme/memo-dashboard.cgi';" "$TMP_DIR/memo-network/legacy-dashboard.cgi" || fail "Legacy-dashboard leest niet uit de bewaarde v4-bron"
grep -Fq '/memo-network/live-stats.cgi' "$TMP_DIR/memo-network/legacy-dashboard.cgi" || fail "Legacy-dashboard gebruikt niet de actuele live-stats API"
if grep -Fq "exec '/usr/bin/perl'" "$TMP_DIR/memo-network/legacy-dashboard.cgi"; then
  fail "Legacy-dashboard gebruikt nog de onveilige exec-wrapper"
fi

echo "v5.0.3 stable package check: OK"
echo "Direct Control Center + stable labels + taalfix + veilige legacy-route gecontroleerd"
echo "Bestanden gecontroleerd: ${#required[@]}"
echo "Archive: $ARCHIVE"
