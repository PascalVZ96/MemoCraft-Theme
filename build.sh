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

for required in \
  "$THEME_DIR" \
  "$THEME_DIR/theme.info" \
  "$SOURCE_CSS" \
  "$SIDEBAR_CSS" \
  "$DASHBOARD_CSS" \
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

python3 - "$LEFT_CGI" "$SIDEBAR_CSS" <<'PY'
from pathlib import Path
import re
import sys

left = Path(sys.argv[1])
css = Path(sys.argv[2]).read_text(encoding="utf-8").strip()
text = left.read_text(encoding="utf-8")
text = text.replace("<strong>MemoCraft</strong>", "<strong>MemoNetwork</strong>")

start = "<!-- MEMOCRAFT-SIDEBAR-STYLE-START -->"
end = "<!-- MEMOCRAFT-SIDEBAR-STYLE-END -->"
block = (
    "print <<'MEMOCRAFT_SIDEBAR_STYLE';\n"
    + start + "\n<style>\n" + css + "\n</style>\n"
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

python3 - "$RIGHT_CGI" "$DASHBOARD_CSS" <<'PY'
from pathlib import Path
import re
import sys

right = Path(sys.argv[1])
css = Path(sys.argv[2]).read_text(encoding="utf-8").strip()
text = right.read_text(encoding="utf-8")

start = "<!-- MEMOCRAFT-DASHBOARD-STYLE-START -->"
end = "<!-- MEMOCRAFT-DASHBOARD-STYLE-END -->"
html = r'''<div class="memo-dashboard-head">
  <div><h1 class="memo-dashboard-title">MemoNetwork Dashboard</h1><p class="memo-dashboard-subtitle">Serverstatus en systeeminformatie</p></div>
  <div class="memo-dashboard-badge">Webmin 2.653</div>
</div>
<div class="memo-stat-grid" id="memo-stat-grid">
  <div class="memo-stat-card"><div class="memo-stat-top"><span class="memo-stat-icon">◫</span><span class="memo-stat-label">CPU</span></div><strong class="memo-stat-value" id="memo-cpu">--</strong><small class="memo-stat-hint">Actuele belasting</small></div>
  <div class="memo-stat-card"><div class="memo-stat-top"><span class="memo-stat-icon">◇</span><span class="memo-stat-label">Geheugen</span></div><strong class="memo-stat-value" id="memo-ram">--</strong><small class="memo-stat-hint" id="memo-ram-total">Totaal geheugen</small></div>
  <div class="memo-stat-card"><div class="memo-stat-top"><span class="memo-stat-icon">▰</span><span class="memo-stat-label">Opslag</span></div><strong class="memo-stat-value" id="memo-disk">--</strong><small class="memo-stat-hint" id="memo-disk-total">Totale opslag</small></div>
  <div class="memo-stat-card"><div class="memo-stat-top"><span class="memo-stat-icon">◷</span><span class="memo-stat-label">Uptime</span></div><strong class="memo-stat-value" id="memo-uptime">--</strong><small class="memo-stat-hint">Server online</small></div>
</div>
<div class="memo-system-panel" id="memo-system-panel">
  <div class="memo-system-heading"><h2>Systeemoverzicht</h2><span>Live uit Webmin</span></div>
  <div class="memo-info-grid">
    <div class="memo-info-card"><span class="memo-info-label">Hostnaam</span><strong class="memo-info-value" id="memo-hostname">--</strong></div>
    <div class="memo-info-card"><span class="memo-info-label">Besturingssysteem</span><strong class="memo-info-value" id="memo-os">--</strong></div>
    <div class="memo-info-card"><span class="memo-info-label">Processor</span><strong class="memo-info-value" id="memo-processor">--</strong></div>
    <div class="memo-info-card"><span class="memo-info-label">Kernel</span><strong class="memo-info-value" id="memo-kernel">--</strong></div>
    <div class="memo-info-card"><span class="memo-info-label">Temperatuur</span><strong class="memo-info-value" id="memo-temp">--</strong></div>
    <div class="memo-info-card"><span class="memo-info-label">Processen</span><strong class="memo-info-value" id="memo-processes">--</strong></div>
    <div class="memo-info-card"><span class="memo-info-label">Systeemtijd</span><strong class="memo-info-value" id="memo-time">--</strong></div>
    <div class="memo-info-card is-ok"><span class="memo-info-label">Pakketten</span><strong class="memo-info-value" id="memo-packages">--</strong></div>
  </div>
</div>
<script>
(function () {
  function clean(value) { return (value || '').replace(/\s+/g, ' ').trim(); }
  function findValue(labels) {
    var cells = Array.prototype.slice.call(document.querySelectorAll('td, th'));
    for (var i = 0; i < cells.length; i++) {
      var label = clean(cells[i].textContent).toLowerCase();
      if (labels.some(function (item) { return label === item || label.indexOf(item) === 0; })) {
        var row = cells[i].parentElement;
        if (!row) continue;
        var rowCells = Array.prototype.slice.call(row.querySelectorAll('td, th'));
        var index = rowCells.indexOf(cells[i]);
        if (index >= 0 && rowCells[index + 1]) return clean(rowCells[index + 1].textContent);
      }
    }
    return '';
  }
  function set(id, value, fallback) {
    var node = document.getElementById(id);
    if (node) node.textContent = value || fallback;
  }
  function firstAmount(value) {
    var match = clean(value).match(/[0-9.,]+\s*(?:GiB|MiB|TiB|GB|MB|TB)/i);
    return match ? match[0] : clean(value);
  }
  function totalAmount(value) {
    var matches = clean(value).match(/[0-9.,]+\s*(?:GiB|MiB|TiB|GB|MB|TB)/ig);
    return matches && matches.length ? matches[matches.length - 1] : '';
  }
  function hideOriginalSystem() {
    var summaries = Array.prototype.slice.call(document.querySelectorAll('summary'));
    for (var i = 0; i < summaries.length; i++) {
      var title = clean(summaries[i].textContent).toLowerCase();
      if (title.indexOf('system information') !== -1 || title.indexOf('systeeminformatie') !== -1) {
        var details = summaries[i].closest('details');
        if (details) details.classList.add('memo-original-system');
      }
    }
  }
  function updateDashboard() {
    var cpu = findValue(['cpu usage', 'cpu-gebruik']);
    var ram = findValue(['real memory', 'werkelijk geheugen']);
    var disk = findValue(['local disk space', 'lokale schijfruimte']);
    var uptime = findValue(['system uptime', 'systeem uptime']);
    var cpuPercent = cpu.match(/\d+%/);
    var uptimeDays = uptime.match(/\d+\s*(?:days?|dagen?)/i);

    set('memo-cpu', cpuPercent ? cpuPercent[0] : cpu, 'Onbekend');
    set('memo-ram', firstAmount(ram), 'Onbekend');
    set('memo-ram-total', totalAmount(ram) ? totalAmount(ram) + ' totaal' : 'Totaal geheugen');
    set('memo-disk', firstAmount(disk), 'Onbekend');
    set('memo-disk-total', totalAmount(disk) ? totalAmount(disk) + ' totaal' : 'Totale opslag');
    set('memo-uptime', uptimeDays ? uptimeDays[0].replace(/days?/i, 'dagen') : uptime, 'Onbekend');

    set('memo-hostname', findValue(['system hostname', 'systeemhostnaam']), 'Onbekend');
    set('memo-os', findValue(['operating system', 'besturingssysteem']), 'Onbekend');
    set('memo-processor', findValue(['processor information', 'processorinformatie']), 'Onbekend');
    set('memo-kernel', findValue(['kernel and cpu', 'kernel en cpu']), 'Onbekend');
    set('memo-temp', findValue(['drive temperatures', 'schijftemperaturen']), 'Onbekend');
    set('memo-processes', findValue(['running processes', 'actieve processen']), 'Onbekend');
    set('memo-time', findValue(['time on system', 'tijd op systeem']), 'Onbekend');
    set('memo-packages', findValue(['package updates', 'pakketupdates']), 'Onbekend');
    hideOriginalSystem();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateDashboard);
  } else {
    updateDashboard();
  }
})();
</script>'''

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
