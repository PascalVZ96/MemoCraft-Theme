#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
THEME_DIR="$ROOT_DIR/memocraft-theme"
API_DIR="$ROOT_DIR/memo-network"
DIST_DIR="$ROOT_DIR/dist"
OUTPUT="$DIST_DIR/memocraft-theme.wbt.gz"
LISTING="$DIST_DIR/package-files.txt"

SOURCE_CSS="$ROOT_DIR/src/memocraft.css"
FORMS_TABLES_CSS="$ROOT_DIR/src/forms-tables-20.css"
CORE_UI_CSS="$ROOT_DIR/src/core-ui-50.css"
LOGIN_CSS="$ROOT_DIR/src/login.css"
LOGIN_JS="$ROOT_DIR/src/login-marker.js"
SIDEBAR_CSS="$ROOT_DIR/src/sidebar.css"
SIDEBAR_EXTRA_CSS="$ROOT_DIR/src/sidebar-31.css"
SIDEBAR_PHASE_CSS="$ROOT_DIR/src/sidebar-32.css"
SIDEBAR_JS="$ROOT_DIR/src/sidebar-active.js"

TARGET_CSS="$THEME_DIR/unauthenticated/gray-theme.css"
THEME_PL="$THEME_DIR/theme.pl"
LEFT_CGI="$THEME_DIR/left.cgi"
RIGHT_CGI="$THEME_DIR/right.cgi"
LIVE_STATS_CGI="$THEME_DIR/live-stats.cgi"
MEMO_DASHBOARD_CGI="$THEME_DIR/memo-dashboard.cgi"
API_STATS_CGI="$API_DIR/live-stats.cgi"
API_SYSTEM_CGI="$API_DIR/system-info.cgi"
API_PROCESSES_CGI="$API_DIR/processes.cgi"

fail() {
  echo "FOUT: $*" >&2
  exit 1
}

for required in \
  "$THEME_DIR/theme.info" \
  "$API_DIR/module.info" \
  "$API_STATS_CGI" \
  "$API_SYSTEM_CGI" \
  "$API_PROCESSES_CGI" \
  "$SOURCE_CSS" \
  "$FORMS_TABLES_CSS" \
  "$CORE_UI_CSS" \
  "$LOGIN_CSS" \
  "$LOGIN_JS" \
  "$SIDEBAR_CSS" \
  "$SIDEBAR_EXTRA_CSS" \
  "$SIDEBAR_PHASE_CSS" \
  "$SIDEBAR_JS" \
  "$TARGET_CSS" \
  "$THEME_PL" \
  "$LEFT_CGI" \
  "$LIVE_STATS_CGI" \
  "$MEMO_DASHBOARD_CGI"; do
  [[ -e "$required" ]] || fail "Ontbreekt: $required"
done

grep -q '^desc=' "$THEME_DIR/theme.info" || fail "theme.info bevat geen desc="
grep -q '^name=' "$API_DIR/module.info" || fail "memo-network/module.info bevat geen name="

python3 - "$TARGET_CSS" "$SOURCE_CSS" "$FORMS_TABLES_CSS" "$CORE_UI_CSS" <<'PY'
from pathlib import Path
import sys

target = Path(sys.argv[1])
sources = [Path(path) for path in sys.argv[2:]]
css = target.read_text(encoding="utf-8")
markers = ("/* MEMOCRAFT-CUSTOM-START", "/* MemoCraft Theme */")
positions = [css.find(marker) for marker in markers if css.find(marker) >= 0]
css = css[:min(positions)].rstrip() + "\n\n" if positions else css.rstrip() + "\n\n"
custom = "\n\n".join(source.read_text(encoding="utf-8").strip() for source in sources)
target.write_text(css + custom + "\n", encoding="utf-8")
PY

python3 - "$THEME_DIR/unauthenticated" "$LOGIN_CSS" <<'PY'
from pathlib import Path
import sys

