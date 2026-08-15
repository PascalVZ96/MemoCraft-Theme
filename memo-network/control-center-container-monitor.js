(() => {
  if (window.MemoNetworkV5ContainerMonitor) return;

  const servicesView = document.getElementById('services');
  const detailPanel = document.getElementById('memo-service-detail');
  if (!servicesView) return;

  const cookie = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
  const lang = cookie ? cookie[1].toLowerCase() : (document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
  const dict = {
    nl: {
      monitor:'Monitor', title:'Container monitor', subtitle:'Live resources, processen en recente Docker-logs', close:'Sluiten', refresh:'Vernieuwen', refreshing:'Vernieuwen…', auto:'Auto verversen', every:'elke 5 sec', status:'Status', running:'Actief', stopped:'Gestopt', health:'Health', noHealth:'Geen healthcheck', cpu:'CPU', memory:'Geheugen', network:'Netwerk I/O', block:'Schijf I/O', pids:'PIDs', restarts:'Herstarts', uptime:'Uptime', image:'Image', ports:'Poorten', exitCode:'Exitcode', processes:'Containerprocessen', pid:'PID', process:'Proces', logs:'Recente logs', filter:'Filter logs…', copy:'Logs kopiëren', copied:'Gekopieerd', noLogs:'Geen recente logs beschikbaar', noProcesses:'Geen actieve processen beschikbaar', loading:'Containergegevens laden…', failed:'Containergegevens konden niet worden geladen', seconds:'sec', minutes:'min', hours:'uur', days:'dagen', lastRefresh:'Laatste update'
    },
    de: {
      monitor:'Monitor', title:'Container-Monitor', subtitle:'Live-Ressourcen, Prozesse und aktuelle Docker-Logs', close:'Schließen', refresh:'Aktualisieren', refreshing:'Aktualisieren…', auto:'Auto-Aktualisierung', every:'alle 5 Sek.', status:'Status', running:'Aktiv', stopped:'Gestoppt', health:'Health', noHealth:'Kein Healthcheck', cpu:'CPU', memory:'Speicher', network:'Netzwerk I/O', block:'Datenträger I/O', pids:'PIDs', restarts:'Neustarts', uptime:'Laufzeit', image:'Image', ports:'Ports', exitCode:'Exit-Code', processes:'Containerprozesse', pid:'PID', process:'Prozess', logs:'Aktuelle Logs', filter:'Logs filtern…', copy:'Logs kopieren', copied:'Kopiert', noLogs:'Keine aktuellen Logs verfügbar', noProcesses:'Keine aktiven Prozesse verfügbar', loading:'Containerdaten werden geladen…', failed:'Containerdaten konnten nicht geladen werden', seconds:'Sek.', minutes:'Min.', hours:'Std.', days:'Tage', lastRefresh:'Letzte Aktualisierung'
    },
    en: {
      monitor:'Monitor', title:'Container monitor', subtitle:'Live resources, processes and recent Docker logs', close:'Close', refresh:'Refresh', refreshing:'Refreshing…', auto:'Auto refresh', every:'every 5 sec', status:'Status', running:'Running', stopped:'Stopped', health:'Health', noHealth:'No healthcheck', cpu:'CPU', memory:'Memory', network:'Network I/O', block:'Disk I/O', pids:'PIDs', restarts:'Restarts', uptime:'Uptime', image:'Image', ports:'Ports', exitCode:'Exit code', processes:'Container processes', pid:'PID', process:'Process', logs:'Recent logs', filter:'Filter logs…', copy:'Copy logs', copied:'Copied', noLogs:'No recent logs available', noProcesses:'No active processes available', loading:'Loading container data…', failed:'Container data could not be loaded', seconds:'sec', minutes:'min', hours:'hr', days:'days', lastRefresh:'Last refresh'
    }
  };

  const t = key => dict[lang]?.[key] || dict.en[key] || key;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cleanPercent = value => String(value || '—').trim() || '—';
  const age = startedAt => {
    const start = new Date(startedAt || '');
    if (Number.isNaN(start.getTime())) return '—';
    const seconds = Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000));
    if (seconds < 60) return `${seconds} ${t('seconds')}`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} ${t('minutes')}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ${t('hours')}`;
    return `${Math.floor(seconds / 86400)} ${t('days')}`;
  };

  const style = document.createElement('style');
  style.textContent = `
    .memo-container-monitor-btn{border-color:#35668c!important;color:#a8dcff!important}
    #memo-container-monitor-backdrop{position:fixed;inset:0;z-index:20000;display:none;align-items:flex-start;justify-content:center;padding:28px;background:rgba(2,8,16,.76);backdrop-filter:blur(4px);overflow:auto}
    #memo-container-monitor-backdrop.open{display:flex}
    .memo-container-monitor{width:min(1180px,100%);border:1px solid #31506f;border-radius:18px;background:linear-gradient(160deg,#10243a,#091624 58%,#07121f);box-shadow:0 24px 70px rgba(0,0,0,.48);overflow:hidden}
    .memo-container-monitor-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:17px 18px;border-bottom:1px solid #243c58;background:#11263d}.memo-container-monitor-head small{display:block;color:#7fa7cc;font-size:9px;text-transform:uppercase;font-weight:850;letter-spacing:.07em}.memo-container-monitor-head h2{margin:4px 0 0;font-size:20px}.memo-container-monitor-head p{margin:5px 0 0;color:#8fa9c4;font-size:11px}.memo-container-monitor-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}.memo-container-monitor-close,.memo-container-monitor-refresh,.memo-container-monitor-copy{appearance:none;border:1px solid #315776;border-radius:9px;background:#10233a;color:#d4ecff;padding:8px 11px;font-size:10px;font-weight:800;cursor:pointer}.memo-container-monitor-refresh{background:#1d4ed8;border-color:#3b82f6;color:#fff}.memo-container-monitor-close:hover,.memo-container-monitor-copy:hover{border-color:#60a5fa}.memo-container-monitor-refresh:disabled{opacity:.55;cursor:wait}
    .memo-container-auto{display:flex;align-items:center;gap:6px;color:#9eb7d0;font-size:10px;font-weight:700}.memo-container-auto input{accent-color:#3b82f6}
    .memo-container-monitor-body{padding:17px}.memo-container-monitor-state{padding:10px 12px;border:1px solid #29415e;border-radius:10px;background:#0b1726;color:#9fb6ce;font-size:11px}.memo-container-monitor-state.ok{border-color:#247653;background:#0d281f;color:#86efac}.memo-container-monitor-state.error{border-color:#7f3a49;background:#2a1520;color:#fecdd3}
    .memo-container-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;margin-top:11px}.memo-container-metric{padding:11px;border:1px solid #29415e;border-radius:11px;background:#0b1726;min-width:0}.memo-container-metric small,.memo-container-kv small{display:block;color:#7895b6;font-size:8px;text-transform:uppercase;font-weight:850;letter-spacing:.04em}.memo-container-metric strong{display:block;margin-top:5px;color:#e7f4ff;font-size:15px;overflow-wrap:anywhere}.memo-container-metric.cpu strong{color:#7dd3fc}.memo-container-metric.mem strong{color:#c4b5fd}.memo-container-metric.good strong{color:#86efac}.memo-container-metric.bad strong{color:#fca5a5}
    .memo-container-meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:9px}.memo-container-kv{padding:10px;border:1px solid #263d59;border-radius:10px;background:#0b1726;min-width:0}.memo-container-kv strong{display:block;margin-top:4px;color:#dcecff;font-size:10px;overflow-wrap:anywhere}.memo-container-section{margin-top:12px;padding:13px;border:1px solid #263d59;border-radius:13px;background:#091725}.memo-container-section-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}.memo-container-section h3{margin:0;font-size:14px}.memo-container-scroll{overflow:auto}.memo-container-table{width:100%;border-collapse:collapse}.memo-container-table th,.memo-container-table td{padding:8px 7px;border-top:1px solid #21364e;text-align:left;font-size:10px;white-space:nowrap}.memo-container-table th{border-top:0;color:#7895b6;text-transform:uppercase;font-size:8px}.memo-container-empty{padding:16px;color:#7895b6;font-size:10px;text-align:center}
    .memo-container-log-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.memo-container-log-filter{min-width:230px;border:1px solid #31506f;border-radius:8px;background:#07121f;color:#e5f2ff;padding:7px 9px;font-size:10px;outline:none}.memo-container-log-filter:focus{border-color:#60a5fa}.memo-container-logs{max-height:330px;overflow:auto;padding:10px;border:1px solid #20354e;border-radius:10px;background:#050e18;color:#c6d7e8;font:10px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}.memo-container-refresh-time{margin-top:9px;color:#6f8baa;font-size:9px;text-align:right}
    @media(max-width:1050px){.memo-container-metrics{grid-template-columns:repeat(3,1fr)}.memo-container-meta{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){#memo-container-monitor-backdrop{padding:10px}.memo-container-monitor-head{flex-direction:column}.memo-container-monitor-actions{justify-content:flex-start}.memo-container-metrics,.memo-container-meta{grid-template-columns:1fr 1fr}.memo-container-log-filter{min-width:0;width:100%}}@media(max-width:430px){.memo-container-metrics,.memo-container-meta{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const backdrop = document.createElement('div');
  backdrop.id = 'memo-container-monitor-backdrop';
  backdrop.innerHTML = `
    <section class="memo-container-monitor" role="dialog" aria-modal="true" aria-labelledby="memo-container-monitor-title">
      <header class="memo-container-monitor-head">
        <div><small>${esc(t('title'))}</small><h2 id="memo-container-monitor-title">${esc(t('title'))}</h2><p id="memo-container-monitor-subtitle">${esc(t('subtitle'))}</p></div>
        <div class="memo-container-monitor-actions"><label class="memo-container-auto"><input id="memo-container-monitor-auto" type="checkbox" checked> ${esc(t('auto'))} · ${esc(t('every'))}</label><button class="memo-container-monitor-refresh" id="memo-container-monitor-refresh" type="button">↻ ${esc(t('refresh'))}</button><button class="memo-container-monitor-close" id="memo-container-monitor-close" type="button">${esc(t('close'))}</button></div>
      </header>
      <div class="memo-container-monitor-body" id="memo-container-monitor-body"><div class="memo-container-monitor-state">${esc(t('loading'))}</div></div>
    </section>`;
  document.body.appendChild(backdrop);

  const body = backdrop.querySelector('#memo-container-monitor-body');
  const refreshButton = backdrop.querySelector('#memo-container-monitor-refresh');
  const autoToggle = backdrop.querySelector('#memo-container-monitor-auto');
  let currentContainer = '';
  let currentData = null;
  let loading = false;

  const close = () => {
    backdrop.classList.remove('open');
    currentContainer = '';
    currentData = null;
  };

  const logText = () => Array.isArray(currentData?.logs) ? currentData.logs.join('\n') : '';
  const renderLogs = () => {
    const pre = backdrop.querySelector('#memo-container-logs');
    if (!pre || !currentData) return;
    const query = String(backdrop.querySelector('#memo-container-log-filter')?.value || '').trim().toLowerCase();
    const logs = Array.isArray(currentData.logs) ? currentData.logs : [];
    const filtered = query ? logs.filter(line => String(line).toLowerCase().includes(query)) : logs;
    pre.textContent = filtered.length ? filtered.join('\n') : t('noLogs');
  };

  const render = data => {
    currentData = data;
    const c = data.container || {};
    const s = data.stats && typeof data.stats === 'object' ? data.stats : {};
    const running = !!c.running;
    const health = c.health || t('noHealth');
    const healthClass = ['healthy'].includes(String(c.health || '').toLowerCase()) ? 'good' : ['unhealthy'].includes(String(c.health || '').toLowerCase()) ? 'bad' : '';
    const processes = Array.isArray(data.processes) ? data.processes : [];
    const ports = Array.isArray(c.ports) && c.ports.length ? c.ports.join(', ') : '—';
    const refreshed = new Date(Number(data.refreshed_at || 0) * 1000);
    const refreshedText = Number.isNaN(refreshed.getTime()) ? '—' : refreshed.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});

    backdrop.querySelector('#memo-container-monitor-title').textContent = `${t('title')} · ${c.name || currentContainer}`;
    body.innerHTML = `
      <div class="memo-container-monitor-state ${running ? 'ok' : ''}">${esc(c.name || currentContainer)} · ${esc(running ? t('running') : t('stopped'))}${c.error ? ` · ${esc(c.error)}` : ''}</div>
      <div class="memo-container-metrics">
        <div class="memo-container-metric ${running ? 'good' : 'bad'}"><small>${esc(t('status'))}</small><strong>${esc(running ? t('running') : t('stopped'))}</strong></div>
        <div class="memo-container-metric ${healthClass}"><small>${esc(t('health'))}</small><strong>${esc(health)}</strong></div>
        <div class="memo-container-metric cpu"><small>${esc(t('cpu'))}</small><strong>${esc(running ? cleanPercent(s.CPUPerc) : '—')}</strong></div>
        <div class="memo-container-metric mem"><small>${esc(t('memory'))}</small><strong>${esc(running ? cleanPercent(s.MemPerc) : '—')}</strong></div>
        <div class="memo-container-metric"><small>${esc(t('pids'))}</small><strong>${esc(running ? (s.PIDs || processes.length || '0') : '0')}</strong></div>
        <div class="memo-container-metric"><small>${esc(t('restarts'))}</small><strong>${esc(c.restart_count ?? 0)}</strong></div>
      </div>
      <div class="memo-container-meta">
        <div class="memo-container-kv"><small>${esc(t('memory'))}</small><strong>${esc(running ? (s.MemUsage || '—') : '—')}</strong></div>
        <div class="memo-container-kv"><small>${esc(t('network'))}</small><strong>${esc(running ? (s.NetIO || '—') : '—')}</strong></div>
        <div class="memo-container-kv"><small>${esc(t('block'))}</small><strong>${esc(running ? (s.BlockIO || '—') : '—')}</strong></div>
        <div class="memo-container-kv"><small>${esc(t('uptime'))}</small><strong>${esc(running ? age(c.started_at) : '—')}</strong></div>
        <div class="memo-container-kv"><small>${esc(t('image'))}</small><strong>${esc(c.image || '—')}</strong></div>
        <div class="memo-container-kv"><small>${esc(t('ports'))}</small><strong>${esc(ports)}</strong></div>
        <div class="memo-container-kv"><small>${esc(t('exitCode'))}</small><strong>${esc(c.exit_code ?? 0)}</strong></div>
        <div class="memo-container-kv"><small>ID</small><strong>${esc(String(c.id || '').slice(0, 12) || '—')}</strong></div>
      </div>
      <section class="memo-container-section"><div class="memo-container-section-head"><h3>${esc(t('processes'))}</h3></div>${processes.length ? `<div class="memo-container-scroll"><table class="memo-container-table"><thead><tr><th>${esc(t('pid'))}</th><th>${esc(t('process'))}</th><th>${esc(t('cpu'))}</th><th>${esc(t('memory'))}</th></tr></thead><tbody>${processes.map(p => `<tr><td>${esc(p.pid)}</td><td>${esc(p.command)}</td><td>${esc(p.cpu)}%</td><td>${esc(p.memory)}%</td></tr>`).join('')}</tbody></table></div>` : `<div class="memo-container-empty">${esc(t('noProcesses'))}</div>`}</section>
      <section class="memo-container-section"><div class="memo-container-section-head"><h3>${esc(t('logs'))}</h3><div class="memo-container-log-tools"><input class="memo-container-log-filter" id="memo-container-log-filter" type="search" placeholder="${esc(t('filter'))}"><button class="memo-container-monitor-copy" id="memo-container-monitor-copy" type="button">${esc(t('copy'))}</button></div></div><pre class="memo-container-logs" id="memo-container-logs"></pre></section>
      <div class="memo-container-refresh-time">${esc(t('lastRefresh'))}: ${esc(refreshedText)}</div>`;

    backdrop.querySelector('#memo-container-log-filter')?.addEventListener('input', renderLogs);
    backdrop.querySelector('#memo-container-monitor-copy')?.addEventListener('click', async event => {
      try {
        await navigator.clipboard.writeText(logText());
        const button = event.currentTarget;
        const original = button.textContent;
        button.textContent = t('copied');
        setTimeout(() => { if (button.isConnected) button.textContent = original; }, 1200);
      } catch (_error) {}
    });
    renderLogs();
  };

  const load = async (quiet = false) => {
    if (!currentContainer || loading) return;
    loading = true;
    refreshButton.disabled = true;
    refreshButton.textContent = `↻ ${t('refreshing')}`;
    if (!quiet && !currentData) body.innerHTML = `<div class="memo-container-monitor-state">${esc(t('loading'))}</div>`;
    try {
      const response = await fetch(`/memo-network/docker-monitor.cgi?container=${encodeURIComponent(currentContainer)}&_=${Date.now()}`, {cache:'no-store', credentials:'same-origin'});
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      render(data);
    } catch (error) {
      if (!quiet || !currentData) body.innerHTML = `<div class="memo-container-monitor-state error"><strong>${esc(t('failed'))}</strong><div style="margin-top:5px">${esc(error?.message || error)}</div></div>`;
    } finally {
      loading = false;
      refreshButton.disabled = false;
      refreshButton.textContent = `↻ ${t('refresh')}`;
    }
  };

  const open = container => {
    currentContainer = String(container || '').trim();
    if (!currentContainer) return;
    currentData = null;
    backdrop.classList.add('open');
    backdrop.querySelector('#memo-container-monitor-title').textContent = `${t('title')} · ${currentContainer}`;
    body.innerHTML = `<div class="memo-container-monitor-state">${esc(t('loading'))}</div>`;
    load(false);
  };

  const augmentButtons = () => {
    const root = document.getElementById('memo-service-detail') || detailPanel;
    if (!root) return;
    root.querySelectorAll('.memo-detail-actions').forEach(actions => {
      if (actions.querySelector('[data-memo-container-monitor="1"]')) return;
      const source = actions.querySelector('[data-container]');
      const container = source?.dataset?.container;
      if (!container) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'memo-action memo-container-monitor-btn';
      button.dataset.memoContainerMonitor = '1';
      button.dataset.container = container;
      button.textContent = `◉ ${t('monitor')}`;
      actions.appendChild(button);
    });
  };

  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-memo-container-monitor="1"]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    open(button.dataset.container);
  });
  backdrop.querySelector('#memo-container-monitor-close')?.addEventListener('click', close);
  backdrop.querySelector('#memo-container-monitor-refresh')?.addEventListener('click', () => load(false));
  backdrop.addEventListener('click', event => { if (event.target === backdrop) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && backdrop.classList.contains('open')) close(); });

  const observer = new MutationObserver(augmentButtons);
  observer.observe(servicesView, {childList:true, subtree:true});
  augmentButtons();
  setInterval(() => {
    if (backdrop.classList.contains('open') && autoToggle.checked && currentContainer && servicesView.classList.contains('active')) load(true);
  }, 5000);

  window.MemoNetworkV5ContainerMonitor = {open, refresh: () => load(false), scan: augmentButtons};
})();
