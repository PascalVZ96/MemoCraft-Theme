(() => {
  if (window.MemoNetworkV5ServiceDetails) return;

  const cookie = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
  const lang = cookie ? cookie[1].toLowerCase() : (document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
  const dict = {
    nl: {
      hint:'Klik voor details', close:'Sluiten', status:'Status', running:'Actief', stopped:'Gestopt', image:'Image', ports:'Poorten', container:'Container', containers:'Containers', instances:'Instances', module:'Module', panelPort:'Paneelpoort', peers:'Peers', endpoint:'Endpoint', allowedIps:'Allowed IPs', lastHandshake:'Laatste handshake', received:'Ontvangen', sent:'Verzonden', mode:'Modus', noItems:'Geen details beschikbaar', secondsAgo:'sec geleden', minutesAgo:'min geleden', hoursAgo:'uur geleden',
      start:'Starten', stop:'Stoppen', restart:'Herstarten', openAmp:'AMP openen', networkManage:'Netwerkbeheer', manage:'Beheer', working:'Actie uitvoeren…', success:'Actie uitgevoerd', failed:'Actie mislukt', stopConfirm:'Weet je zeker dat je deze container wilt stoppen?', restartConfirm:'Container nu herstarten?'
    },
    de: {
      hint:'Für Details klicken', close:'Schließen', status:'Status', running:'Aktiv', stopped:'Gestoppt', image:'Image', ports:'Ports', container:'Container', containers:'Container', instances:'Instanzen', module:'Modul', panelPort:'Panel-Port', peers:'Peers', endpoint:'Endpunkt', allowedIps:'Erlaubte IPs', lastHandshake:'Letzter Handshake', received:'Empfangen', sent:'Gesendet', mode:'Modus', noItems:'Keine Details verfügbar', secondsAgo:'Sek. zuvor', minutesAgo:'Min. zuvor', hoursAgo:'Std. zuvor',
      start:'Starten', stop:'Stoppen', restart:'Neu starten', openAmp:'AMP öffnen', networkManage:'Netzwerkverwaltung', manage:'Verwaltung', working:'Aktion wird ausgeführt…', success:'Aktion ausgeführt', failed:'Aktion fehlgeschlagen', stopConfirm:'Diesen Container wirklich stoppen?', restartConfirm:'Container jetzt neu starten?'
    },
    en: {
      hint:'Click for details', close:'Close', status:'Status', running:'Running', stopped:'Stopped', image:'Image', ports:'Ports', container:'Container', containers:'Containers', instances:'Instances', module:'Module', panelPort:'Panel port', peers:'Peers', endpoint:'Endpoint', allowedIps:'Allowed IPs', lastHandshake:'Last handshake', received:'Received', sent:'Sent', mode:'Mode', noItems:'No details available', secondsAgo:'sec ago', minutesAgo:'min ago', hoursAgo:'hr ago',
      start:'Start', stop:'Stop', restart:'Restart', openAmp:'Open AMP', networkManage:'Network management', manage:'Management', working:'Running action…', success:'Action completed', failed:'Action failed', stopConfirm:'Are you sure you want to stop this container?', restartConfirm:'Restart this container now?'
    }
  };
  const t = (key) => dict[lang]?.[key] || dict.en[key] || key;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bytes = (value) => {
    let n = Number(value || 0);
    if (n >= 1073741824) return `${(n / 1073741824).toFixed(2)} GiB`;
    if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MiB`;
    if (n >= 1024) return `${(n / 1024).toFixed(1)} KiB`;
    return `${Math.round(n)} B`;
  };
  const age = (seconds) => {
    const n = Number(seconds);
    if (!Number.isFinite(n) || n < 0) return '—';
    if (n < 60) return `${Math.round(n)} ${t('secondsAgo')}`;
    if (n < 3600) return `${Math.round(n / 60)} ${t('minutesAgo')}`;
    return `${Math.round(n / 3600)} ${t('hoursAgo')}`;
  };

  const style = document.createElement('style');
  style.textContent = `
    #services-grid .service.memo-clickable{cursor:pointer;transition:border-color .16s,background .16s,transform .16s;outline:none;position:relative;padding-bottom:34px}
    #services-grid .service.memo-clickable:hover,#services-grid .service.memo-clickable:focus-visible{border-color:#60a5fa;background:#10233a;transform:translateY(-1px)}
    #services-grid .service.memo-clickable.selected{border-color:#3b82f6;box-shadow:0 0 0 1px rgba(59,130,246,.28)}
    .memo-service-hint{position:absolute;left:13px;bottom:11px;color:#7db9e8;font-size:10px;font-weight:750}
    #memo-service-detail{margin-top:12px;border:1px solid #31506f;border-radius:14px;background:#0b1726;padding:15px;display:none}
    #memo-service-detail.open{display:block}
    .memo-detail-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}
    .memo-detail-head h3{margin:0;font-size:16px}.memo-detail-close{border:1px solid #315776;background:#10233a;color:#c9e8ff;border-radius:8px;padding:7px 10px;cursor:pointer;font-weight:750}
    .memo-detail-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.memo-detail-card{border:1px solid #263d59;background:#0d1b2c;border-radius:11px;padding:11px;min-width:0}.memo-detail-card small{display:block;color:#7895b6;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.05em}.memo-detail-card strong{display:block;margin-top:5px;overflow-wrap:anywhere}
    .memo-detail-list{margin-top:11px;display:grid;gap:8px}.memo-detail-row{border:1px solid #263d59;background:#0d1b2c;border-radius:11px;padding:11px}.memo-detail-row .title{font-weight:850;margin-bottom:7px}.memo-detail-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;color:#9fb6ce;font-size:11px}.memo-detail-meta b{color:#dcecff;font-weight:750}.memo-state-online{color:#86efac}.memo-state-offline{color:#fca5a5}
    .memo-detail-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.memo-action{appearance:none;border:1px solid #315776;border-radius:8px;background:#10233a;color:#c9e8ff;padding:7px 10px;font-size:10px;font-weight:800;cursor:pointer;text-decoration:none!important}.memo-action:hover{border-color:#60a5fa;background:#133052}.memo-action.primary{background:#1d4ed8;border-color:#3b82f6;color:#fff}.memo-action.danger{border-color:#7f3a49;color:#fecdd3;background:#2a1520}.memo-action:disabled{opacity:.55;cursor:wait}.memo-action-status{display:none;margin:0 0 11px;padding:9px 11px;border:1px solid #31506f;border-radius:9px;background:#10233a;color:#bfdbfe;font-size:11px}.memo-action-status.show{display:block}.memo-action-status.ok{border-color:#247653;background:#0d281f;color:#86efac}.memo-action-status.error{border-color:#7f3a49;background:#2a1520;color:#fecdd3}
    @media(max-width:850px){.memo-detail-grid,.memo-detail-meta{grid-template-columns:1fr 1fr}}@media(max-width:600px){.memo-detail-grid,.memo-detail-meta{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const servicesView = document.getElementById('services');
  const grid = document.getElementById('services-grid');
  if (!servicesView || !grid) return;

  const panel = document.createElement('section');
  panel.id = 'memo-service-detail';
  panel.innerHTML = '<div class="memo-detail-head"><h3 id="memo-detail-title">Details</h3><button class="memo-detail-close" type="button"></button></div><div class="memo-action-status" id="memo-action-status"></div><div id="memo-detail-body"></div>';
  grid.parentElement.appendChild(panel);
  panel.querySelector('.memo-detail-close').textContent = t('close');

  let latest = null;
  let selected = '';
  let actionBusy = false;

  const keyFromCard = (card) => {
    const name = String(card.querySelector('h3')?.textContent || '').trim().toLowerCase();
    if (name.includes('wireguard')) return 'wireguard';
    if (name.includes('minio')) return 'minio';
    if (name.includes('docker')) return 'docker';
    if (name === 'amp') return 'amp';
    return '';
  };

  const label = (key) => key === 'wireguard' ? 'WireGuard' : key === 'minio' ? 'MinIO' : key === 'docker' ? 'Docker' : 'AMP';
  const stateHtml = (running) => `<span class="${running ? 'memo-state-online' : 'memo-state-offline'}">${running ? t('running') : t('stopped')}</span>`;
  const dockerActions = (item) => {
    const name = esc(item.name || '');
    if (!name) return '';
    if (item.running) {
      return `<div class="memo-detail-actions"><button class="memo-action primary" type="button" data-docker-action="restart" data-container="${name}">${t('restart')}</button><button class="memo-action danger" type="button" data-docker-action="stop" data-container="${name}">${t('stop')}</button></div>`;
    }
    return `<div class="memo-detail-actions"><button class="memo-action primary" type="button" data-docker-action="start" data-container="${name}">${t('start')}</button></div>`;
  };

  const renderDocker = (d) => {
    const items = Array.isArray(d.docker?.items) ? d.docker.items : [];
    let html = `<div class="memo-detail-grid"><div class="memo-detail-card"><small>${t('running')}</small><strong>${d.docker?.running || 0}/${d.docker?.total || 0}</strong></div><div class="memo-detail-card"><small>${t('containers')}</small><strong>${items.length}</strong></div><div class="memo-detail-card"><small>${t('status')}</small><strong>${stateHtml(!!d.services?.docker)}</strong></div></div>`;
    if (!items.length) return html + `<div class="memo-detail-list"><div class="memo-detail-row">${t('noItems')}</div></div>`;
    html += '<div class="memo-detail-list">';
    items.forEach(item => {
      html += `<div class="memo-detail-row"><div class="title">${esc(item.name || item.id || 'container')} · ${stateHtml(!!item.running)}</div><div class="memo-detail-meta"><div><b>${t('image')}:</b> ${esc(item.image || '—')}</div><div><b>${t('status')}:</b> ${esc(item.status || item.state || '—')}</div><div><b>${t('ports')}:</b> ${esc(item.ports || '—')}</div></div>${dockerActions(item)}</div>`;
    });
    return html + '</div>';
  };

  const renderAmp = (d) => {
    const items = Array.isArray(d.amp?.items) ? d.amp.items : [];
    let html = `<div class="memo-detail-grid"><div class="memo-detail-card"><small>${t('running')}</small><strong>${d.amp?.running || 0}/${d.amp?.total || 0}</strong></div><div class="memo-detail-card"><small>${t('instances')}</small><strong>${items.length}</strong></div><div class="memo-detail-card"><small>${t('status')}</small><strong>${stateHtml(!!d.services?.amp)}</strong></div></div>`;
    if (!items.length) html += `<div class="memo-detail-list"><div class="memo-detail-row">${t('noItems')}</div></div>`;
    else {
      html += '<div class="memo-detail-list">';
      items.forEach(item => {
        html += `<div class="memo-detail-row"><div class="title">${esc(item.name || 'AMP')} · ${stateHtml(!!item.running)}</div><div class="memo-detail-meta"><div><b>${t('module')}:</b> ${esc(item.module || '—')}</div><div><b>${t('panelPort')}:</b> ${esc(item.port || '—')}</div><div><b>${t('status')}:</b> ${stateHtml(!!item.running)}</div></div></div>`;
      });
      html += '</div>';
    }
    return html + `<div class="memo-detail-actions"><a class="memo-action primary" href="https://amp.memocraft.nl" target="_blank" rel="noopener noreferrer">${t('openAmp')}</a></div>`;
  };

  const renderMinio = (d) => {
    const m = d.minio || {};
    const item = (Array.isArray(d.docker?.items) ? d.docker.items : []).find(x => x.name === m.container) || {name:m.container, running:!!d.services?.minio};
    return `<div class="memo-detail-grid"><div class="memo-detail-card"><small>${t('status')}</small><strong>${stateHtml(!!d.services?.minio)}</strong></div><div class="memo-detail-card"><small>${t('mode')}</small><strong>${esc(m.mode || '—')}</strong></div><div class="memo-detail-card"><small>${t('container')}</small><strong>${esc(m.container || '—')}</strong></div><div class="memo-detail-card"><small>${t('status')}</small><strong>${esc(m.status || '—')}</strong></div><div class="memo-detail-card"><small>${t('ports')}</small><strong>${esc(m.ports || '—')}</strong></div><div class="memo-detail-card"><small>ID</small><strong>${esc(m.container_id || '—')}</strong></div></div>${m.mode === 'docker' && m.container ? dockerActions(item) : ''}`;
  };

  const renderWireguard = (d) => {
    const w = d.wireguard || {};
    const items = Array.isArray(w.items) ? w.items : [];
    let html = `<div class="memo-detail-grid"><div class="memo-detail-card"><small>${t('status')}</small><strong>${stateHtml(!!d.services?.wireguard)}</strong></div><div class="memo-detail-card"><small>Interface</small><strong>${esc(w.interface || 'wg0')}</strong></div><div class="memo-detail-card"><small>${t('peers')}</small><strong>${w.peers || 0}</strong></div></div>`;
    if (!items.length) html += `<div class="memo-detail-list"><div class="memo-detail-row">${t('noItems')}</div></div>`;
    else {
      html += '<div class="memo-detail-list">';
      items.forEach((item, index) => {
        html += `<div class="memo-detail-row"><div class="title">Peer ${index + 1}</div><div class="memo-detail-meta"><div><b>${t('endpoint')}:</b> ${esc(item.endpoint || '—')}</div><div><b>${t('allowedIps')}:</b> ${esc(item.allowed_ips || '—')}</div><div><b>${t('lastHandshake')}:</b> ${age(item.handshake_age_seconds)}</div><div><b>${t('received')}:</b> ${bytes(item.rx_bytes)}</div><div><b>${t('sent')}:</b> ${bytes(item.tx_bytes)}</div><div><b>Keepalive:</b> ${esc(item.keepalive_seconds || 0)}s</div></div></div>`;
      });
      html += '</div>';
    }
    return html + `<div class="memo-detail-actions"><a class="memo-action" href="/net/index.cgi">${t('networkManage')}</a></div>`;
  };

  const fixAmpLinks = () => {
    document.querySelectorAll('a[href^="https://amp.memocraft.nl"]').forEach(link => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
  };

  const renderSelected = () => {
    if (!selected || !latest) return;
    panel.classList.add('open');
    panel.querySelector('#memo-detail-title').textContent = `${label(selected)} · Details`;
    const body = panel.querySelector('#memo-detail-body');
    body.innerHTML = selected === 'docker' ? renderDocker(latest) : selected === 'amp' ? renderAmp(latest) : selected === 'minio' ? renderMinio(latest) : renderWireguard(latest);
    fixAmpLinks();
    grid.querySelectorAll('.service').forEach(card => card.classList.toggle('selected', keyFromCard(card) === selected));
  };

  const setActionStatus = (kind, message) => {
    const status = panel.querySelector('#memo-action-status');
    status.className = `memo-action-status show${kind ? ` ${kind}` : ''}`;
    status.textContent = message;
  };

  const runDockerAction = async (operation, container, button) => {
    if (actionBusy || !operation || !container) return;
    if (operation === 'stop' && !window.confirm(t('stopConfirm'))) return;
    if (operation === 'restart' && !window.confirm(t('restartConfirm'))) return;
    actionBusy = true;
    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = t('working');
    setActionStatus('', `${t('working')} ${container}`);
    try {
      const url = `/memo-network/system-info.cgi?action=docker&operation=${encodeURIComponent(operation)}&container=${encodeURIComponent(container)}`;
      const response = await fetch(url, {method:'POST', credentials:'same-origin', cache:'no-store', headers:{'X-Requested-With':'MemoNetwork'}});
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      setActionStatus('ok', `${t('success')}: ${container}`);
      await refresh();
    } catch (error) {
      setActionStatus('error', `${t('failed')}: ${error?.message || error}`);
    } finally {
      actionBusy = false;
      button.disabled = false;
      button.textContent = oldText;
    }
  };

  const enhanceCards = () => {
    grid.querySelectorAll('.service').forEach(card => {
      const key = keyFromCard(card);
      if (!key || card.dataset.memoDetailsReady === '1') return;
      card.dataset.memoDetailsReady = '1';
      card.classList.add('memo-clickable');
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `${label(key)} - ${t('hint')}`);
      const hint = document.createElement('span');
      hint.className = 'memo-service-hint';
      hint.textContent = t('hint');
      card.appendChild(hint);
      const open = () => { selected = key; renderSelected(); panel.scrollIntoView({behavior:'smooth', block:'nearest'}); };
      card.addEventListener('click', open);
      card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
    });
  };

  panel.querySelector('.memo-detail-close').addEventListener('click', () => {
    selected = '';
    panel.classList.remove('open');
    panel.querySelector('#memo-action-status').className = 'memo-action-status';
    grid.querySelectorAll('.service').forEach(card => card.classList.remove('selected'));
  });

  panel.addEventListener('click', event => {
    const button = event.target.closest('[data-docker-action]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    runDockerAction(button.dataset.dockerAction, button.dataset.container, button);
  });

  const refresh = async () => {
    try {
      const response = await fetch(`/memo-network/live-stats.cgi?service_details=1&_=${Date.now()}`, {cache:'no-store', credentials:'same-origin'});
      if (!response.ok) return;
      latest = await response.json();
      enhanceCards();
      renderSelected();
      fixAmpLinks();
    } catch (_error) {}
  };

  const observer = new MutationObserver(() => {
    enhanceCards();
    fixAmpLinks();
  });
  observer.observe(document.documentElement, {childList:true, subtree:true});
  enhanceCards();
  fixAmpLinks();
  refresh();
  setInterval(refresh, 2500);

  document.querySelector('.pill.dev')?.replaceChildren(document.createTextNode('v5.0.0 alpha7'));
  const footer = document.querySelector('.footer');
  if (footer) footer.textContent = 'MemoNetwork v5 Control Center · alpha7 preview';

  window.MemoNetworkV5ServiceDetails = { refresh };
})();
