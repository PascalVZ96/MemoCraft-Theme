#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
THEME_DIR="$ROOT_DIR/memocraft-theme"
DIST_DIR="$ROOT_DIR/dist"
OUTPUT="$DIST_DIR/memocraft-theme.wbt.gz"
LISTING="$DIST_DIR/package-files.txt"
SOURCE_CSS="$ROOT_DIR/src/memocraft.css"
SIDEBAR_CSS="$ROOT_DIR/src/sidebar.css"
DASHBOARD_CSS="$ROOT_DIR/src/dashboard-inline.css"
TARGET_CSS="$THEME_DIR/unauthenticated/gray-theme.css"
LEFT_CGI="$THEME_DIR/left.cgi"
RIGHT_CGI="$THEME_DIR/right.cgi"

fail() {
  echo "FOUT: $*" >&2
  exit 1
}

[[ -d "$THEME_DIR" ]] || fail "Map ontbreekt: $THEME_DIR"
[[ -f "$THEME_DIR/theme.info" ]] || fail "theme.info ontbreekt"
[[ -f "$SOURCE_CSS" ]] || fail "Bron-CSS ontbreekt: $SOURCE_CSS"
[[ -f "$SIDEBAR_CSS" ]] || fail "Zijbalk-CSS ontbreekt: $SIDEBAR_CSS"
[[ -f "$DASHBOARD_CSS" ]] || fail "Dashboard-CSS ontbreekt: $DASHBOARD_CSS"
[[ -f "$TARGET_CSS" ]] || fail "Gray Theme CSS ontbreekt: $TARGET_CSS"
[[ -f "$LEFT_CGI" ]] || fail "left.cgi ontbreekt: $LEFT_CGI"
[[ -f "$RIGHT_CGI" ]] || fail "right.cgi ontbreekt: $RIGHT_CGI"
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

# Inline the sidebar stylesheet in left.cgi.
python3 - "$LEFT_CGI" "$SIDEBAR_CSS" <<'PY'
from pathlib import Path
import re
import sys

left = Path(sys.argv[1])
source = Path(sys.argv[2])
text = left.read_text(encoding="utf-8")
css = source.read_text(encoding="utf-8").strip()

start = "<!-- MEMOCRAFT-SIDEBAR-STYLE-START -->"
end = "<!-- MEMOCRAFT-SIDEBAR-STYLE-END -->"
block = (
    "print <<'MEMOCRAFT_SIDEBAR_STYLE';\n"
    + start + "\n<style>\n"
    + css + "\n</style>\n"
    + end + "\nMEMOCRAFT_SIDEBAR_STYLE\n"
)

pattern = re.compile(
    r"print <<'MEMOCRAFT_SIDEBAR_STYLE';\n"
    + re.escape(start)
    + r".*?"
    + re.escape(end)
    + r"\nMEMOCRAFT_SIDEBAR_STYLE\n",
    re.S,
)

if pattern.search(text):
    text = pattern.sub(block, text, count=1)
else:
    needle = 'popup_header("Virtualmin");\n'
    if needle not in text:
        raise SystemExit("FOUT: popup_header in left.cgi niet gevonden")
    text = text.replace(needle, needle + block, 1)

left.write_text(text, encoding="utf-8")
PY

# Inline the dashboard stylesheet and MemoCraft heading in right.cgi.
python3 - "$RIGHT_CGI" "$DASHBOARD_CSS" <<'PY'
from pathlib import Path
import re
import sys

right = Path(sys.argv[1])
source = Path(sys.argv[2])
text = right.read_text(encoding="utf-8")
css = source.read_text(encoding="utf-8").strip()

start = "<!-- MEMOCRAFT-DASHBOARD-STYLE-START -->"
end = "<!-- MEMOCRAFT-DASHBOARD-STYLE-END -->"
block = (
    "print <<'MEMOCRAFT_DASHBOARD_STYLE';\n"
    + start + "\n<style>\n"
    + css + "\n</style>\n"
    + "<div class=\"memo-dashboard-head\">\n"
    + "  <div><h1 class=\"memo-dashboard-title\">MemoCraft Dashboard</h1>"
    + "<p class=\"memo-dashboard-subtitle\">Serverstatus en systeeminformatie</p></div>\n"
    + "  <div class=\"memo-dashboard-badge\">Webmin 2.653</div>\n"
    + "</div>\n"
    + end + "\nMEMOCRAFT_DASHBOARD_STYLE\n"
)

pattern = re.compile(
    r"print <<'MEMOCRAFT_DASHBOARD_STYLE';\n"
    + re.escape(start)
    + r".*?"
    + re.escape(end)
    + r"\nMEMOCRAFT_DASHBOARD_STYLE\n",
    re.S,
)

if pattern.search(text):
    text = pattern.sub(block, text, count=1)
else:
    needle = "&popup_header(undef, $prehead);\n"
    if needle not in text:
        raise SystemExit("FOUT: popup_header in right.cgi niet gevonden")
    text = text.replace(needle, needle + block, 1)

right.write_text(text, encoding="utf-8")
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
