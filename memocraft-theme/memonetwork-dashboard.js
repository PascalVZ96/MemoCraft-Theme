(function () {
  'use strict';

  function clean(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
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

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node && value) node.textContent = value;
  }

  function refreshStats() {
    fetch(window.location.href, { credentials: 'same-origin', cache: 'no-store' })
      .then(function (response) { return response.text(); })
      .then(function (html) {
        var parsed = new DOMParser().parseFromString(html, 'text/html');
        var cpu = findValue(parsed, ['cpu usage', 'cpu-gebruik']);
        var ram = findValue(parsed, ['real memory', 'werkelijk geheugen']);
        var disk = findValue(parsed, ['local disk space', 'lokale schijfruimte']);
        var uptime = findValue(parsed, ['system uptime', 'systeem uptime']);
        var cpuPercent = cpu.match(/\d+%/);
        var uptimeDays = uptime.match(/\d+\s*(?:days?|dagen?)/i);

        if (cpuPercent) setText('memo-cpu', cpuPercent[0]);
        if (ram) {
          setText('memo-ram', firstAmount(ram));
          setText('memo-ram-total', totalAmount(ram) + ' totaal');
        }
        if (disk) {
          setText('memo-disk', firstAmount(disk));
          setText('memo-disk-total', totalAmount(disk) + ' totaal');
        }
        if (uptimeDays) setText('memo-uptime', uptimeDays[0].replace(/days?/i, 'dagen'));
        updateMeters();
      })
      .catch(function () {
        // Laat de laatst bekende waarden staan als een refresh tijdelijk mislukt.
      });
  }

  function start() {
    updateMeters();
    window.setTimeout(updateMeters, 150);
    window.setInterval(refreshStats, 15000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