folder = Path(sys.argv[1])
login_css = Path(sys.argv[2]).read_text(encoding="utf-8").strip()
start = "/* MEMONETWORK-LOGIN-START */"
end = "/* MEMONETWORK-LOGIN-END */"
block = f"{start}\n{login_css}\n{end}\n"
files = sorted(folder.rglob("*.css"))
if not files:
    raise SystemExit("FOUT: geen unauthenticated CSS-bestanden gevonden")
for target in files:
    text = target.read_text(encoding="utf-8")
    if start in text:
        text = text.split(start, 1)[0].rstrip() + "\n\n"
    target.write_text(text + block, encoding="utf-8")
print(f"Loginstijl toegevoegd aan {len(files)} unauthenticated stylesheets")
PY

python3 - "$THEME_PL" "$LOGIN_JS" <<'PY'
from pathlib import Path
import re
import sys

theme = Path(sys.argv[1])
js = Path(sys.argv[2]).read_text(encoding="utf-8").strip()
text = theme.read_text(encoding="utf-8")
start = "# MEMONETWORK-LOGIN-MARKER-START"
end = "# MEMONETWORK-LOGIN-MARKER-END"
block = (
    f"\t{start}\n"
    "\tprint <<'MEMONETWORK_LOGIN_MARKER';\n"
    "<script>\n" + js + "\n</script>\n"
    "MEMONETWORK_LOGIN_MARKER\n"
    f"\t{end}\n"
)
text = re.sub(r"\t# MEMONETWORK-LOGIN-MARKER-START.*?\t# MEMONETWORK-LOGIN-MARKER-END\n", "", text, flags=re.S)
needle = "if ($script_name =~ /session_login.cgi/) {\n"
if needle not in text:
    raise SystemExit("FOUT: loginblok in theme.pl niet gevonden")
text = text.replace(needle, needle + block, 1)
theme.write_text(text, encoding="utf-8")
PY

python3 - "$LEFT_CGI" "$SIDEBAR_CSS" "$SIDEBAR_EXTRA_CSS" "$SIDEBAR_PHASE_CSS" "$SIDEBAR_JS" <<'PY'
from pathlib import Path
import re
import sys

left = Path(sys.argv[1])
css = "\n\n".join(Path(path).read_text(encoding="utf-8").strip() for path in sys.argv[2:5])
js = Path(sys.argv[5]).read_text(encoding="utf-8").strip()
text = left.read_text(encoding="utf-8")
text = text.replace("<strong>MemoCraft</strong>", "<strong>MemoNetwork</strong>")
text = text.replace("'link' => '/memocraft-theme/memo-dashboard.cgi'", "'link' => '/right.cgi'")
text = text.replace("href='/memocraft-theme/memo-dashboard.cgi' target='right'", "href='/right.cgi' target='right'")

old_brand = '''print "<div class='memo-brand'>\\n";
print "<div class='memo-brand-icon'>M</div>\\n";
print "<div class='memo-brand-copy'>\\n";
print "<strong>MemoNetwork</strong>\\n";
print "<span>Server Management</span>\\n";
print "</div>\\n";
print "</div>\\n";'''
new_brand = '''print "<a class='memo-brand' href='/right.cgi' target='right' title='Terug naar dashboard' aria-label='Terug naar dashboard' style='text-decoration:none;color:inherit'>\\n";
print "<div class='memo-brand-icon'>M</div>\\n";
print "<div class='memo-brand-copy'>\\n";
print "<strong>MemoNetwork</strong>\\n";
print "<span>Server Management</span>\\n";
print "</div>\\n";
print "</a>\\n";'''
if old_brand in text:
    text = text.replace(old_brand, new_brand, 1)
elif "class='memo-brand'" not in text:
    raise SystemExit("FOUT: MemoNetwork-logoblok in left.cgi niet gevonden")

