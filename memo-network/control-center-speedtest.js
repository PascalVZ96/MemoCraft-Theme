(() => {
  if (window.MemoNetworkV5Speedtest) return;

  const view = document.getElementById('infrastructure');
  if (!view) return;

  const cookie = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
  const lang = cookie ? cookie[1].toLowerCase() : (document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
  const dict = {
    nl: {
      eyebrow:'Internetverbinding', title:'Internet Speedtest', subtitle:'Meet prestaties en volg de ontwikkeling van download, upload en ping.', start:'Speedtest starten', running:'Speedtest wordt uitgevoerd…', runningSub:'Download en upload worden gemeten. Dit kan tot ongeveer een minuut duren.', download:'Download', upload:'Upload', ping:'Ping', server:'Testserver', provider:'Provider', externalIp:'Extern IP', lastTest:'Laatste test', never:'Nog geen speedtest uitgevoerd', unavailable:'Speedtest-client ontbreekt', unavailableSub:'Installeer speedtest-cli op de server om deze functie te gebruiken.', install:'Installatiecommando', failed:'Speedtest mislukt', ready:'Klaar voor een nieuwe meting', backend:'Backend', source:'Meting', manual:'Handmatig', scheduled:'Automatisch', history:'Prestatiegeschiedenis', historySub:'Laatste metingen, inclusief de nachtelijke automatische speedtest.', noHistory:'Nog te weinig metingen voor een grafiek', tests:'metingen', averageDownload:'Gem. download', averageUpload:'Gem. upload', averagePing:'Gem. ping', bestDownload:'Beste download', recent:'Recente metingen', date:'Datum', automatic:'Automatische speedtest', detected:'Planning actief', notDetected:'Geen planning gedetecteerd', enabled:'Ingeschakeld', disabled:'Uitgeschakeld', nextRun:'Volgende run', schedule:'Schema', scheduleNote:'MemoNetwork leest de bestaande systemd-timer uit. Handmatig testen blijft altijd mogelijk.', bandwidthNote:'Een speedtest gebruikt tijdelijk veel bandbreedte. Automatische metingen worden door je bestaande serverplanning uitgevoerd.'
    },
    de: {
      eyebrow:'Internetverbindung', title:'Internet-Speedtest', subtitle:'Misst die Leistung und verfolgt Download, Upload und Ping im Zeitverlauf.', start:'Speedtest starten', running:'Speedtest wird ausgeführt…', runningSub:'Download und Upload werden gemessen. Das kann ungefähr eine Minute dauern.', download:'Download', upload:'Upload', ping:'Ping', server:'Testserver', provider:'Anbieter', externalIp:'Externe IP', lastTest:'Letzter Test', never:'Noch kein Speedtest ausgeführt', unavailable:'Speedtest-Client fehlt', unavailableSub:'Installiere speedtest-cli auf dem Server, um diese Funktion zu verwenden.', install:'Installationsbefehl', failed:'Speedtest fehlgeschlagen', ready:'Bereit für eine neue Messung', backend:'Backend', source:'Messung', manual:'Manuell', scheduled:'Automatisch', history:'Leistungsverlauf', historySub:'Letzte Messungen inklusive des automatischen nächtlichen Speedtests.', noHistory:'Noch zu wenige Messungen für ein Diagramm', tests:'Messungen', averageDownload:'Ø Download', averageUpload:'Ø Upload', averagePing:'Ø Ping', bestDownload:'Bester Download', recent:'Letzte Messungen', date:'Datum', automatic:'Automatischer Speedtest', detected:'Zeitplan aktiv', notDetected:'Kein Zeitplan erkannt', enabled:'Aktiviert', disabled:'Deaktiviert', nextRun:'Nächster Lauf', schedule:'Zeitplan', scheduleNote:'MemoNetwork liest den vorhandenen systemd-Timer nur aus. Manuelle Tests bleiben jederzeit möglich.', bandwidthNote:'Ein Speedtest nutzt vorübergehend viel Bandbreite. Automatische Messungen werden durch die vorhandene Serverplanung ausgeführt.'
    },
    en: {
      eyebrow:'Internet connection', title:'Internet Speedtest', subtitle:'Measure performance and track download, upload and ping over time.', start:'Start speedtest', running:'Speedtest is running…', runningSub:'Download and upload are being measured. This can take about a minute.', download:'Download', upload:'Upload', ping:'Ping', server:'Test server', provider:'Provider', externalIp:'External IP', lastTest:'Last test', never:'No speedtest has been run yet', unavailable:'Speedtest client is missing', unavailableSub:'Install speedtest-cli on the server to use this feature.', install:'Install command', failed:'Speedtest failed', ready:'Ready for a new measurement', backend:'Backend', source:'Measurement', manual:'Manual', scheduled:'Automatic', history:'Performance history', historySub:'Recent measurements, including the nightly automatic speedtest.', noHistory:'Not enough measurements for a chart yet', tests:'measurements', averageDownload:'Avg. download', averageUpload:'Avg. upload', averagePing:'Avg. ping', bestDownload:'Best download', recent:'Recent measurements', date:'Date', automatic:'Automatic speedtest', detected:'Schedule active', notDetected:'No schedule detected', enabled:'Enabled', disabled:'Disabled', nextRun:'Next run', schedule:'Schedule', scheduleNote:'MemoNetwork only reads the existing systemd timer. Manual tests remain available at any time.', bandwidthNote:'A speedtest temporarily uses significant bandwidth. Automatic measurements are handled by your existing server schedule.'
    }
  };

  const t = (key) => dict[lang]?.[key] || dict.en[key] || key;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean = (value) => String(value ?? '').replace(/Â·/g, '·');
  const fmt = (value, digits = 2) => Number(value || 0).toFixed(digits);
  const formatTime = (epoch) => {
    const date = new Date(Number(epoch || 0) * 1000);
    return Number.isNaN(date.getTime()) || !epoch ? '—' : date.toLocaleString([], {dateStyle:'short', timeStyle:'medium'});
  };
  const avg = (items, key) => items.length ? items.reduce((sum, item) => sum + Number(item?.[key] || 0), 0) / items.length : 0;

  const style = document.createElement('style');
  style.textContent = `
    .memo-speedtest-panel{margin-top:12px;padding:15px;border:1px solid #2a4868;border-radius:15px;background:linear-gradient(145deg,#12243b,#0d1928);overflow:hidden;position:relative}
    .memo-speedtest-panel.running{border-color:#3b82f6;box-shadow:0 0 0 1px rgba(59,130,246,.18)}
    .memo-speedtest-panel.running:before{content:'';position:absolute;left:-35%;top:0;width:35%;height:2px;background:linear-gradient(90deg,transparent,#60a5fa,transparent);animation:memoSpeedLine 1.5s linear infinite}
    @keyframes memoSpeedLine{to{left:100%}}
    .memo-speedtest-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.memo-speedtest-head small,.memo-speedtest-history small,.memo-speedtest-auto small{display:block;color:#7895b6;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.06em}.memo-speedtest-head h3{margin:3px 0 0;font-size:16px}.memo-speedtest-head p{margin:5px 0 0;color:#8ea6c2;font-size:11px}.memo-speedtest-btn{appearance:none;border:1px solid #3b82f6;border-radius:9px;background:#1d4ed8;color:#fff;padding:9px 12px;font-weight:850;cursor:pointer;white-space:nowrap}.memo-speedtest-btn:hover{background:#2563eb}.memo-speedtest-btn:disabled{opacity:.6;cursor:wait}
    .memo-speedtest-state{margin-top:12px;padding:10px 12px;border:1px solid #29415e;border-radius:11px;background:#0b1726;color:#9fb6ce;font-size:11px}.memo-speedtest-state.error{border-color:#7f3a49;background:#2a1520;color:#fecdd3}.memo-speedtest-state.ok{border-color:#247653;background:#0d281f;color:#86efac}
    .memo-speedtest-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}.memo-speedtest-metric{padding:14px;border:1px solid #29415e;border-radius:13px;background:#0b1726;min-width:0}.memo-speedtest-metric small{display:block;color:#7895b6;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.05em}.memo-speedtest-metric strong{display:block;margin-top:6px;font-size:24px;letter-spacing:-.02em}.memo-speedtest-metric span{display:block;margin-top:3px;color:#8ea6c2;font-size:10px}.memo-speedtest-metric.download strong{color:#7dd3fc}.memo-speedtest-metric.upload strong{color:#c4b5fd}.memo-speedtest-metric.ping strong{color:#86efac}
    .memo-speedtest-meta{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:10px}.memo-speedtest-kv{padding:10px;border:1px solid #263d59;border-radius:10px;background:#0b1726;min-width:0}.memo-speedtest-kv small{display:block;color:#7895b6;font-size:8px;text-transform:uppercase;font-weight:800}.memo-speedtest-kv strong{display:block;margin-top:4px;color:#dcecff;font-size:10px;overflow-wrap:anywhere}.memo-speedtest-note{margin-top:10px;color:#7189a5;font-size:10px}.memo-speedtest-install{margin-top:9px;padding:9px 10px;border:1px solid #725d28;border-radius:9px;background:#2a2312;color:#fde68a;font:11px ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere}
    .memo-speedtest-auto{display:grid;grid-template-columns:1.2fr .8fr .8fr;gap:8px;margin-top:10px;padding:11px;border:1px solid #29415e;border-radius:12px;background:#0a1828}.memo-speedtest-auto strong{display:block;margin-top:4px;font-size:11px;color:#dcecff;overflow-wrap:anywhere}.memo-speedtest-auto .active strong{color:#86efac}.memo-speedtest-auto .inactive strong{color:#fcd34d}
    .memo-speedtest-history{margin-top:12px;padding:13px;border:1px solid #263d59;border-radius:13px;background:#0a1625}.memo-speedtest-history-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.memo-speedtest-history-head h4{margin:3px 0 0;font-size:14px}.memo-speedtest-history-head p{margin:4px 0 0;color:#8ea6c2;font-size:10px}.memo-speedtest-count{padding:5px 8px;border:1px solid #315776;border-radius:999px;color:#9bdcff;font-size:9px;font-weight:800;white-space:nowrap}.memo-speedtest-history-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px}.memo-speedtest-history-stat{padding:10px;border:1px solid #263d59;border-radius:10px;background:#0b1726}.memo-speedtest-history-stat strong{display:block;margin-top:4px;font-size:13px;color:#dcecff}.memo-speedtest-chart{margin-top:10px;border:1px solid #20354e;border-radius:11px;background:#07121f;padding:8px;overflow:hidden}.memo-speedtest-chart svg{display:block;width:100%;height:auto;min-height:150px}.memo-speedtest-legend{display:flex;gap:14px;align-items:center;margin-top:7px;color:#8ea6c2;font-size:9px}.memo-speedtest-legend span:before{content:'';display:inline-block;width:9px;height:2px;margin-right:5px;vertical-align:middle}.memo-speedtest-legend .down:before{background:#38bdf8}.memo-speedtest-legend .up:before{background:#a78bfa}.memo-speedtest-empty{padding:22px;text-align:center;color:#7895b6;font-size:10px}.memo-speedtest-recent{margin-top:10px;overflow:auto}.memo-speedtest-table{width:100%;border-collapse:collapse}.memo-speedtest-table th,.memo-speedtest-table td{padding:7px 6px;border-top:1px solid #20354e;text-align:left;font-size:9px;white-space:nowrap}.memo-speedtest-table th{border-top:0;color:#7895b6;text-transform:uppercase;letter-spacing:.04em}.memo-speedtest-source{padding:3px 6px;border:1px solid #315776;border-radius:999px;color:#9bdcff;font-size:8px}
    @media(max-width:1000px){.memo-speedtest-meta{grid-template-columns:repeat(3,1fr)}.memo-speedtest-history-summary{grid-template-columns:repeat(2,1fr)}}@media(max-width:800px){.memo-speedtest-auto{grid-template-columns:1fr}}
    @media(max-width:650px){.memo-speedtest-head{flex-direction:column}.memo-speedtest-metrics,.memo-speedtest-meta,.memo-speedtest-history-summary{grid-template-columns:1fr}.memo-speedtest-btn{width:100%}.memo-speedtest-history-head{flex-direction:column}}
  `;
  document.head.appendChild(style);

  let available = false;
  let backend = '';
  let result = null;
  let history = [];
  let scheduler = null;
  let error = '';
  let running = false;
  let installCommand = 'sudo apt install speedtest-cli -y';
  let statusLoaded = false;

  const infrastructureRoot = () => document.getElementById('memo-v5-infrastructure');
  const sourceLabel = (source) => source === 'scheduled' ? t('scheduled') : source === 'manual' ? t('manual') : '—';

  const chartSvg = () => {
    const items = history.filter(item => Number(item?.download_mbps || 0) > 0 && Number(item?.upload_mbps || 0) > 0).slice(-30);
    if (items.length < 2) return `<div class="memo-speedtest-empty">${esc(t('noHistory'))}</div>`;
    const width = 760, height = 190, left = 36, right = 14, top = 15, bottom = 30;
    const innerW = width - left - right, innerH = height - top - bottom;
    const maxValue = Math.max(1, ...items.flatMap(item => [Number(item.download_mbps || 0), Number(item.upload_mbps || 0)]));
    const x = (index) => left + (items.length === 1 ? innerW / 2 : (index / (items.length - 1)) * innerW);
    const y = (value) => top + innerH - (Number(value || 0) / maxValue) * innerH;
    const points = (key) => items.map((item, index) => `${x(index).toFixed(1)},${y(item[key]).toFixed(1)}`).join(' ');
    const grid = [0, .25, .5, .75, 1].map(fraction => {
      const yy = top + innerH - fraction * innerH;
      return `<line x1="${left}" y1="${yy}" x2="${width-right}" y2="${yy}" stroke="#20354e" stroke-width="1"/><text x="${left-5}" y="${yy+3}" fill="#647b96" font-size="9" text-anchor="end">${Math.round(maxValue*fraction)}</text>`;
    }).join('');
    const first = new Date(Number(items[0].tested_at || 0) * 1000).toLocaleDateString([], {day:'2-digit',month:'2-digit'});
    const last = new Date(Number(items.at(-1).tested_at || 0) * 1000).toLocaleDateString([], {day:'2-digit',month:'2-digit'});
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(t('history'))}">${grid}<polyline fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${points('download_mbps')}"/><polyline fill="none" stroke="#a78bfa" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${points('upload_mbps')}"/><text x="${left}" y="${height-8}" fill="#647b96" font-size="9">${esc(first)}</text><text x="${width-right}" y="${height-8}" fill="#647b96" font-size="9" text-anchor="end">${esc(last)}</text></svg><div class="memo-speedtest-legend"><span class="down">${esc(t('download'))}</span><span class="up">${esc(t('upload'))}</span></div>`;
  };

  const recentRows = () => history.slice(-6).reverse().map(item => `<tr><td>${esc(formatTime(item.tested_at))}</td><td>${esc(fmt(item.download_mbps))} Mbit/s</td><td>${esc(fmt(item.upload_mbps))} Mbit/s</td><td>${esc(fmt(item.ping_ms,1))} ms</td><td><span class="memo-speedtest-source">${esc(sourceLabel(item.source))}</span></td></tr>`).join('');

  const historyHtml = () => {
    const items = history.filter(item => Number(item?.download_mbps || 0) > 0 && Number(item?.upload_mbps || 0) > 0);
    const bestDownload = items.length ? Math.max(...items.map(item => Number(item.download_mbps || 0))) : 0;
    return `<section class="memo-speedtest-history"><div class="memo-speedtest-history-head"><div><small>${esc(t('history'))}</small><h4>${esc(t('history'))}</h4><p>${esc(t('historySub'))}</p></div><span class="memo-speedtest-count">${items.length} ${esc(t('tests'))}</span></div><div class="memo-speedtest-history-summary"><div class="memo-speedtest-history-stat"><small>${esc(t('averageDownload'))}</small><strong>${items.length ? `${esc(fmt(avg(items,'download_mbps')))} Mbit/s` : '—'}</strong></div><div class="memo-speedtest-history-stat"><small>${esc(t('averageUpload'))}</small><strong>${items.length ? `${esc(fmt(avg(items,'upload_mbps')))} Mbit/s` : '—'}</strong></div><div class="memo-speedtest-history-stat"><small>${esc(t('averagePing'))}</small><strong>${items.length ? `${esc(fmt(avg(items,'ping_ms'),1))} ms` : '—'}</strong></div><div class="memo-speedtest-history-stat"><small>${esc(t('bestDownload'))}</small><strong>${items.length ? `${esc(fmt(bestDownload))} Mbit/s` : '—'}</strong></div></div><div class="memo-speedtest-chart">${chartSvg()}</div>${items.length ? `<div class="memo-speedtest-recent"><table class="memo-speedtest-table"><thead><tr><th>${esc(t('date'))}</th><th>${esc(t('download'))}</th><th>${esc(t('upload'))}</th><th>${esc(t('ping'))}</th><th>${esc(t('source'))}</th></tr></thead><tbody>${recentRows()}</tbody></table></div>` : ''}</section>`;
  };

  const schedulerHtml = () => {
    const detected = !!scheduler?.detected;
    const active = !!scheduler?.active;
    const enabled = !!scheduler?.enabled;
    const stateText = detected ? `${enabled ? t('enabled') : t('disabled')}${active ? ` · ${t('detected')}` : ''}` : t('notDetected');
    return `<div class="memo-speedtest-auto"><div class="${detected && active ? 'active' : 'inactive'}"><small>${esc(t('automatic'))}</small><strong>${esc(stateText)}</strong></div><div><small>${esc(t('schedule'))}</small><strong>${esc(scheduler?.schedule || '—')}</strong></div><div><small>${esc(t('nextRun'))}</small><strong>${esc(clean(scheduler?.next_run || '—'))}</strong></div></div><div class="memo-speedtest-note">${esc(t('scheduleNote'))}</div>`;
  };

  const panelHtml = () => {
    const hasResult = !!result;
    const stateClass = error ? 'error' : hasResult ? 'ok' : '';
    const stateText = running ? t('runningSub') : error ? `${t('failed')}: ${error}` : !available ? t('unavailableSub') : hasResult ? t('ready') : t('never');
    return `
      <div class="memo-speedtest-head"><div><small>${esc(t('eyebrow'))}</small><h3>${esc(t('title'))}</h3><p>${esc(t('subtitle'))}</p></div><button class="memo-speedtest-btn" id="memo-speedtest-start" type="button" ${(!available || running) ? 'disabled' : ''}>${esc(running ? t('running') : t('start'))}</button></div>
      <div class="memo-speedtest-state ${stateClass}">${esc(stateText)}</div>
      <div class="memo-speedtest-metrics"><div class="memo-speedtest-metric download"><small>${esc(t('download'))}</small><strong>${hasResult ? esc(fmt(result.download_mbps)) : '—'}</strong><span>Mbit/s</span></div><div class="memo-speedtest-metric upload"><small>${esc(t('upload'))}</small><strong>${hasResult ? esc(fmt(result.upload_mbps)) : '—'}</strong><span>Mbit/s</span></div><div class="memo-speedtest-metric ping"><small>${esc(t('ping'))}</small><strong>${hasResult ? esc(fmt(result.ping_ms,1)) : '—'}</strong><span>ms</span></div></div>
      <div class="memo-speedtest-meta"><div class="memo-speedtest-kv"><small>${esc(t('server'))}</small><strong>${esc(clean(result?.server || '—'))}</strong></div><div class="memo-speedtest-kv"><small>${esc(t('provider'))}</small><strong>${esc(clean(result?.provider || '—'))}</strong></div><div class="memo-speedtest-kv"><small>${esc(t('externalIp'))}</small><strong>${esc(result?.external_ip || '—')}</strong></div><div class="memo-speedtest-kv"><small>${esc(t('lastTest'))}</small><strong>${esc(result?.tested_at ? formatTime(result.tested_at) : '—')}</strong></div><div class="memo-speedtest-kv"><small>${esc(t('source'))}</small><strong>${esc(sourceLabel(result?.source))}</strong></div></div>
      ${schedulerHtml()}
      ${historyHtml()}
      ${!available && statusLoaded ? `<div class="memo-speedtest-install"><strong>${esc(t('install'))}:</strong> ${esc(installCommand)}</div>` : ''}
      <div class="memo-speedtest-note">${backend ? `${esc(t('backend'))}: ${esc(backend)} · ` : ''}${esc(t('bandwidthNote'))}</div>`;
  };

  const renderPanel = () => {
    const infra = infrastructureRoot();
    if (!infra) return;
    let panel = infra.querySelector('#memo-speedtest-panel');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'memo-speedtest-panel';
      panel.className = 'memo-speedtest-panel';
      const firstPanel = infra.querySelector('.memo-infra-panel');
      if (firstPanel) firstPanel.parentNode.insertBefore(panel, firstPanel);
      else infra.appendChild(panel);
    }
    panel.classList.toggle('running', running);
    panel.innerHTML = panelHtml();
    panel.querySelector('#memo-speedtest-start')?.addEventListener('click', runSpeedtest);
  };

  const applyData = (data) => {
    available = !!data.available;
    backend = data.backend || backend;
    result = data.result || result;
    history = Array.isArray(data.history) ? data.history : history;
    scheduler = data.scheduler || scheduler;
    installCommand = data.install_command || installCommand;
  };

  const loadStatus = async () => {
    if (running) return;
    try {
      const response = await fetch(`/memo-network/speedtest.cgi?_=${Date.now()}`, {cache:'no-store', credentials:'same-origin'});
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      applyData(data);
      error = '';
    } catch (err) {
      error = err?.message || String(err);
    } finally {
      statusLoaded = true;
      renderPanel();
    }
  };

  async function runSpeedtest() {
    if (running || !available) return;
    running = true;
    error = '';
    renderPanel();
    try {
      const response = await fetch(`/memo-network/speedtest.cgi?_=${Date.now()}`, {method:'POST', credentials:'same-origin', cache:'no-store', headers:{'X-Requested-With':'MemoNetwork'}});
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      applyData(data);
      error = '';
    } catch (err) {
      error = err?.message || String(err);
    } finally {
      running = false;
      renderPanel();
    }
  }

  const observer = new MutationObserver(() => {
    if (!document.getElementById('memo-speedtest-panel')) renderPanel();
  });
  observer.observe(view, {childList:true, subtree:true});
  renderPanel();
  loadStatus();
  setInterval(() => { if (!running && view.classList.contains('active')) loadStatus(); }, 30000);

  window.MemoNetworkV5Speedtest = {refresh: loadStatus, run: runSpeedtest};
})();
