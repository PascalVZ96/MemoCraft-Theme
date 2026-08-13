(() => {
  if (window.MemoNetworkV5Speedtest) return;

  const view = document.getElementById('infrastructure');
  if (!view) return;

  const cookie = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
  const lang = cookie ? cookie[1].toLowerCase() : (document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
  const dict = {
    nl: {
      eyebrow:'Internetverbinding', title:'Internet Speedtest', subtitle:'Meet de echte download-, upload- en pingprestaties van deze server.', start:'Speedtest starten', running:'Speedtest wordt uitgevoerd…', runningSub:'Download en upload worden gemeten. Dit kan tot ongeveer een minuut duren.', download:'Download', upload:'Upload', ping:'Ping', server:'Testserver', provider:'Provider', externalIp:'Extern IP', lastTest:'Laatste test', never:'Nog geen speedtest uitgevoerd', unavailable:'Speedtest-client ontbreekt', unavailableSub:'Installeer speedtest-cli op de server om deze functie te gebruiken.', install:'Installatiecommando', failed:'Speedtest mislukt', bandwidthNote:'Een speedtest gebruikt tijdelijk veel internetbandbreedte. De test start daarom alleen handmatig.', ready:'Klaar voor een nieuwe meting', backend:'Backend'
    },
    de: {
      eyebrow:'Internetverbindung', title:'Internet-Speedtest', subtitle:'Misst die tatsächliche Download-, Upload- und Ping-Leistung dieses Servers.', start:'Speedtest starten', running:'Speedtest wird ausgeführt…', runningSub:'Download und Upload werden gemessen. Das kann ungefähr eine Minute dauern.', download:'Download', upload:'Upload', ping:'Ping', server:'Testserver', provider:'Anbieter', externalIp:'Externe IP', lastTest:'Letzter Test', never:'Noch kein Speedtest ausgeführt', unavailable:'Speedtest-Client fehlt', unavailableSub:'Installiere speedtest-cli auf dem Server, um diese Funktion zu verwenden.', install:'Installationsbefehl', failed:'Speedtest fehlgeschlagen', bandwidthNote:'Ein Speedtest nutzt vorübergehend viel Internetbandbreite und wird deshalb nur manuell gestartet.', ready:'Bereit für eine neue Messung', backend:'Backend'
    },
    en: {
      eyebrow:'Internet connection', title:'Internet Speedtest', subtitle:'Measure the actual download, upload and ping performance of this server.', start:'Start speedtest', running:'Speedtest is running…', runningSub:'Download and upload are being measured. This can take about a minute.', download:'Download', upload:'Upload', ping:'Ping', server:'Test server', provider:'Provider', externalIp:'External IP', lastTest:'Last test', never:'No speedtest has been run yet', unavailable:'Speedtest client is missing', unavailableSub:'Install speedtest-cli on the server to use this feature.', install:'Install command', failed:'Speedtest failed', bandwidthNote:'A speedtest temporarily uses significant internet bandwidth, so it only runs manually.', ready:'Ready for a new measurement', backend:'Backend'
    }
  };

  const t = (key) => dict[lang]?.[key] || dict.en[key] || key;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = (value, digits = 2) => Number(value || 0).toFixed(digits);
  const formatTime = (epoch) => {
    const date = new Date(Number(epoch || 0) * 1000);
    return Number.isNaN(date.getTime()) || !epoch ? '—' : date.toLocaleString([], {dateStyle:'short', timeStyle:'medium'});
  };

  const style = document.createElement('style');
  style.textContent = `
    .memo-speedtest-panel{margin-top:12px;padding:15px;border:1px solid #2a4868;border-radius:15px;background:linear-gradient(145deg,#12243b,#0d1928);overflow:hidden;position:relative}
    .memo-speedtest-panel.running{border-color:#3b82f6;box-shadow:0 0 0 1px rgba(59,130,246,.18)}
    .memo-speedtest-panel.running:before{content:'';position:absolute;left:-35%;top:0;width:35%;height:2px;background:linear-gradient(90deg,transparent,#60a5fa,transparent);animation:memoSpeedLine 1.5s linear infinite}
    @keyframes memoSpeedLine{to{left:100%}}
    .memo-speedtest-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.memo-speedtest-head small{display:block;color:#7895b6;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.06em}.memo-speedtest-head h3{margin:3px 0 0;font-size:16px}.memo-speedtest-head p{margin:5px 0 0;color:#8ea6c2;font-size:11px}.memo-speedtest-btn{appearance:none;border:1px solid #3b82f6;border-radius:9px;background:#1d4ed8;color:#fff;padding:9px 12px;font-weight:850;cursor:pointer;white-space:nowrap}.memo-speedtest-btn:hover{background:#2563eb}.memo-speedtest-btn:disabled{opacity:.6;cursor:wait}
    .memo-speedtest-state{margin-top:12px;padding:10px 12px;border:1px solid #29415e;border-radius:11px;background:#0b1726;color:#9fb6ce;font-size:11px}.memo-speedtest-state.error{border-color:#7f3a49;background:#2a1520;color:#fecdd3}.memo-speedtest-state.ok{border-color:#247653;background:#0d281f;color:#86efac}
    .memo-speedtest-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}.memo-speedtest-metric{padding:14px;border:1px solid #29415e;border-radius:13px;background:#0b1726;min-width:0}.memo-speedtest-metric small{display:block;color:#7895b6;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.05em}.memo-speedtest-metric strong{display:block;margin-top:6px;font-size:24px;letter-spacing:-.02em}.memo-speedtest-metric span{display:block;margin-top:3px;color:#8ea6c2;font-size:10px}.memo-speedtest-metric.download strong{color:#7dd3fc}.memo-speedtest-metric.upload strong{color:#c4b5fd}.memo-speedtest-metric.ping strong{color:#86efac}
    .memo-speedtest-meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px}.memo-speedtest-kv{padding:10px;border:1px solid #263d59;border-radius:10px;background:#0b1726;min-width:0}.memo-speedtest-kv small{display:block;color:#7895b6;font-size:8px;text-transform:uppercase;font-weight:800}.memo-speedtest-kv strong{display:block;margin-top:4px;color:#dcecff;font-size:10px;overflow-wrap:anywhere}.memo-speedtest-note{margin-top:10px;color:#7189a5;font-size:10px}.memo-speedtest-install{margin-top:9px;padding:9px 10px;border:1px solid #725d28;border-radius:9px;background:#2a2312;color:#fde68a;font:11px ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere}
    @media(max-width:900px){.memo-speedtest-meta{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.memo-speedtest-head{flex-direction:column}.memo-speedtest-metrics,.memo-speedtest-meta{grid-template-columns:1fr}.memo-speedtest-btn{width:100%}}
  `;
  document.head.appendChild(style);

  let available = false;
  let backend = '';
  let result = null;
  let error = '';
  let running = false;
  let installCommand = 'sudo apt install speedtest-cli -y';
  let statusLoaded = false;

  const infrastructureRoot = () => document.getElementById('memo-v5-infrastructure');

  const panelHtml = () => {
    const hasResult = !!result;
    const stateClass = error ? 'error' : hasResult ? 'ok' : '';
    const stateText = running ? t('runningSub') : error ? `${t('failed')}: ${error}` : !available ? t('unavailableSub') : hasResult ? t('ready') : t('never');
    return `
      <div class="memo-speedtest-head">
        <div><small>${esc(t('eyebrow'))}</small><h3>${esc(t('title'))}</h3><p>${esc(t('subtitle'))}</p></div>
        <button class="memo-speedtest-btn" id="memo-speedtest-start" type="button" ${(!available || running) ? 'disabled' : ''}>${esc(running ? t('running') : t('start'))}</button>
      </div>
      <div class="memo-speedtest-state ${stateClass}">${esc(stateText)}</div>
      <div class="memo-speedtest-metrics">
        <div class="memo-speedtest-metric download"><small>${esc(t('download'))}</small><strong>${hasResult ? esc(fmt(result.download_mbps)) : '—'}</strong><span>Mbit/s</span></div>
        <div class="memo-speedtest-metric upload"><small>${esc(t('upload'))}</small><strong>${hasResult ? esc(fmt(result.upload_mbps)) : '—'}</strong><span>Mbit/s</span></div>
        <div class="memo-speedtest-metric ping"><small>${esc(t('ping'))}</small><strong>${hasResult ? esc(fmt(result.ping_ms, 1)) : '—'}</strong><span>ms</span></div>
      </div>
      <div class="memo-speedtest-meta">
        <div class="memo-speedtest-kv"><small>${esc(t('server'))}</small><strong>${esc(result?.server || '—')}</strong></div>
        <div class="memo-speedtest-kv"><small>${esc(t('provider'))}</small><strong>${esc(result?.provider || '—')}</strong></div>
        <div class="memo-speedtest-kv"><small>${esc(t('externalIp'))}</small><strong>${esc(result?.external_ip || '—')}</strong></div>
        <div class="memo-speedtest-kv"><small>${esc(t('lastTest'))}</small><strong>${esc(result?.tested_at ? formatTime(result.tested_at) : '—')}</strong></div>
      </div>
      ${!available && statusLoaded ? `<div class="memo-speedtest-install"><strong>${esc(t('install'))}:</strong> ${esc(installCommand)}</div>` : ''}
      ${backend ? `<div class="memo-speedtest-note">${esc(t('backend'))}: ${esc(backend)} · ${esc(t('bandwidthNote'))}</div>` : `<div class="memo-speedtest-note">${esc(t('bandwidthNote'))}</div>`}`;
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

  const loadStatus = async () => {
    try {
      const response = await fetch(`/memo-network/speedtest.cgi?_=${Date.now()}`, {cache:'no-store', credentials:'same-origin'});
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      available = !!data.available;
      backend = data.backend || '';
      result = data.result || null;
      installCommand = data.install_command || installCommand;
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
      const response = await fetch(`/memo-network/speedtest.cgi?_=${Date.now()}`, {
        method:'POST',
        credentials:'same-origin',
        cache:'no-store',
        headers:{'X-Requested-With':'MemoNetwork'}
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      available = !!data.available;
      backend = data.backend || backend;
      result = data.result || result;
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
  setInterval(() => {
    if (!running && view.classList.contains('active')) loadStatus();
  }, 30000);

  window.MemoNetworkV5Speedtest = {refresh: loadStatus, run: runSpeedtest};
})();
