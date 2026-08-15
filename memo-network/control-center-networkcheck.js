(() => {
  if (window.MemoNetworkV5NetworkCheck) return;

  const view = document.getElementById('diagnostics');
  if (!view) return;

  const cookie = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
  const lang = cookie ? cookie[1].toLowerCase() : (document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
  const dict = {
    nl: {
      eyebrow:'Connectiviteit', title:'Netwerkcontrole', subtitle:'Controleer route, gateway, internet, DNS, packet loss en latency vanaf deze server.', start:'Netwerkcontrole starten', running:'Controle wordt uitgevoerd…', ready:'Klaar voor een nieuwe controle', never:'Nog geen netwerkcontrole uitgevoerd', failed:'Netwerkcontrole mislukt', score:'Netwerkscore', route:'Route', gateway:'Gateway', internet:'Internet', dns:'DNS', interface:'Interface', sourceIp:'Server-IP', latency:'Latency', packetLoss:'Packet loss', dnsServer:'Nameservers', resolved:'Opgelost naar', lastCheck:'Laatste controle', online:'Bereikbaar', offline:'Niet bereikbaar', healthy:'Gezond', attention:'Aandacht', noRoute:'Geen standaardroute gevonden', noDns:'Geen nameservers gevonden', manual:'De controle gebruikt alleen vaste diagnostische doelen en start uitsluitend handmatig.'
    },
    de: {
      eyebrow:'Konnektivität', title:'Netzwerkprüfung', subtitle:'Prüft Route, Gateway, Internet, DNS, Paketverlust und Latenz von diesem Server aus.', start:'Netzwerkprüfung starten', running:'Prüfung läuft…', ready:'Bereit für eine neue Prüfung', never:'Noch keine Netzwerkprüfung ausgeführt', failed:'Netzwerkprüfung fehlgeschlagen', score:'Netzwerkbewertung', route:'Route', gateway:'Gateway', internet:'Internet', dns:'DNS', interface:'Schnittstelle', sourceIp:'Server-IP', latency:'Latenz', packetLoss:'Paketverlust', dnsServer:'Nameserver', resolved:'Aufgelöst zu', lastCheck:'Letzte Prüfung', online:'Erreichbar', offline:'Nicht erreichbar', healthy:'Gesund', attention:'Achtung', noRoute:'Keine Standardroute gefunden', noDns:'Keine Nameserver gefunden', manual:'Die Prüfung verwendet ausschließlich feste Diagnoseziele und wird nur manuell gestartet.'
    },
    en: {
      eyebrow:'Connectivity', title:'Network check', subtitle:'Check route, gateway, internet, DNS, packet loss and latency from this server.', start:'Start network check', running:'Network check is running…', ready:'Ready for a new check', never:'No network check has been run yet', failed:'Network check failed', score:'Network score', route:'Route', gateway:'Gateway', internet:'Internet', dns:'DNS', interface:'Interface', sourceIp:'Server IP', latency:'Latency', packetLoss:'Packet loss', dnsServer:'Nameservers', resolved:'Resolved to', lastCheck:'Last check', online:'Reachable', offline:'Unreachable', healthy:'Healthy', attention:'Attention', noRoute:'No default route found', noDns:'No nameservers found', manual:'The check uses fixed diagnostic targets only and runs manually.'
    }
  };

  const t = (key) => dict[lang]?.[key] || dict.en[key] || key;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtTime = (epoch) => {
    const date = new Date(Number(epoch || 0) * 1000);
    return !epoch || Number.isNaN(date.getTime()) ? '—' : date.toLocaleString([], {dateStyle:'short', timeStyle:'medium'});
  };
  const yesNo = (value) => value ? t('online') : t('offline');

  const style = document.createElement('style');
  style.textContent = `
    .memo-netcheck{margin:0 0 12px;padding:15px;border:1px solid #2a4868;border-radius:15px;background:linear-gradient(145deg,#12243b,#0d1928);position:relative;overflow:hidden}
    .memo-netcheck.running{border-color:#3b82f6;box-shadow:0 0 0 1px rgba(59,130,246,.18)}
    .memo-netcheck.running:before{content:'';position:absolute;left:-35%;top:0;width:35%;height:2px;background:linear-gradient(90deg,transparent,#60a5fa,transparent);animation:memoNetCheckLine 1.45s linear infinite}
    @keyframes memoNetCheckLine{to{left:100%}}
    .memo-netcheck-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.memo-netcheck-head small{display:block;color:#7895b6;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.06em}.memo-netcheck-head h3{margin:3px 0 0;font-size:16px}.memo-netcheck-head p{margin:5px 0 0;color:#8ea6c2;font-size:11px}.memo-netcheck-btn{appearance:none;border:1px solid #3b82f6;border-radius:9px;background:#1d4ed8;color:#fff;padding:9px 12px;font-weight:850;cursor:pointer;white-space:nowrap}.memo-netcheck-btn:hover{background:#2563eb}.memo-netcheck-btn:disabled{opacity:.6;cursor:wait}
    .memo-netcheck-state{margin-top:12px;padding:10px 12px;border:1px solid #29415e;border-radius:11px;background:#0b1726;color:#9fb6ce;font-size:11px}.memo-netcheck-state.ok{border-color:#247653;background:#0d281f;color:#86efac}.memo-netcheck-state.warn{border-color:#725d28;background:#2a2312;color:#fde68a}.memo-netcheck-state.error{border-color:#7f3a49;background:#2a1520;color:#fecdd3}
    .memo-netcheck-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:11px}.memo-netcheck-card{padding:12px;border:1px solid #29415e;border-radius:12px;background:#0b1726;min-width:0}.memo-netcheck-card small{display:block;color:#7895b6;font-size:8px;font-weight:850;text-transform:uppercase;letter-spacing:.05em}.memo-netcheck-card strong{display:block;margin-top:5px;font-size:15px;overflow-wrap:anywhere}.memo-netcheck-card span{display:block;margin-top:4px;color:#8ea6c2;font-size:9px;overflow-wrap:anywhere}.memo-netcheck-card.ok strong{color:#86efac}.memo-netcheck-card.bad strong{color:#fca5a5}.memo-netcheck-score strong{font-size:23px;color:#7dd3fc}
    .memo-netcheck-details{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:9px}.memo-netcheck-kv{padding:10px;border:1px solid #263d59;border-radius:10px;background:#0b1726;min-width:0}.memo-netcheck-kv small{display:block;color:#7895b6;font-size:8px;text-transform:uppercase;font-weight:800}.memo-netcheck-kv strong{display:block;margin-top:4px;color:#dcecff;font-size:10px;overflow-wrap:anywhere}.memo-netcheck-note{margin-top:9px;color:#7189a5;font-size:10px}
    @media(max-width:1000px){.memo-netcheck-summary,.memo-netcheck-details{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.memo-netcheck-head{flex-direction:column}.memo-netcheck-summary,.memo-netcheck-details{grid-template-columns:1fr}.memo-netcheck-btn{width:100%}}
  `;
  document.head.appendChild(style);

  let result = null;
  let route = null;
  let nameservers = [];
  let running = false;
  let error = '';
  let loaded = false;

  const root = () => document.getElementById('memo-v5-diagnostics');

  const state = () => {
    if (running) return {cls:'', text:t('running')};
    if (error) return {cls:'error', text:`${t('failed')}: ${error}`};
    if (!result) return {cls:'', text:t('never')};
    const score = Number(result.score || 0);
    return {cls:score >= 90 ? 'ok' : 'warn', text:score >= 90 ? t('ready') : t('attention')};
  };

  const card = (label, value, sub, ok) => `<div class="memo-netcheck-card ${ok === true ? 'ok' : ok === false ? 'bad' : ''}"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(sub || '')}</span></div>`;

  const renderPanel = () => {
    const host = root();
    if (!host) return;
    let panel = host.querySelector('#memo-network-check-panel');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'memo-network-check-panel';
      panel.className = 'memo-netcheck';
      const summary = host.querySelector('.memo-diag-summary');
      if (summary?.nextSibling) summary.parentNode.insertBefore(panel, summary.nextSibling);
      else if (summary) summary.parentNode.appendChild(panel);
      else host.prepend(panel);
    }

    panel.classList.toggle('running', running);
    const status = state();
    const routeInfo = result || route || {};
    const internet = result?.internet || {};
    const dns = result?.dns || {};
    const gatewayTest = result?.gateway_test || {};
    const score = result ? Number(result.score || 0) : null;
    const ns = result?.nameservers || nameservers || [];

    panel.innerHTML = `
      <div class="memo-netcheck-head"><div><small>${esc(t('eyebrow'))}</small><h3>${esc(t('title'))}</h3><p>${esc(t('subtitle'))}</p></div><button class="memo-netcheck-btn" id="memo-network-check-start" type="button" ${running ? 'disabled' : ''}>${esc(running ? t('running') : t('start'))}</button></div>
      <div class="memo-netcheck-state ${status.cls}">${esc(status.text)}</div>
      <div class="memo-netcheck-summary">
        <div class="memo-netcheck-card memo-netcheck-score"><small>${esc(t('score'))}</small><strong>${score == null ? '—' : `${score}/100`}</strong><span>${esc(score == null ? t('never') : score >= 90 ? t('healthy') : t('attention'))}</span></div>
        ${card(t('route'), routeInfo.interface || '—', routeInfo.gateway ? `${t('gateway')}: ${routeInfo.gateway}` : t('noRoute'), result ? !!result.route_ok : undefined)}
        ${card(t('internet'), result ? yesNo(!!internet.ok) : '—', internet.latency_ms != null ? `${t('latency')}: ${internet.latency_ms} ms · ${t('packetLoss')}: ${internet.packet_loss_percent ?? '—'}%` : '', result ? !!internet.ok : undefined)}
        ${card(t('dns'), result ? yesNo(!!dns.ok) : '—', dns.address ? `${t('resolved')}: ${dns.address}` : '', result ? !!dns.ok : undefined)}
      </div>
      <div class="memo-netcheck-details">
        <div class="memo-netcheck-kv"><small>${esc(t('interface'))}</small><strong>${esc(routeInfo.interface || '—')}</strong></div>
        <div class="memo-netcheck-kv"><small>${esc(t('sourceIp'))}</small><strong>${esc(routeInfo.source_ip || routeInfo.source || '—')}</strong></div>
        <div class="memo-netcheck-kv"><small>${esc(t('gateway'))}</small><strong>${esc(routeInfo.gateway || '—')}${gatewayTest.latency_ms != null ? ` · ${esc(gatewayTest.latency_ms)} ms` : ''}</strong></div>
        <div class="memo-netcheck-kv"><small>${esc(t('dnsServer'))}</small><strong>${esc(ns.length ? ns.join(' · ') : t('noDns'))}</strong></div>
        <div class="memo-netcheck-kv"><small>${esc(t('lastCheck'))}</small><strong>${esc(result?.tested_at ? fmtTime(result.tested_at) : '—')}</strong></div>
        <div class="memo-netcheck-kv"><small>${esc(t('latency'))}</small><strong>${internet.latency_ms != null ? `${esc(internet.latency_ms)} ms` : '—'}</strong></div>
        <div class="memo-netcheck-kv"><small>${esc(t('packetLoss'))}</small><strong>${internet.packet_loss_percent != null ? `${esc(internet.packet_loss_percent)}%` : '—'}</strong></div>
        <div class="memo-netcheck-kv"><small>${esc(t('gateway'))} ${esc(t('packetLoss').toLowerCase())}</small><strong>${gatewayTest.packet_loss_percent != null ? `${esc(gatewayTest.packet_loss_percent)}%` : '—'}</strong></div>
      </div>
      <div class="memo-netcheck-note">${esc(t('manual'))}</div>`;
    panel.querySelector('#memo-network-check-start')?.addEventListener('click', runCheck);
  };

  const loadStatus = async () => {
    if (running) return;
    try {
      const response = await fetch(`/memo-network/network-check.cgi?_=${Date.now()}`, {cache:'no-store', credentials:'same-origin'});
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      result = data.result || result;
      route = data.route || route;
      nameservers = Array.isArray(data.nameservers) ? data.nameservers : nameservers;
      error = '';
    } catch (err) {
      error = err?.message || String(err);
    } finally {
      loaded = true;
      renderPanel();
    }
  };

  async function runCheck() {
    if (running) return;
    running = true;
    error = '';
    renderPanel();
    try {
      const response = await fetch(`/memo-network/network-check.cgi?_=${Date.now()}`, {
        method:'POST', credentials:'same-origin', cache:'no-store', headers:{'X-Requested-With':'MemoNetwork'}
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      result = data.result || result;
      route = result || route;
      nameservers = Array.isArray(result?.nameservers) ? result.nameservers : nameservers;
      error = '';
    } catch (err) {
      error = err?.message || String(err);
    } finally {
      running = false;
      renderPanel();
    }
  }

  const observer = new MutationObserver(() => {
    if (loaded && !document.getElementById('memo-network-check-panel')) renderPanel();
  });
  const diagRoot = root();
  if (diagRoot) observer.observe(diagRoot, {childList:true});
  renderPanel();
  loadStatus();
  setInterval(() => { if (!running && view.classList.contains('active')) loadStatus(); }, 30000);

  window.MemoNetworkV5NetworkCheck = {refresh: loadStatus, run: runCheck};
})();
