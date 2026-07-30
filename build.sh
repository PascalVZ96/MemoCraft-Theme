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
html = r'''<style>
.memo-reboot-alert {
  display: none;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  margin: 0 0 16px;
  padding: 18px 20px;
  border: 1px solid #7c4a12;
  border-left: 4px solid #f59e0b;
  border-radius: 14px;
  background: linear-gradient(135deg, #241a0d 0%, #171c25 70%);
  box-shadow: 0 12px 28px rgba(0,0,0,.22);
}
.memo-reboot-alert.is-visible { display: grid; }
.memo-reboot-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(245,158,11,.14);
  color: #fbbf24 !important;
  font-size: 22px;
}
.memo-reboot-copy h2 {
  margin: 0 0 5px;
  color: #fff7ed !important;
  font-size: 16px;
}
.memo-reboot-copy p {
  margin: 0;
  color: #fdba74 !important;
  font-size: 13px;
  line-height: 1.45;
}
.memo-reboot-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
.memo-reboot-actions input { margin: 0 !important; }
.memo-reboot-actions input[value="Reboot Now"] {
  background: #ea580c !important;
  border-color: #fb923c !important;
}
.memo-reboot-actions input[value="Hide Alert"] {
  background: #273449 !important;
  border-color: #475569 !important;
}
.memo-original-reboot { display: none !important; }
@media (max-width: 760px) {
  .memo-reboot-alert { grid-template-columns: 42px minmax(0,1fr); }
  .memo-reboot-actions { grid-column: 1 / -1; padding-left: 58px; }
}
</style>
<div class="memo-dashboard-head">
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
<div class="memo-reboot-alert" id="memo-reboot-alert">
  <div class="memo-reboot-icon">!</div>
  <div class="memo-reboot-copy"><h2>Herstart vereist</h2><p>Er zijn systeemupdates geïnstalleerd. Herstart de server om alle wijzigingen volledig toe te passen.</p></div>
  <div class="memo-reboot-actions" id="memo-reboot-actions"></div>
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
    summaries.forEach(function (summary) {
      var title = clean(summary.textContent).toLowerCase();
      if (title.indexOf('system information') !== -1 || title.indexOf('systeeminformatie') !== -1) {
        var details = summary.closest('details');
        if (details) details.classList.add('memo-original-system');
      }
    });
  }
  function replaceRebootNotice() {
    var reboot = document.querySelector('input[value="Reboot Now"]');
    var hide = document.querySelector('input[value="Hide Alert"]');
    var alert = document.getElementById('memo-reboot-alert');
    var actions = document.getElementById('memo-reboot-actions');
    if (!reboot || !hide || !alert || !actions) return;

    var source = reboot.closest('table') || reboot.closest('form') || reboot.parentElement;
    var original = source;
    while (original && original.parentElement && original.parentElement !== document.body) {
      original = original.parentElement;
    }

    actions.appendChild(reboot);
    actions.appendChild(hide);
    alert.classList.add('is-visible');
    if (original && original !== alert) original.classList.add('memo-original-reboot');
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
    replaceRebootNotice();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updateDashboard);
  else updateDashboard();
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
