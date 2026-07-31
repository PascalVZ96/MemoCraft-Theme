(function () {
  'use strict';

  var refreshBusy = false;
  var historyLimit = 40;
  var cpuHistory = [];
  var ramHistory = [];
  var rxHistory = [];
  var txHistory = [];
  var loadHistory = [];

  function clean(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  function setText(id, value, fallback) {
    var node = document.getElementById(id);
    if (node) node.textContent = value || fallback || 'Onbekend';
  }

  function findValue(root, labels) {
    var cells = Array.prototype.slice.call(root.querySelectorAll('td, th'));
    for (var i = 0; i < cells.length; i++) {
      var label = clean(cells[i].textContent).toLowerCase();
      if (!labels.some(function (item) { return label === item || label.indexOf(item) === 0; })) continue;
      var row = cells[i].parentElement;
      if (!row) continue;
      var rowCells = Array.prototype.slice.call(row.querySelectorAll('td, th'));
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

  function toBytes(amount) {
    var match = clean(amount).match(/([0-9.,]+)\s*(MiB|GiB|TiB|MB|GB|TB)/i);
    if (!match) return 0;
    var value = parseFloat(match[1].replace(',', '.')) || 0;
    var powers = { MIB: 2, GIB: 3, TIB: 4, MB: 2, GB: 3, TB: 4 };
    return value * Math.pow(1024, powers[match[2].toUpperCase()] || 0);
  }

  function percent(used, total) {
    return total ? Math.max(0, Math.min(100, Math.round((used / total) * 100))) : 0;
  }

  function addHistory(history, value) {
    history.push(Math.max(0, Number(value) || 0));
    if (history.length > historyLimit) history.shift();
  }

  function formatRate(kib) {
    var value = Number(kib) || 0;
    if (value >= 1024) return (value / 1024).toFixed(value >= 10240 ? 0 : 1) + ' MiB/s';
    return value.toFixed(value >= 100 ? 0 : 1) + ' KiB/s';
  }

  function injectStyles() {
    if (document.getElementById('memo-live-meter-styles')) return;
    var style = document.createElement('style');
    style.id = 'memo-live-meter-styles';
    style.textContent = [
      '.memo-stat-card{padding-bottom:58px!important;overflow:hidden!important;}',
      '.memo-meter{position:absolute;left:18px;right:18px;bottom:13px;height:6px;border-radius:999px;background:#0b1220;overflow:hidden;z-index:2;}',
      '.memo-meter span{display:block;width:0;height:100%;border-radius:inherit;transition:width .4s ease;}',
      '.memo-meter-cpu span{background:linear-gradient(90deg,#38bdf8,#3b82f6);}',
      '.memo-meter-ram span{background:linear-gradient(90deg,#8b5cf6,#c084fc);}',
      '.memo-meter-disk span{background:linear-gradient(90deg,#22c55e,#2dd4bf);}',
      '.memo-sparkline{position:absolute;left:18px;right:18px;bottom:23px;height:28px;opacity:.88;pointer-events:none;}',
      '.memo-sparkline svg,.memo-wide-chart svg{display:block;width:100%;height:100%;overflow:visible;}',
      '.memo-line{fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
      '.memo-fill{stroke:none;opacity:.14;}',
      '.memo-sparkline-cpu .memo-line{stroke:#38bdf8}.memo-sparkline-cpu .memo-fill{fill:#38bdf8}',
      '.memo-sparkline-ram .memo-line{stroke:#a78bfa}.memo-sparkline-ram .memo-fill{fill:#8b5cf6}',
      '.memo-live-grid{display:grid;grid-template-columns:2fr 1fr;gap:14px;margin:0 0 14px;}',
      '.memo-live-card{position:relative;min-height:138px;padding:16px 18px;border:1px solid #2b3b52;border-radius:14px;background:linear-gradient(145deg,#162235,#111a27);overflow:hidden;}',
      '.memo-live-card-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;color:#eef5ff;font-weight:800;}',
      '.memo-live-card-head small{color:#7f93ac;font-size:11px;font-weight:600;}',
      '.memo-network-values{display:grid;grid-template-columns:1fr 1fr;gap:16px;position:relative;z-index:2;}',
      '.memo-network-values span{display:block;color:#89a0bc;font-size:11px;margin-bottom:4px;}',
      '.memo-network-values strong{font-size:23px;color:#f8fbff;}',
      '.memo-load-main{display:block;font-size:32px;color:#f8fbff;position:relative;z-index:2;}',
      '.memo-load-secondary{display:flex;gap:12px;color:#8fa5c0;font-size:12px;position:relative;z-index:2;}',
      '.memo-wide-chart{position:absolute;left:18px;right:18px;bottom:12px;height:48px;opacity:.9;}',
      '.memo-network-rx{stroke:#38bdf8}.memo-network-tx{stroke:#a78bfa}.memo-load-line{stroke:#f59e0b}',
      '.memo-online-dot,.memo-live-dot{display:inline-block;width:8px;height:8px;margin-right:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.12),0 0 10px rgba(34,197,94,.65);vertical-align:middle;}',
      '.memo-live-dot{width:7px;height:7px;margin-right:6px;animation:memoPulse 1.4s ease-in-out infinite;}',
      '.memo-live-label{display:inline-flex;align-items:center;margin-left:10px;color:#86efac!important;font-size:11px;font-weight:700;}',
      '@keyframes memoPulse{0%,100%{opacity:.4}50%{opacity:1}}',
      '@media(max-width:900px){.memo-live-grid{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(style);
  }

  function svgPath(history, maxValue, width, height) {
    if (!history.length) return '';
    var max = maxValue || Math.max.apply(null, history.concat([1]));
    var step = history.length > 1 ? width / (history.length - 1) : width;
    return 'M ' + history.map(function (value, index) {
      var x = index * step;
      var y = height - Math.min(1, value / max) * (height - 2) - 1;
      return x.toFixed(2) + ' ' + y.toFixed(2);
    }).join(' L ');
  }

  function renderMiniChart(container, paths) {
    if (!container) return;
    var html = '<svg viewBox="0 0 100 48" preserveAspectRatio="none" aria-hidden="true">';
    paths.forEach(function (item) {
      html += '<path class="memo-line ' + item.className + '" d="' + svgPath(item.history, item.max, 100, 48) + '"></path>';
    });
    html += '</svg>';
    container.innerHTML = html;
  }

  function ensureMeter(card, kind) {
    var meter = card.querySelector('.memo-meter');
    if (!meter) {
      meter = document.createElement('div');
      meter.className = 'memo-meter memo-meter-' + kind;
      meter.innerHTML = '<span></span>';
      card.appendChild(meter);
    }
    return meter.querySelector('span');
  }

  function ensureSparkline(card, kind) {
    var chart = card.querySelector('.memo-sparkline-' + kind);
    if (!chart) {
      chart = document.createElement('div');
      chart.className = 'memo-sparkline memo-sparkline-' + kind;
      chart.innerHTML = '<svg viewBox="0 0 100 28" preserveAspectRatio="none"><path class="memo-fill"></path><path class="memo-line"></path></svg>';
      card.appendChild(chart);
    }
    return chart;
  }

  function renderSparkline(card, kind, history) {
    if (!history.length) return;
    var chart = ensureSparkline(card, kind);
    var line = svgPath(history, 100, 100, 28);
    chart.querySelector('.memo-line').setAttribute('d', line);
    chart.querySelector('.memo-fill').setAttribute('d', line + ' L 100 28 L 0 28 Z');
  }

  function updateMeters() {
    var cards = document.querySelectorAll('.memo-stat-card');
    if (cards.length < 4) return;
    var cpu = parseFloat(clean(document.getElementById('memo-cpu').textContent)) || 0;
    var ramUsed = toBytes(document.getElementById('memo-ram').textContent);
    var ramTotal = toBytes(document.getElementById('memo-ram-total').textContent);
    var diskUsed = toBytes(document.getElementById('memo-disk').textContent);
    var diskTotal = toBytes(document.getElementById('memo-disk-total').textContent);
    ensureMeter(cards[0], 'cpu').style.width = Math.min(100, cpu) + '%';
    ensureMeter(cards[1], 'ram').style.width = percent(ramUsed, ramTotal) + '%';
    ensureMeter(cards[2], 'disk').style.width = percent(diskUsed, diskTotal) + '%';
    var hint = cards[3].querySelector('.memo-stat-hint');
    if (hint && !hint.querySelector('.memo-online-dot')) hint.insertAdjacentHTML('afterbegin', '<span class="memo-online-dot"></span>');
    renderSparkline(cards[0], 'cpu', cpuHistory);
    renderSparkline(cards[1], 'ram', ramHistory);
  }

  function ensureLiveLabel() {
    var heading = document.querySelector('.memo-system-heading span');
    if (heading && !heading.querySelector('.memo-live-label')) {
      heading.insertAdjacentHTML('beforeend', '<span class="memo-live-label"><span class="memo-live-dot"></span>Live · 2 sec</span>');
    }
  }

  function applyInitialValues(root) {
    var cpu = findValue(root, ['cpu usage', 'cpu-gebruik']);
    var ram = findValue(root, ['real memory', 'werkelijk geheugen']);
    var disk = findValue(root, ['local disk space', 'lokale schijfruimte']);
    var uptime = findValue(root, ['system uptime', 'systeem uptime']);
    var cpuPercent = cpu.match(/\d+(?:[.,]\d+)?%/);
    var uptimeDays = uptime.match(/\d+\s*(?:days?|dagen?)/i);
    setText('memo-cpu', cpuPercent ? cpuPercent[0] : cpu);
    setText('memo-ram', firstAmount(ram));
    setText('memo-ram-total', totalAmount(ram) ? totalAmount(ram) + ' totaal' : 'Totaal geheugen');
    setText('memo-disk', firstAmount(disk));
    setText('memo-disk-total', totalAmount(disk) ? totalAmount(disk) + ' totaal' : 'Totale opslag');
    setText('memo-uptime', uptimeDays ? uptimeDays[0].replace(/days?/i, 'dagen') : uptime);
    setText('memo-hostname', findValue(root, ['system hostname', 'systeemhostnaam']));
    setText('memo-os', findValue(root, ['operating system', 'besturingssysteem']));
    setText('memo-processor', findValue(root, ['processor information', 'processorinformatie']));
    setText('memo-kernel', findValue(root, ['kernel and cpu', 'kernel en cpu']));
    setText('memo-temp', findValue(root, ['drive temperatures', 'schijftemperaturen']));
    setText('memo-processes', findValue(root, ['running processes', 'actieve processen']));
    setText('memo-time', findValue(root, ['time on system', 'tijd op systeem']));
    setText('memo-packages', findValue(root, ['package updates', 'pakketupdates']));
    addHistory(cpuHistory, parseFloat(cpuPercent ? cpuPercent[0] : cpu));
    addHistory(ramHistory, percent(toBytes(firstAmount(ram)), toBytes(totalAmount(ram))));
    updateMeters();
  }

  function refreshLiveStats() {
    if (refreshBusy || document.hidden) return;
    refreshBusy = true;
    fetch('/memocraft-theme/live-stats.cgi?_=' + Date.now(), { credentials: 'same-origin', cache: 'no-store', headers: { 'Accept': 'application/json' } })
      .then(function (response) { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); })
      .then(function (data) {
        var cpu = Number(data.cpu_percent) || 0;
        var ramUsed = Number(data.ram_used_gib) || 0;
        var ramTotal = Number(data.ram_total_gib) || 0;
        var rx = Number(data.network_rx_kib_s) || 0;
        var tx = Number(data.network_tx_kib_s) || 0;
        var load1 = Number(data.load_1) || 0;
        setText('memo-cpu', cpu.toFixed(1).replace('.0', '') + '%');
        setText('memo-ram', ramUsed.toFixed(2) + ' GiB');
        setText('memo-ram-total', ramTotal.toFixed(2) + ' GiB totaal');
        setText('memo-network-rx', formatRate(rx));
        setText('memo-network-tx', formatRate(tx));
        setText('memo-load-1', load1.toFixed(2));
        setText('memo-load-5', '5 min: ' + Number(data.load_5 || 0).toFixed(2));
        setText('memo-load-15', '15 min: ' + Number(data.load_15 || 0).toFixed(2));
        addHistory(cpuHistory, cpu);
        addHistory(ramHistory, ramTotal ? (ramUsed / ramTotal) * 100 : 0);
        addHistory(rxHistory, rx);
        addHistory(txHistory, tx);
        addHistory(loadHistory, load1);
        updateMeters();
        var networkMax = Math.max.apply(null, rxHistory.concat(txHistory).concat([1]));
        renderMiniChart(document.getElementById('memo-network-chart'), [
          { history: rxHistory, max: networkMax, className: 'memo-network-rx' },
          { history: txHistory, max: networkMax, className: 'memo-network-tx' }
        ]);
        renderMiniChart(document.getElementById('memo-load-chart'), [
          { history: loadHistory, max: Math.max.apply(null, loadHistory.concat([1])), className: 'memo-load-line' }
        ]);
      })
      .catch(function () {})
      .then(function () { refreshBusy = false; });
  }

  function hideOriginalSystem() {
    Array.prototype.slice.call(document.querySelectorAll('summary')).forEach(function (summary) {
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
    if (!reboot || !hide || !alert || !actions || actions.contains(reboot)) return;
    var original = reboot.closest('table') || reboot.closest('form') || reboot.parentElement;
    actions.appendChild(reboot);
    actions.appendChild(hide);
    alert.classList.add('is-visible');
    if (original && original !== alert) original.classList.add('memo-original-reboot');
  }

  function start() {
    injectStyles();
    ensureLiveLabel();
    applyInitialValues(document);
    hideOriginalSystem();
    replaceRebootNotice();
    refreshLiveStats();
    window.setInterval(refreshLiveStats, 2000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
