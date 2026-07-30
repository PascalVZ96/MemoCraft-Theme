#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
THEME_DIR="$ROOT_DIR/memocraft-theme"
DIST_DIR="$ROOT_DIR/dist"
OUTPUT="$DIST_DIR/memocraft-theme.wbt.gz"
LISTING="$DIST_DIR/package-files.txt"
SOURCE_CSS="$ROOT_DIR/src/memocraft.css"
SIDEBAR_CSS="$ROOT_DIR/src/sidebar.css"
SIDEBAR_EXTRA_CSS="$ROOT_DIR/src/sidebar-31.css"
SIDEBAR_PHASE_CSS="$ROOT_DIR/src/sidebar-32.css"
SIDEBAR_JS="$ROOT_DIR/src/sidebar-active.js"
DASHBOARD_CSS="$ROOT_DIR/src/dashboard-inline.css"
DASHBOARD_EXTRA_CSS="$ROOT_DIR/src/dashboard-cards-20.css"
DASHBOARD_HTML="$ROOT_DIR/src/dashboard-inline.html"
TARGET_CSS="$THEME_DIR/unauthenticated/gray-theme.css"
LEFT_CGI="$THEME_DIR/left.cgi"
RIGHT_CGI="$THEME_DIR/right.cgi"

fail() {
  echo "FOUT: $*" >&2
  exit 1
}

for required in \
  "$THEME_DIR" \
  "$THEME_DIR/theme.info" \
  "$SOURCE_CSS" \
  "$SIDEBAR_CSS" \
  "$SIDEBAR_EXTRA_CSS" \
  "$SIDEBAR_PHASE_CSS" \
  "$SIDEBAR_JS" \
  "$DASHBOARD_CSS" \
  "$DASHBOARD_EXTRA_CSS" \
  "$DASHBOARD_HTML" \
  "$TARGET_CSS" \
  "$LEFT_CGI" \
  "$RIGHT_CGI"; do
  [[ -e "$required" ]] || fail "Ontbreekt: $required"
done

grep -q '^desc=' "$THEME_DIR/theme.info" || fail "theme.info bevat geen desc="

python3 - "$TARGET_CSS" "$SOURCE_CSS" <<'PY'
from pathlib import Path
import sys

target = Path(sys.argv[1])
source = Path(sys.argv[2])
css = target.read_text(encoding="utf-8")
markers = ("/* MEMOCRAFT-CUSTOM-START", "/* MemoCraft Theme */")
positions = [css.find(marker) for marker in markers if css.find(marker) >= 0]
css = css[:min(positions)].rstrip() + "\n\n" if positions else css.rstrip() + "\n\n"
target.write_text(css + source.read_text(encoding="utf-8").strip() + "\n", encoding="utf-8")
PY

python3 - "$LEFT_CGI" "$SIDEBAR_CSS" "$SIDEBAR_EXTRA_CSS" "$SIDEBAR_PHASE_CSS" "$SIDEBAR_JS" <<'PY'
from pathlib import Path
import re
import sys

left = Path(sys.argv[1])
css = "\n\n".join(
    Path(path).read_text(encoding="utf-8").strip()
    for path in sys.argv[2:5]
)
js = Path(sys.argv[5]).read_text(encoding="utf-8").strip()
text = left.read_text(encoding="utf-8")
text = text.replace("<strong>MemoCraft</strong>", "<strong>MemoNetwork</strong>")

start = "<!-- MEMOCRAFT-SIDEBAR-STYLE-START -->"
end = "<!-- MEMOCRAFT-SIDEBAR-STYLE-END -->"
block = (
    "print <<'MEMOCRAFT_SIDEBAR_STYLE';\n"
    + start + "\n<style>\n" + css + "\n</style>\n"
    + "<script>\n" + js + "\n</script>\n"
    + end + "\nMEMOCRAFT_SIDEBAR_STYLE\n"
)
pattern = re.compile(
    r"print <<'MEMOCRAFT_SIDEBAR_STYLE';\n" + re.escape(start)
    + r".*?" + re.escape(end) + r"\nMEMOCRAFT_SIDEBAR_STYLE\n",
    re.S,
)
if pattern.search(text):
    text = pattern.sub(lambda _m: block, text, count=1)
else:
    needle = 'popup_header("Virtualmin");\n'
    if needle not in text:
        raise SystemExit("FOUT: popup_header in left.cgi niet gevonden")
    text = text.replace(needle, needle + block, 1)
left.write_text(text, encoding="utf-8")
PY

python3 - "$RIGHT_CGI" "$DASHBOARD_CSS" "$DASHBOARD_EXTRA_CSS" "$DASHBOARD_HTML" <<'PY'
from pathlib import Path
import re
import sys

right = Path(sys.argv[1])
css = "\n\n".join(
    Path(path).read_text(encoding="utf-8").strip()
    for path in sys.argv[2:4]
)
html = Path(sys.argv[4]).read_text(encoding="utf-8").strip()
text = right.read_text(encoding="utf-8")

start = "<!-- MEMOCRAFT-DASHBOARD-STYLE-START -->"
end = "<!-- MEMOCRAFT-DASHBOARD-STYLE-END -->"
block = (
    "print <<'MEMOCRAFT_DASHBOARD_STYLE';\n"
    + start + "\n<style>\n" + css + "\n</style>\n"
    + html + "\n" + end + "\nMEMOCRAFT_DASHBOARD_STYLE\n"
)
pattern = re.compile(
    r"print <<'MEMOCRAFT_DASHBOARD_STYLE';\n" + re.escape(start)
    + r".*?" + re.escape(end) + r"\nMEMOCRAFT_DASHBOARD_STYLE\n",
    re.S,
)
if pattern.search(text):
    text = pattern.sub(lambda _m: block, text, count=1)
else:
    needle = "&popup_header(undef, $prehead);\n"
    if needle not in text:
        raise SystemExit("FOUT: popup_header in right.cgi niet gevonden")
    text = text.replace(needle, needle + block, 1)
right.write_text(text, encoding="utf-8")
PY

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

tar --create --gzip --file "$OUTPUT" --directory "$ROOT_DIR" \
  --owner=0 --group=0 --numeric-owner memocraft-theme

gzip -t "$OUTPUT"
tar -tzf "$OUTPUT" > "$LISTING"
grep -Fxq 'memocraft-theme/theme.info' "$LISTING" || fail "Pakket mist theme.info"

if grep -Eq '(^|/)\.\.?(/|$)' "$LISTING"; then
  fail "Pakket bevat een ongeldig pad"
fi

echo "Gereed: $OUTPUT"
echo "Aantal bestanden: $(wc -l < "$LISTING")"
echo "Eerste 30 onderdelen:"
head -30 "$LISTING"
