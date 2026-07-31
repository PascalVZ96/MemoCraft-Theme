(function () {
  'use strict';

  var busy = false;
  var limit = 36;
  var histories = { cpu: [], ram: [], rx: [], tx: [], read: [], write: [], load: [] };

  function clean(value) { return (value || '').replace(/\s+/g, ' ').trim(); }
  function setText(id, value) { var n = document.getElementById(id); if (n) n.textContent = value; }
  function add(history, value) { history.push(Math.max(0, Number(value) || 0)); if (history.length > limit) history.shift(); }
  function rate(value) { value = Number(value) || 0; return value >= 1024 ? (value / 1024).toFixed(value >= 10240 ? 0 : 1) + ' MiB/s' : value.toFixed(value >= 100 ? 0 : 1) + ' KiB/s'; }

  function findValue(root, labels) {
    var cells = Array.prototype.slice.call(root.querySelectorAll('td,th'));
    for (var i = 0; i < cells.length; i++) {
      var label = clean(cells[i].textContent).toLowerCase();
      if (!labels.some(function (item) { return label === item || label.indexOf(item) === 0; })) continue;
      var row = cells[i].parentElement;
      var rowCells = row ? Array.prototype.slice.call(row.querySelectorAll('td,th')) : [];
      var index = rowCells.indexOf(cells[i]);
      if (index >= 0 && rowCells[index + 1]) return clean(rowCells[index + 1].textContent);
    }
    return '';
  }

  function firstAmount(value) {
    var match = clean(value).match(/[0-9.,]+\s*(?:GiB|MiB|TiB|GB|MB|TB)/i);
    return match ? match[0] : clean(value);
  }

  function totalAmount(value) {
    var matches = clean(value).match(/[0-9.,]+\s*(?:GiB|MiB|TiB|GB|MB|TB)/ig);
    return matches && matches.length ? matches[matches.length - 1] : '';
  }

  function injectStyles() {
    if (document.getElementById('memo-dashboard-v2-css')) return;
    var style = document.createElement('style');
    style.id = 'memo-dashboard-v2-css';
    style.textContent = [
      '.memo-v2-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:0 0 16px!important}',
      '.memo-v2-card{position:relative;min-height:150px;padding:17px 18px;border:1px solid #2c3d56;border-radius:14px;background:linear-gradient(145deg,#17243a,#101927);overflow:hidden;box-shadow:0 10px 24px rgba(0,0,0,.14)}',
      '.memo-v2-card.wide{grid-column:span 2}.memo-v2-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px}.memo-v2-title{font-size:13px;font-weight:800;color:#f4f8ff}.memo-v2-live{font-size:10px;font-weight:700;color:#86efac}',
      '.memo-v2-values{display:grid;grid-template-columns:1fr 1fr;gap:12px;position:relative;z-index:2}.memo-v2-value span{display:block;margin-bottom:4px;color:#8297b2;font-size:10px;text-transform:uppercase;letter-spacing:.06em}.memo-v2-value strong{display:block;color:#fff;font-size:22px}',
      '.memo-v2-load{font-size:32px!important}.memo-v2-sub{display:flex;gap:12px;color:#90a5bf;font-size:11px;position:relative;z-index:2}',
      '.memo-v2-chart{position:absolute;left:18px;right:18px;bottom:12px;height:52px;opacity:.9}.memo-v2-chart svg{width:100%;height:100%;display:block;overflow:visible}.memo-v2-line{fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
      '.memo-rx{stroke:#38bdf8}.memo-tx{stroke:#a78bfa}.memo-read{stroke:#2dd4bf}.memo-write{stroke:#f59e0b}.memo-load{stroke:#fb7185}',
      '.memo-services{display:grid;grid-template-columns:1fr 1fr;gap:10px}.memo-service{display:flex;align-items:center;justify-content:space-between;padding:10px 11px;border:1px solid #2b3a50;border-radius:10px;background:#111b2a;color:#dbe7f6;font-size:12px}.memo-status{display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:800;text-transform:uppercase}.memo-status:before{content:"";width:7px;height:7px;border-radius:50%;background:#64748b}.memo-status.ok{color:#86efac}.memo-status.ok:before{background:#22c55e;box-shadow:0 0 9px rgba(34,197,94,.7)}.memo-status.off{color:#fca5a5}.memo-status.off:before{background:#ef4444}',
      '.memo-stat-card{overflow:hidden!important}.memo-mini{position:absolute;left:18px;right:18px;bottom:17px;height:30px;opacity:.8}.memo-mini svg{width:100%;height:100%}.memo-mini .memo-v2-line{stroke-width:2}',
      '@media(max-width:1200px){.memo-v2-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.memo-v2-card.wide{grid-column:span 1}}',
      '@media(max-width:700px){.memo-v2-grid{grid-template-columns:1fr}.memo-v2-card.wide{grid-column:auto}.memo-v2-values{grid-template-columns:1fr 1fr}}'
    ].join('');
    document.head.appendChild(style);
  }

  function ensureDashboardV2() {
    if (document.getElementById('memo-dashboard-v2')) return;
    var statGrid = document.getElementById('memo-stat-grid');
    if (!statGrid) return;
    var wrapper = document.createElement('div');
    wrapper.id = 'memo-dashboard-v2';
    wrapper.className = 'memo-v2-grid';
    wrapper.innerHTML = '' +
      '<section class="memo-v2-card wide"><div class="memo-v2-head"><span class="memo-v2-title">Netwerkverkeer</span><span class="memo-v2-live">LIVE · 2 SEC</span></div><div class="memo-v2-values"><div class="memo-v2-value"><span>Download</span><strong id="memo-network-rx">0 KiB/s</strong></div><div class="memo-v2-value"><span>Upload</span><strong id="memo-network-tx">0 KiB/s</strong></div></div><div class="memo-v2-chart" id="memo-network-chart"></div></section>' +
      '<section class="memo-v2-card"><div class="memo-v2-head"><span class="memo-v2-title">Load average</span><span class="memo-v2-live">LIVE</span></div><strong class="memo-v2-load" id="memo-load-1">0.00</strong><div class="memo-v2-sub"><span id="memo-load-5">5 min: 0.00</span><span id="memo-load-15">15 min: 0.00</span></div><div class="memo-v2-chart" id="memo-load-chart"></div></section>' +
      '<section class="memo-v2-card"><div class="memo-v2-head"><span class="memo-v2-title">Disk I/O</span><span class="memo-v2-live">LIVE</span></div><div class="memo-v2-values"><div class="memo-v2-value"><span>Lezen</span><strong id="memo-disk-read">0 KiB/s</strong></div><div class="memo-v2-value"><span>Schrijven</span><strong id="memo-disk-write">0 KiB/s</strong></div></div><div class="memo-v2-chart" id="memo-disk-chart"></div></section>' +
      '<section class="memo-v2-card wide"><div class="memo-v2-head"><span class="memo-v2-title">Services</span><span class="memo-v2-live">STATUS</span></div><div class="memo-services"><div class="memo-service"><span>Docker</span><span class="memo-status" id="memo-service-docker">Controleren</span></div><div class="memo-service"><span>AMP</span><span class="memo-status" id="memo-service-amp">Controleren</span></div><div class="memo-service"><span>MinIO</span><span class="memo-status" id="memo-service-minio">Controleren</span></div><div class="memo-service"><span>WireGuard</span><span class="memo-status" id="memo-service-wireguard">Controleren</span></div></div></section>';
    statGrid.insertAdjacentElement('afterend', wrapper);
  }

  function path(history, max, height) {
    if (!history.length) return '';
    max = max || Math.max.apply(null, history.concat([1]));
    var step = history.length > 1 ? 100 / (history.length - 1) : 100;
    return 'M ' + history.map(function (value, index) {
      var x = index * step;
      var y = height - Math.min(1, value / max) * (height - 2) - 1;
      return x.toFixed(2) + ' ' + y.toFixed(2);
    }).join(' L ');
  }

  function chart(id, series) {
    var node = document.getElementById(id);
    if (!node) return;
    var max = Math.max.apply(null, series.reduce(function (all, item) { return all.concat(item.history); }, [1]));
    node.innerHTML = '<svg viewBox="0 0 100 52" preserveAspectRatio="none">' + series.map(function (item) { return '<path class="memo-v2-line ' + item.className + '" d="' + path(item.history, max, 52) + '"></path>'; }).join('') + '</svg>';
  }

  function mini(cardIndex, key, className) {
    var cards = document.querySelectorAll('.memo-stat-card');
    var card = cards[cardIndex];
    if (!card) return;
    var node = card.querySelector('.memo-mini');
    if (!node) { node = document.createElement('div'); node.className = 'memo-mini'; card.appendChild(node); }
    node.innerHTML = '<svg viewBox="0 0 100 30" preserveAspectRatio="none"><path class="memo-v2-line ' + className + '" d="' + path(histories[key], 100, 30) + '"></path></svg>';
  }

  function service(name, running) {
    var node = document.getElementById('memo-service-' + name);
    if (!node) return;
    node.textContent = running ? 'Online' : 'Offline';
    node.className = 'memo-status ' + (running ? 'ok' : 'off');
  }

  function applyInitial() {
    var cpu = findValue(document, ['cpu usage', 'cpu-gebruik']);
    var ram = findValue(document, ['real memory', 'werkelijk geheugen']);
    var disk = findValue(document, ['local disk space', 'lokale schijfruimte']);
    var uptime = findValue(document, ['system uptime', 'systeem uptime']);
    var cpuMatch = cpu.match(/\d+(?:[.,]\d+)?%/);
    var uptimeMatch = uptime.match(/\d+\s*(?:days?|dagen?)/i);
    if (cpuMatch) setText('memo-cpu', cpuMatch[0]);
    if (ram) { setText('memo-ram', firstAmount(ram)); setText('memo-ram-total', totalAmount(ram) + ' totaal'); }
    if (disk) { setText('memo-disk', firstAmount(disk)); setText('memo-disk-total', totalAmount(disk) + ' totaal'); }
    if (uptimeMatch) setText('memo-uptime', uptimeMatch[0].replace(/days?/i, 'dagen'));
    setText('memo-hostname', findValue(document, ['system hostname', 'systeemhostnaam']) || '--');
    setText('memo-os', findValue(document, ['operating system', 'besturingssysteem']) || '--');
    setText('memo-processor', findValue(document, ['processor information', 'processorinformatie']) || '--');
    setText('memo-kernel', findValue(document, ['kernel and cpu', 'kernel en cpu']) || '--');
    setText('memo-temp', findValue(document, ['drive temperatures', 'schijftemperaturen']) || '--');
    setText('memo-processes', findValue(document, ['running processes', 'actieve processen']) || '--');
    setText('memo-time', findValue(document, ['time on system', 'tijd op systeem']) || '--');
    setText('memo-packages', findValue(document, ['package updates', 'pakketupdates']) || '--');
  }

  function refresh() {
    if (busy || document.hidden) return;
    busy = true;
    fetch('/memocraft-theme/live-stats.cgi?_=' + Date.now(), { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        var cpu = Number(data.cpu_percent) || 0;
        var used = Number(data.ram_used_gib) || 0;
        var total = Number(data.ram_total_gib) || 0;
        setText('memo-cpu', cpu.toFixed(1).replace('.0', '') + '%');
        setText('memo-ram', used.toFixed(2) + ' GiB');
        setText('memo-ram-total', total.toFixed(2) + ' GiB totaal');
        setText('memo-network-rx', rate(data.network_rx_kib_s));
        setText('memo-network-tx', rate(data.network_tx_kib_s));
        setText('memo-disk-read', rate(data.disk_read_kib_s));
        setText('memo-disk-write', rate(data.disk_write_kib_s));
        setText('memo-load-1', Number(data.load_1 || 0).toFixed(2));
        setText('memo-load-5', '5 min: ' + Number(data.load_5 || 0).toFixed(2));
        setText('memo-load-15', '15 min: ' + Number(data.load_15 || 0).toFixed(2));
        add(histories.cpu, cpu); add(histories.ram, total ? used / total * 100 : 0); add(histories.rx, data.network_rx_kib_s); add(histories.tx, data.network_tx_kib_s); add(histories.read, data.disk_read_kib_s); add(histories.write, data.disk_write_kib_s); add(histories.load, data.load_1);
        mini(0, 'cpu', 'memo-rx'); mini(1, 'ram', 'memo-tx');
        chart('memo-network-chart', [{ history: histories.rx, className: 'memo-rx' }, { history: histories.tx, className: 'memo-tx' }]);
        chart('memo-disk-chart', [{ history: histories.read, className: 'memo-read' }, { history: histories.write, className: 'memo-write' }]);
        chart('memo-load-chart', [{ history: histories.load, className: 'memo-load' }]);
        var services = data.services || {};
        service('docker', !!services.docker); service('amp', !!services.amp); service('minio', !!services.minio); service('wireguard', !!services.wireguard);
      })
      .catch(function () {})
      .then(function () { busy = false; });
  }

  function replaceReboot() {
    var reboot = document.querySelector('input[value="Reboot Now"]');
    var hide = document.querySelector('input[value="Hide Alert"]');
    var alert = document.getElementById('memo-reboot-alert');
    var actions = document.getElementById('memo-reboot-actions');
    if (!reboot || !hide || !alert || !actions || actions.contains(reboot)) return;
    var original = reboot.closest('table') || reboot.closest('form') || reboot.parentElement;
    actions.appendChild(reboot); actions.appendChild(hide); alert.classList.add('is-visible');
    if (original && original !== alert) original.classList.add('memo-original-reboot');
  }

  function start() {
    injectStyles();
    ensureDashboardV2();
    applyInitial();
    replaceReboot();
    refresh();
    window.setInterval(refresh, 2000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
