(function () {
  'use strict';

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
    var unit = match[2].toUpperCase();
    var powers = { MIB: 2, GIB: 3, TIB: 4, MB: 2, GB: 3, TB: 4 };
    return value * Math.pow(1024, powers[unit] || 0);
  }

  function percent(used, total) {
    if (!total) return 0;
    return Math.max(0, Math.min(100, Math.round((used / total) * 100)));
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

  function ensureStatus(card) {
    var hint = card.querySelector('.memo-stat-hint');
    if (!hint || hint.querySelector('.memo-online-dot')) return;
    var dot = document.createElement('span');
    dot.className = 'memo-online-dot';
    hint.prepend(dot);
  }

  function updateMeters() {
    var cards = document.querySelectorAll('.memo-stat-card');
    if (cards.length < 4) return;

    var cpuText = clean(document.getElementById('memo-cpu') && document.getElementById('memo-cpu').textContent);
    var cpuMatch = cpuText.match(/([0-9]+)%/);
    var cpuValue = cpuMatch ? Number(cpuMatch[1]) : 0;
    ensureMeter(cards[0], 'cpu').style.width = cpuValue + '%';

    var ramUsed = toBytes(document.getElementById('memo-ram') && document.getElementById('memo-ram').textContent);
    var ramTotal = toBytes(document.getElementById('memo-ram-total') && document.getElementById('memo-ram-total').textContent);
    ensureMeter(cards[1], 'ram').style.width = percent(ramUsed, ramTotal) + '%';

    var diskUsed = toBytes(document.getElementById('memo-disk') && document.getElementById('memo-disk').textContent);
    var diskTotal = toBytes(document.getElementById('memo-disk-total') && document.getElementById('memo-disk-total').textContent);
    ensureMeter(cards[2], 'disk').style.width = percent(diskUsed, diskTotal) + '%';

    ensureStatus(cards[3]);
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
    if (!reboot || !hide || !alert || !actions || actions.contains(reboot)) return;

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

  function applyValues(root) {
    var cpu = findValue(root, ['cpu usage', 'cpu-gebruik']);
    var ram = findValue(root, ['real memory', 'werkelijk geheugen']);
    var disk = findValue(root, ['local disk space', 'lokale schijfruimte']);
    var uptime = findValue(root, ['system uptime', 'systeem uptime']);
    var cpuPercent = cpu.match(/\d+%/);
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
    updateMeters();
  }

  function refreshStats() {
    fetch(window.location.href, { credentials: 'same-origin', cache: 'no-store' })
      .then(function (response) { return response.text(); })
      .then(function (html) {
        var parsed = new DOMParser().parseFromString(html, 'text/html');
        applyValues(parsed);
      })
      .catch(function () {
        // Laat de laatst bekende waarden staan als verversen tijdelijk mislukt.
      });
  }

  function start() {
    applyValues(document);
    hideOriginalSystem();
    replaceRebootNotice();
    window.setTimeout(function () {
      applyValues(document);
      hideOriginalSystem();
      replaceRebootNotice();
    }, 150);
    window.setInterval(refreshStats, 15000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