start = "<!-- MEMOCRAFT-SIDEBAR-STYLE-START -->"
end = "<!-- MEMOCRAFT-SIDEBAR-STYLE-END -->"
block = (
    "print <<'MEMOCRAFT_SIDEBAR_STYLE';\n" + start + "\n<style>\n" + css + "\n</style>\n"
    + "<script>\n" + js + "\n</script>\n" + end + "\nMEMOCRAFT_SIDEBAR_STYLE\n"
)
pattern = re.compile(r"print <<'MEMOCRAFT_SIDEBAR_STYLE';\n" + re.escape(start) + r".*?" + re.escape(end) + r"\nMEMOCRAFT_SIDEBAR_STYLE\n", re.S)
if pattern.search(text):
    text = pattern.sub(lambda _m: block, text, count=1)
else:
    needle = 'popup_header("Virtualmin");\n'
    if needle not in text:
        raise SystemExit("FOUT: popup_header in left.cgi niet gevonden")
    text = text.replace(needle, needle + block, 1)
left.write_text(text, encoding="utf-8")
PY

cp "$MEMO_DASHBOARD_CGI" "$RIGHT_CGI"

python3 - "$RIGHT_CGI" <<'PY'
from pathlib import Path
import sys

right = Path(sys.argv[1])
text = right.read_text(encoding="utf-8")
text = text.replace("/system-status/index.cgi", "/memo-network/system-info.cgi")
text = text.replace("/sysinfo/index.cgi", "/memo-network/system-info.cgi")
text = text.replace("/proc/index.cgi", "/memo-network/processes.cgi")
text = text.replace(' target="_top"', '')
text = text.replace("fetch('/right.cgi?memo_stats=1&_='+Date.now()", "fetch('/memo-network/live-stats.cgi?_='+Date.now()")
text = text.replace("fetch((window.location.pathname || '/right.cgi')+'?memo_stats=1&_='+Date.now()", "fetch('/memo-network/live-stats.cgi?_='+Date.now()")

required = (
    "MemoNetwork Dashboard v3",
    "/memo-network/live-stats.cgi",
    "/memo-network/system-info.cgi",
    "/memo-network/processes.cgi",
    "docker-running",
    "docker-total",
    "amp-running",
    "amp-total",
)
missing = [item for item in required if item not in text]
if missing:
    raise SystemExit("FOUT: Dashboard v3 mist: " + ", ".join(missing))
right.write_text(text, encoding="utf-8")
PY

chmod 755 "$LEFT_CGI" "$RIGHT_CGI" "$LIVE_STATS_CGI" "$MEMO_DASHBOARD_CGI" "$API_STATS_CGI" "$API_SYSTEM_CGI" "$API_PROCESSES_CGI"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"
tar --create --gzip --file="$OUTPUT" --directory="$ROOT_DIR" --owner=0 --group=0 --numeric-owner memocraft-theme memo-network
gzip -t "$OUTPUT"
tar -tzf "$OUTPUT" > "$LISTING"

grep -Fxq 'memocraft-theme/theme.info' "$LISTING" || fail "Pakket mist theme.info"
grep -Fxq 'memocraft-theme/right.cgi' "$LISTING" || fail "Pakket mist right.cgi"
grep -Fxq 'memo-network/module.info' "$LISTING" || fail "Pakket mist memo-network/module.info"
grep -Fxq 'memo-network/live-stats.cgi' "$LISTING" || fail "Pakket mist memo-network/live-stats.cgi"
grep -Fxq 'memo-network/system-info.cgi' "$LISTING" || fail "Pakket mist memo-network/system-info.cgi"
grep -Fxq 'memo-network/processes.cgi' "$LISTING" || fail "Pakket mist memo-network/processes.cgi"
grep -q '/memo-network/system-info.cgi' "$RIGHT_CGI" || fail "right.cgi gebruikt niet de veilige systeeminformatiepagina"
grep -q '/memo-network/processes.cgi' "$RIGHT_CGI" || fail "right.cgi gebruikt niet de veilige processenpagina"

if grep -Eq '(^|/)\.\.?(/|$)' "$LISTING"; then
  fail "Pakket bevat een ongeldig pad"
fi

echo "Gereed: $OUTPUT"
echo "Dashboard v3 gebruikt veilige MemoNetwork beheerpagina's"
echo "Aantal bestanden: $(wc -l < "$LISTING")"
