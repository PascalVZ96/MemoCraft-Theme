(() => {
  if (window.MemoNetworkV5Diagnostics) return;

  const view = document.getElementById('diagnostics');
  if (!view) return;

  const cookie = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
  const lang = cookie ? cookie[1].toLowerCase() : (document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
  const dict = {
    nl: {
      eyebrow:'Live diagnostiek', title:'Diagnostiek', subtitle:'Processen, netwerk, systemd en systeemmeldingen op één plek', refresh:'Vernieuwen', refreshing:'Vernieuwen…', lastUpdate:'Laatste update', boot:'Server gestart', bootSub:'Laatste boot', systemd:'Systemd', failed:'mislukt', noFailed:'Geen mislukte units', attention:'Aandacht vereist', network:'Netwerk', active:'actief', interfacesDetected:'interfaces gedetecteerd', load:'Load average', networkInterfaces:'Netwerkinterfaces', interface:'Interface', status:'Status', ipv4:'IPv4', speed:'Snelheid', received:'Ontvangen', sent:'Verzonden', failedUnits:'Mislukte systemd-units', sessions:'Aangemelde sessies', noSessions:'Geen interactieve sessies gevonden', listeningPorts:'Luisterende netwerkpoorten', protocol:'Protocol', localAddress:'Lokaal adres', topCpu:'Top CPU-processen', topMemory:'Top geheugenprocessen', pid:'PID', process:'Proces', cpu:'CPU', ram:'RAM', warnings:'Recente systeemwaarschuwingen', noWarnings:'Geen recente waarschuwingen gevonden', noRows:'Geen gegevens beschikbaar', tools:'Snelle koppelingen', openInsights:'Volledige Inzichten-pagina', openProcesses:'Processen', openNetwork:'Netwerkbeheer', openDisks:'Schijven', failedLoad:'Diagnostiek kon niet worden geladen'
    },
    de: {
      eyebrow:'Live-Diagnose', title:'Diagnose', subtitle:'Prozesse, Netzwerk, systemd und Systemmeldungen an einem Ort', refresh:'Aktualisieren', refreshing:'Aktualisieren…', lastUpdate:'Letzte Aktualisierung', boot:'Server gestartet', bootSub:'Letzter Start', systemd:'Systemd', failed:'fehlgeschlagen', noFailed:'Keine fehlgeschlagenen Units', attention:'Aufmerksamkeit erforderlich', network:'Netzwerk', active:'aktiv', interfacesDetected:'Schnittstellen erkannt', load:'Systemlast', networkInterfaces:'Netzwerkschnittstellen', interface:'Schnittstelle', status:'Status', ipv4:'IPv4', speed:'Geschwindigkeit', received:'Empfangen', sent:'Gesendet', failedUnits:'Fehlgeschlagene systemd-Units', sessions:'Angemeldete Sitzungen', noSessions:'Keine interaktiven Sitzungen gefunden', listeningPorts:'Lauschende Netzwerkports', protocol:'Protokoll', localAddress:'Lokale Adresse', topCpu:'Top-CPU-Prozesse', topMemory:'Top-Speicherprozesse', pid:'PID', process:'Prozess', cpu:'CPU', ram:'RAM', warnings:'Letzte Systemwarnungen', noWarnings:'Keine aktuellen Warnungen gefunden', noRows:'Keine Daten verfügbar', tools:'Schnellzugriff', openInsights:'Vollständige Einblicke-Seite', openProcesses:'Prozesse', openNetwork:'Netzwerkverwaltung', openDisks:'Datenträger', failedLoad:'Diagnose konnte nicht geladen werden'
    },
    en: {
      eyebrow:'Live diagnostics', title:'Diagnostics', subtitle:'Processes, networking, systemd and system messages in one place', refresh:'Refresh', refreshing:'Refreshing…', lastUpdate:'Last update', boot:'Server started', bootSub:'Last boot', systemd:'Systemd', failed:'failed', noFailed:'No failed units', attention:'Attention required', network:'Network', active:'active', interfacesDetected:'interfaces detected', load:'Load average', networkInterfaces:'Network interfaces', interface:'Interface', status:'Status', ipv4:'IPv4', speed:'Speed', received:'Received', sent:'Sent', failedUnits:'Failed systemd units', sessions:'Signed-in sessions', noSessions:'No interactive sessions found', listeningPorts:'Listening network ports', protocol:'Protocol', localAddress:'Local address', topCpu:'Top CPU processes', topMemory:'Top memory processes', pid:'PID', process:'Process', cpu:'CPU', ram:'RAM', warnings:'Recent system warnings', noWarnings:'No recent warnings found', noRows:'No data available', tools:'Quick links', openInsights:'Full Insights page', openProcesses:'Processes', openNetwork:'Network management', openDisks:'Disks', failedLoad:'Diagnostics could not be loaded'
    }
  };
  const t = (key) => dict[lang]?.[key] || dict.en[key] || key;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const numberFrom = (value) => Number((String(value || '').match(/\d+/) || ['0'])[0]);

  const style = document.createElement('style');
  style.textContent = `
    #diagnostics .section{display:none!important}
    #memo-v5-diagnostics{display:block}
    .memo-diag-head{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:12px;padding:16px;border:1px solid #263d59;border-radius:16px;background:linear-gradient(145deg,#13233a,#0d1928)}
    .memo-diag-head small{display:block;color:#7895b6;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.06em}.memo-diag-head h2{margin:3px 0 0;font-size:20px}.memo-diag-head p{margin:5px 0 0;color:#8ea6c2;font-size:11px}.memo-diag-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.memo-diag-time{color:#7895b6;font-size:10px}.memo-diag-btn{appearance:none;border:1px solid #315776;border-radius:9px;background:#10233a;color:#c9e8ff;padding:8px 11px;font-weight:800;cursor:pointer}.memo-diag-btn:hover{border-color:#60a5fa;background:#133052}.memo-diag-btn:disabled{opacity:.6;cursor:wait}
    .memo-diag-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:12px}.memo-diag-stat{padding:13px;border:1px solid #29415e;border-radius:13px;background:#0b1726;min-width:0}.memo-diag-stat small{display:block;color:#7895b6;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.05em}.memo-diag-stat strong{display:block;margin-top:6px;font-size:16px;overflow-wrap:anywhere}.memo-diag-stat span{display:block;margin-top:4px;color:#8ea6c2;font-size:10px}.memo-diag-stat.ok strong{color:#86efac}.memo-diag-stat.bad strong{color:#fca5a5}
    .memo-diag-panel{margin-top:12px;padding:15px;border:1px solid #263d59;border-radius:15px;background:linear-gradient(145deg,#122136,#0d1928)}.memo-diag-panel h3{margin:0 0 11px;font-size:15px}.memo-diag-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.memo-diag-scroll{overflow:auto}.memo-diag-table{width:100%;border-collapse:collapse}.memo-diag-table th,.memo-diag-table td{padding:9px 8px;border-top:1px solid #24364e;text-align:left;font-size:11px;white-space:nowrap}.memo-diag-table th{border-top:0;color:#7895b6;text-transform:uppercase;font-size:9px;letter-spacing:.05em}.memo-diag-table td:first-child{font-weight:800;color:#dcecff}.memo-diag-line{padding:9px 0;border-top:1px solid #24364e;color:#d6e2f2;font:11px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere}.memo-diag-line:first-child{border-top:0}.memo-diag-line.bad{color:#fca5a5}.memo-diag-empty{color:#86efac;font-size:11px}.memo-diag-error{padding:14px;border:1px solid #7f3a49;border-radius:12px;background:#2a1520;color:#fecdd3}.memo-diag-links{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.memo-diag-links a{display:block;padding:12px;border:1px solid #29415e;border-radius:11px;background:#0b1726;color:#c9e8ff;text-decoration:none;font-weight:750}.memo-diag-links a:hover{border-color:#60a5fa;background:#10233a}
    @media(max-width:1050px){.memo-diag-summary,.memo-diag-links{grid-template-columns:repeat(2,1fr)}}@media(max-width:800px){.memo-diag-grid{grid-template-columns:1fr}}@media(max-width:600px){.memo-diag-head{align-items:flex-start;flex-direction:column}.memo-diag-actions{justify-content:flex-start}.memo-diag-summary,.memo-diag-links{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'memo-v5-diagnostics';
  view.appendChild(root);

  const parseTable = (panel) => Array.from(panel?.querySelectorAll('tbody tr') || []).map(row => Array.from(row.querySelectorAll('td')).map(cell => cell.textContent.trim()));
  const parseLines = (panel) => Array.from(panel?.querySelectorAll('.logline') || []).map(line => line.textContent.trim()).filter(Boolean);
  const table = (headers, rows) => {
    if (!rows.length) return `<div class="memo-diag-empty">${esc(t('noRows'))}</div>`;
    return `<div class="memo-diag-scroll"><table class="memo-diag-table"><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  };
  const lines = (rows, bad, emptyText) => rows.length ? rows.map(row => `<div class="memo-diag-line${bad ? ' bad' : ''}">${esc(row)}</div>`).join('') : `<div class="memo-diag-empty">${esc(emptyText)}</div>`;

  let busy = false;
  let lastFetch = 0;

  const render = async (force = false) => {
    if (busy) return;
    if (!force && Date.now() - lastFetch < 5000) return;
    busy = true;
    const existingButton = root.querySelector('#memo-diag-refresh');
    if (existingButton) { existingButton.disabled = true; existingButton.textContent = t('refreshing'); }
    try {
      const response = await fetch(`/memo-network/system-info.cgi?view=insights&_=${Date.now()}`, {cache:'no-store', credentials:'same-origin'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const stats = Array.from(doc.querySelectorAll('.stat'));
      const panels = Array.from(doc.querySelectorAll('.panel'));
      if (stats.length < 4 || panels.length < 7) throw new Error('Onvolledige diagnostiekrespons');

      const boot = stats[0]?.querySelector('strong')?.textContent.trim() || '—';
      const failedCount = numberFrom(stats[1]?.querySelector('strong')?.textContent);
      const activeInterfaces = numberFrom(stats[2]?.querySelector('strong')?.textContent);
      const totalInterfaces = numberFrom(stats[2]?.querySelector('span')?.textContent);
      const load1 = stats[3]?.querySelector('strong')?.textContent.trim() || '0';
      const loadSub = stats[3]?.querySelector('span')?.textContent.trim() || '';
      const networkRows = parseTable(panels[0]);
      const failedRows = parseLines(panels[1]);
      const sessionRows = parseLines(panels[2]);
      const socketRows = parseTable(panels[3]);
      const cpuRows = parseTable(panels[4]);
      const memoryRows = parseTable(panels[5]);
      const warningRows = parseLines(panels[6]);
      const now = new Date();

      root.innerHTML = `
        <div class="memo-diag-head"><div><small>${esc(t('eyebrow'))}</small><h2>${esc(t('title'))}</h2><p>${esc(t('subtitle'))}</p></div><div class="memo-diag-actions"><span class="memo-diag-time">${esc(t('lastUpdate'))}: ${esc(now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}))}</span><button class="memo-diag-btn" id="memo-diag-refresh" type="button">↻ ${esc(t('refresh'))}</button></div></div>
        <div class="memo-diag-summary">
          <div class="memo-diag-stat"><small>${esc(t('boot'))}</small><strong>${esc(boot)}</strong><span>${esc(t('bootSub'))}</span></div>
          <div class="memo-diag-stat ${failedCount ? 'bad' : 'ok'}"><small>${esc(t('systemd'))}</small><strong>${failedCount} ${esc(t('failed'))}</strong><span>${esc(failedCount ? t('attention') : t('noFailed'))}</span></div>
          <div class="memo-diag-stat"><small>${esc(t('network'))}</small><strong>${activeInterfaces} ${esc(t('active'))}</strong><span>${totalInterfaces} ${esc(t('interfacesDetected'))}</span></div>
          <div class="memo-diag-stat"><small>${esc(t('load'))}</small><strong>${esc(load1)}</strong><span>${esc(loadSub)}</span></div>
        </div>
        <section class="memo-diag-panel"><h3>${esc(t('networkInterfaces'))}</h3>${table([t('interface'),t('status'),t('ipv4'),t('speed'),t('received'),t('sent')], networkRows)}</section>
        <div class="memo-diag-grid"><section class="memo-diag-panel"><h3>${esc(t('failedUnits'))}</h3>${lines(failedRows, true, t('noFailed'))}</section><section class="memo-diag-panel"><h3>${esc(t('sessions'))}</h3>${lines(sessionRows, false, t('noSessions'))}</section></div>
        <section class="memo-diag-panel"><h3>${esc(t('listeningPorts'))}</h3>${table([t('protocol'),t('status'),t('localAddress')], socketRows)}</section>
        <div class="memo-diag-grid"><section class="memo-diag-panel"><h3>${esc(t('topCpu'))}</h3>${table([t('pid'),t('process'),t('cpu'),t('ram')], cpuRows)}</section><section class="memo-diag-panel"><h3>${esc(t('topMemory'))}</h3>${table([t('pid'),t('process'),t('cpu'),t('ram')], memoryRows)}</section></div>
        <section class="memo-diag-panel"><h3>${esc(t('warnings'))}</h3>${lines(warningRows, false, t('noWarnings'))}</section>
        <section class="memo-diag-panel"><h3>${esc(t('tools'))}</h3><div class="memo-diag-links"><a href="/memo-network/system-info.cgi?view=insights">${esc(t('openInsights'))}</a><a href="/memo-network/processes.cgi">${esc(t('openProcesses'))}</a><a href="/net/index.cgi">${esc(t('openNetwork'))}</a><a href="/mount/index.cgi">${esc(t('openDisks'))}</a></div></section>`;
      root.querySelector('#memo-diag-refresh')?.addEventListener('click', () => render(true));
      lastFetch = Date.now();
    } catch (error) {
      root.innerHTML = `<div class="memo-diag-error"><strong>${esc(t('failedLoad'))}</strong><div style="margin-top:5px">${esc(error?.message || error)}</div></div>`;
    } finally {
      busy = false;
      const button = root.querySelector('#memo-diag-refresh');
      if (button) { button.disabled = false; button.textContent = `↻ ${t('refresh')}`; }
    }
  };

  const maybeRefresh = () => { if (view.classList.contains('active')) render(); };
  const observer = new MutationObserver(maybeRefresh);
  observer.observe(view, {attributes:true, attributeFilter:['class']});
  maybeRefresh();
  setInterval(maybeRefresh, 7000);

  window.MemoNetworkV5Diagnostics = { refresh: () => render(true) };
})();
