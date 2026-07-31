(function () {
  'use strict';

  var refreshBusy = false;
  var cpuHistory = [];
  var ramHistory = [];
  var historyLimit = 40;

  function injectStyles() {
    if (document.getElementById('memo-live-meter-styles')) return;
    var style = document.createElement('style');
    style.id = 'memo-live-meter-styles';
    style.textContent = [
      '.memo-stat-card{padding-bottom:58px!important;overflow:hidden!important;}',
      '.memo-meter{position:absolute;left:18px;right:18px;bottom:13px;height:6px;border-radius:999px;background:#0b1220;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(148,163,184,.12);z-index:2;}',
      '.memo-meter span{display:block;width:0;height:100%;border-radius:inherit;transition:width .4s ease;}',
      '.memo-meter-cpu span{background:linear-gradient(90deg,#38bdf8,#3b82f6);}',
      '.memo-meter-ram span{background:linear-gradient(90deg,#8b5cf6,#c084fc);}',
      '.memo-meter-disk span{background:linear-gradient(90deg,#22c55e,#2dd4bf);}',
      '.memo-sparkline{position:absolute;left:18px;right:18px;bottom:23px;height:28px;opacity:.88;pointer-events:none;}',
      '.memo-sparkline svg{display:block;width:100%;height:100%;overflow:visible;}',
      '.memo-sparkline path.memo-line{fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
      '.memo-sparkline path.memo-fill{stroke:none;opacity:.16;}',
      '.memo-sparkline-cpu path.memo-line{stroke:#38bdf8;}',
      '.memo-sparkline-cpu path.memo-fill{fill:#38bdf8;}',
      '.memo-sparkline-ram path.memo-line{stroke:#a78bfa;}',
      '.memo-sparkline-ram path.memo-fill{fill:#8b5cf6;}',
      '.memo-online-dot,.memo-live-dot{display:inline-block;width:8px;height:8px;margin-right:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.12),0 0 10px rgba(34,197,94,.65);vertical-align:middle;}',
      '.memo-live-dot{width:7px;height:7px;margin-right:6px;animation:memoPulse 1.4s ease-in-out infinite;}',
      '.memo-live-label{display:inline-flex;align-items:center;margin-left:10px;color:#86efac!important;font-size:11px;font-weight:700;}',
      '@keyframes memoPulse{0%,100%{opacity:.4}50%{opacity:1}}',
      '.memo-stat-card:nth-child(4){border-color:rgba(34,197,94,.28)!important;}',
      '.memo-stat-card:nth-child(4) .memo-stat-hint{color:#86efac!important;}',
      '@media(max-width:760px){.memo-stat-card{padding-bottom:54px!important}.memo-sparkline{left:16px;right:16px;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function clean(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
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

  function setText(id, value, fallback) {
    var node = document.getElementById(id);
    if (node) node.textContent = value || fallback || 'Onbekend';
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
      chart.innerHTML = '<svg viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true"><path class="memo-fill"></path><path class="memo-line"></path></svg>';
      card.appendChild(chart);
    }
    return chart;
  }

  function addHistory(history, value) {
    history.push(Math.max(0, Math.min(100, Number(value) || 0)));
    if (history.length > historyLimit) history.shift();
  }

  function renderSparkline(card, kind, history) {
    if (!history.length) return;
    var chart = ensureSparkline(card, kind);
    var width = 100;
    var height = 28;
    var step = history.length > 1 ? width / (history.length - 1) : width;
    var points = history.map(function (value, index) {
      var x = index * step;
      var y = height - (value / 100) * (height - 2) - 1;
      return [x, y];
    });
    var line = 'M ' + points.map(function (p) { return p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join(' L ');
    var fill = line + ' L ' + width + ' ' + height + ' L 0 ' + height + ' Z';
    chart.querySelector('.memo-line').setAttribute('d', line);
    chart.querySelector('.memo-fill').setAttribute('d', fill);
  }

  function updateMeters() {
    var cards = document.querySelectorAll('.memo-stat-card');
    if (cards.length < 4) return;
    var cpu = parseFloat(clean(document.getElementById('memo-cpu').textContent)) || 0;
    ensureMeter(cards[0], 'cpu').style.width = Math.max(0, Math.min(100, cpu)) + '%';
    var ramUsed = toBytes(document.getElementById('memo-ram').textContent);
    var ramTotal = toBytes(document.getElementById('memo-ram-total').textContent);
    ensureMeter(cards[1], 'ram').style.width = percent(ramUsed, ramTotal) + '%';
    var diskUsed = toBytes(document.getElementById('memo-disk').textContent);
    var diskTotal = toBytes(document.getElementById('memo-disk-total').textContent);
    ensureMeter(cards[2], 'disk').style.width = percent(diskUsed, diskTotal) + '%';
    var hint = cards[3].querySelector('.memo-stat-hint');
    if (hint && !hint.querySelector('.memo-online-dot')) hint.insertAdjacentHTML('afterbegin', '<span class="memo-online-dot"></span>');
    renderSparkline(cards[0], 'cpu', cpuHistory);
    renderSparkline(cards[1], 'ram', ramHistory);
  }

  function ensureLiveLabel() {
    var heading = document.querySelector('.memo-system-heading span');
    if (!heading || heading.querySelector('.memo-live-label')) return;
    heading.insertAdjacentHTML('beforeend', '<span class="memo-live-label"><span class="memo-live-dot"></span>Live · 2 sec</span>');
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
    fetch('/memocraft-theme/live-stats.cgi?_=' + Date.now(), {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        var cpu = Number(data.cpu_percent) || 0;
        var ramUsed = Number(data.ram_used_gib) || 0;
        var ramTotal = Number(data.ram_total_gib) || 0;
        setText('memo-cpu', cpu.toFixed(1).replace('.0', '') + '%');
        setText('memo-ram', ramUsed.toFixed(2) + ' GiB');
        setText('memo-ram-total', ramTotal.toFixed(2) + ' GiB totaal');
        addHistory(cpuHistory, cpu);
        addHistory(ramHistory, ramTotal ? (ramUsed / ramTotal) * 100 : 0);
        updateMeters();
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
