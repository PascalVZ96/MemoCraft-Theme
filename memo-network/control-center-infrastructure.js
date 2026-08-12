(() => {
  if (window.MemoNetworkV5Infrastructure) return;

  const view = document.getElementById('infrastructure');
  if (!view) return;

  const cookie = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
  const lang = cookie ? cookie[1].toLowerCase() : (document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
  const dict = {
    nl: {
      eyebrow:'Live infrastructuur', title:'Infrastructuur', subtitle:'Opslag, mounts, serveridentiteit en platformstatus in één overzicht', refresh:'Vernieuwen', refreshing:'Vernieuwen…', lastUpdate:'Laatste update', storageHealth:'Opslagstatus', healthy:'Gezond', attention:'Aandacht', filesystems:'Bestandssystemen', backup:'Backup HDD', mounted:'Correct gemount', notMounted:'Niet correct gemount', systemDisk:'Systeemschijf', used:'gebruikt', free:'vrij', total:'totaal', device:'Apparaat', filesystem:'Bestandssysteem', mountpoint:'Mountpoint', server:'Server', hostname:'Hostnaam', operatingSystem:'Besturingssysteem', kernel:'Kernel', processor:'Processor', cores:'cores', uptime:'Uptime', processes:'Processen', temperature:'Temperatuur', platform:'Platformlaag', servicesOnline:'services online', network:'Netwerk', reboot:'Herstart vereist', yes:'Ja', no:'Nee', updates:'Updates beschikbaar', tools:'Beheer', disks:'Schijven beheren', networkManage:'Netwerkbeheer', systemInfo:'Systeeminformatie', updatesOpen:'Updates openen', backupWarning:'De backupmap staat niet op een apart bestandssysteem. Controleer de mount voordat backups worden uitgevoerd.', storageWarning:'Een bestandssysteem gebruikt 85% of meer van de beschikbare ruimte.', noDisks:'Geen bestandssystemen gevonden', failedLoad:'Infrastructuurgegevens konden niet worden geladen'
    },
    de: {
      eyebrow:'Live-Infrastruktur', title:'Infrastruktur', subtitle:'Speicher, Mounts, Serveridentität und Plattformstatus in einer Übersicht', refresh:'Aktualisieren', refreshing:'Aktualisieren…', lastUpdate:'Letzte Aktualisierung', storageHealth:'Speicherstatus', healthy:'Gesund', attention:'Achtung', filesystems:'Dateisysteme', backup:'Backup-HDD', mounted:'Korrekt eingehängt', notMounted:'Nicht korrekt eingehängt', systemDisk:'Systemlaufwerk', used:'belegt', free:'frei', total:'gesamt', device:'Gerät', filesystem:'Dateisystem', mountpoint:'Mountpoint', server:'Server', hostname:'Hostname', operatingSystem:'Betriebssystem', kernel:'Kernel', processor:'Prozessor', cores:'Kerne', uptime:'Betriebszeit', processes:'Prozesse', temperature:'Temperatur', platform:'Plattformebene', servicesOnline:'Dienste online', network:'Netzwerk', reboot:'Neustart erforderlich', yes:'Ja', no:'Nein', updates:'Updates verfügbar', tools:'Verwaltung', disks:'Datenträger verwalten', networkManage:'Netzwerkverwaltung', systemInfo:'Systeminformationen', updatesOpen:'Updates öffnen', backupWarning:'Der Backup-Ordner liegt nicht auf einem separaten Dateisystem. Prüfe den Mount vor dem nächsten Backup.', storageWarning:'Ein Dateisystem verwendet mindestens 85 % des verfügbaren Speicherplatzes.', noDisks:'Keine Dateisysteme gefunden', failedLoad:'Infrastrukturdaten konnten nicht geladen werden'
    },
    en: {
      eyebrow:'Live infrastructure', title:'Infrastructure', subtitle:'Storage, mounts, server identity and platform status in one overview', refresh:'Refresh', refreshing:'Refreshing…', lastUpdate:'Last update', storageHealth:'Storage health', healthy:'Healthy', attention:'Attention', filesystems:'Filesystems', backup:'Backup HDD', mounted:'Mounted correctly', notMounted:'Not mounted correctly', systemDisk:'System disk', used:'used', free:'free', total:'total', device:'Device', filesystem:'Filesystem', mountpoint:'Mountpoint', server:'Server', hostname:'Hostname', operatingSystem:'Operating system', kernel:'Kernel', processor:'Processor', cores:'cores', uptime:'Uptime', processes:'Processes', temperature:'Temperature', platform:'Platform layer', servicesOnline:'services online', network:'Network', reboot:'Reboot required', yes:'Yes', no:'No', updates:'Updates available', tools:'Management', disks:'Manage disks', networkManage:'Network management', systemInfo:'System information', updatesOpen:'Open updates', backupWarning:'The backup directory is not on a separate filesystem. Check the mount before running backups.', storageWarning:'A filesystem is using 85% or more of its available capacity.', noDisks:'No filesystems found', failedLoad:'Infrastructure data could not be loaded'
    }
  };

  const t = (key) => dict[lang]?.[key] || dict.en[key] || key;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pct = (value) => Math.min(100, Math.max(0, Number(value || 0)));
  const size = (gib) => {
    const n = Number(gib || 0);
    return n >= 1024 ? `${(n / 1024).toFixed(2)} TiB` : `${n.toFixed(n >= 100 ? 0 : 2)} GiB`;
  };
  const uptime = (seconds) => {
    let s = Math.max(0, Number(seconds || 0));
    const d = Math.floor(s / 86400); s %= 86400;
    const h = Math.floor(s / 3600); s %= 3600;
    const m = Math.floor(s / 60);
    if (lang === 'de') return d ? `${d} T., ${h} Std., ${m} Min.` : `${h} Std., ${m} Min.`;
    if (lang === 'nl') return d ? `${d} d, ${h} u, ${m} min` : `${h} u, ${m} min`;
    return d ? `${d} d, ${h} h, ${m} min` : `${h} h, ${m} min`;
  };

  const style = document.createElement('style');
  style.textContent = `
    #infrastructure>.section{display:none!important}
    #memo-v5-infrastructure{display:block}
    .memo-infra-head{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:16px;border:1px solid #263d59;border-radius:16px;background:linear-gradient(145deg,#13233a,#0d1928)}
    .memo-infra-head small,.memo-infra-card small,.memo-infra-kv small{display:block;color:#7895b6;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.06em}.memo-infra-head h2{margin:3px 0 0;font-size:20px}.memo-infra-head p{margin:5px 0 0;color:#8ea6c2;font-size:11px}.memo-infra-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.memo-infra-time{color:#7895b6;font-size:10px}.memo-infra-btn{appearance:none;border:1px solid #315776;border-radius:9px;background:#10233a;color:#c9e8ff;padding:8px 11px;font-weight:800;cursor:pointer}.memo-infra-btn:hover{border-color:#60a5fa;background:#133052}.memo-infra-btn:disabled{opacity:.6;cursor:wait}
    .memo-infra-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}.memo-infra-card{padding:13px;border:1px solid #29415e;border-radius:13px;background:#0b1726;min-width:0}.memo-infra-card strong{display:block;margin-top:6px;font-size:16px;overflow-wrap:anywhere}.memo-infra-card span{display:block;margin-top:4px;color:#8ea6c2;font-size:10px}.memo-infra-card.ok strong{color:#86efac}.memo-infra-card.bad{border-color:#7f3a49;background:#251622}.memo-infra-card.bad strong{color:#fca5a5}
    .memo-infra-panel{margin-top:12px;padding:15px;border:1px solid #263d59;border-radius:15px;background:linear-gradient(145deg,#122136,#0d1928)}.memo-infra-panelhead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:11px}.memo-infra-panelhead h3{margin:0;font-size:15px}.memo-infra-panelhead a{color:#8fd3ff;text-decoration:none;font-size:10px}
    .memo-disk-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.memo-disk{padding:14px;border:1px solid #29415e;border-radius:13px;background:#0b1726;min-width:0}.memo-disk.warn{border-color:#725d28}.memo-disk-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.memo-disk-head strong{font-size:14px}.memo-disk-badge{padding:4px 7px;border-radius:999px;border:1px solid #315776;color:#9bdcff;font-size:9px;font-weight:800}.memo-disk.warn .memo-disk-badge{border-color:#725d28;color:#fcd34d}.memo-disk-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:11px}.memo-disk-kv{min-width:0}.memo-disk-kv small{display:block;color:#7895b6;font-size:8px;text-transform:uppercase;font-weight:800}.memo-disk-kv span{display:block;margin-top:3px;color:#dcecff;font-size:10px;overflow-wrap:anywhere}.memo-disk-capacity{margin-top:11px;color:#9fb6ce;font-size:10px}.memo-infra-bar{height:7px;border-radius:99px;background:#07111d;margin-top:7px;overflow:hidden}.memo-infra-bar span{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#34d399,#38bdf8)}.memo-disk.warn .memo-infra-bar span{background:linear-gradient(90deg,#f59e0b,#fbbf24)}
    .memo-infra-warning{margin-top:12px;padding:12px;border:1px solid #7f3a49;border-radius:12px;background:#2a1520;color:#fecdd3;font-size:11px}.memo-infra-warning.amber{border-color:#725d28;background:#2a2312;color:#fde68a}
    .memo-infra-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:12px}.memo-infra-kvgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.memo-infra-kv{padding:11px;border:1px solid #263d59;border-radius:11px;background:#0b1726;min-width:0}.memo-infra-kv strong{display:block;margin-top:5px;overflow-wrap:anywhere}.memo-service-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.memo-service-chip{padding:11px;border:1px solid #29415e;border-radius:11px;background:#0b1726}.memo-service-chip b{display:flex;align-items:center;gap:7px}.memo-service-chip b:before{content:'';width:7px;height:7px;border-radius:50%;background:#64748b}.memo-service-chip.online b:before{background:#22c55e;box-shadow:0 0 8px rgba(34,197,94,.55)}.memo-service-chip span{display:block;margin-top:4px;color:#8ea6c2;font-size:10px}.memo-infra-links{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.memo-infra-links a{display:block;padding:12px;border:1px solid #29415e;border-radius:11px;background:#0b1726;color:#c9e8ff;text-decoration:none;font-weight:750}.memo-infra-links a:hover{border-color:#60a5fa;background:#10233a}.memo-infra-error{margin-top:12px;padding:14px;border:1px solid #7f3a49;border-radius:12px;background:#2a1520;color:#fecdd3}
    @media(max-width:1050px){.memo-infra-summary,.memo-service-strip,.memo-infra-links{grid-template-columns:repeat(2,1fr)}.memo-infra-grid{grid-template-columns:1fr}}@media(max-width:750px){.memo-disk-grid{grid-template-columns:1fr}.memo-disk-meta{grid-template-columns:1fr 1fr}}@media(max-width:600px){.memo-infra-head{align-items:flex-start;flex-direction:column}.memo-infra-actions{justify-content:flex-start}.memo-infra-summary,.memo-service-strip,.memo-infra-links,.memo-infra-kvgrid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'memo-v5-infrastructure';
  view.appendChild(root);

  let busy = false;
  let lastFetch = 0;

  const serviceName = (key) => key === 'wireguard' ? 'WireGuard' : key === 'minio' ? 'MinIO' : key === 'docker' ? 'Docker' : 'AMP';
  const diskCard = (disk) => {
    const use = pct(disk.used_percent);
    const path = disk.path || disk.mountpoint || '—';
    const isBackup = path === '/mnt/backups';
    const isRoot = path === '/';
    const label = isBackup ? t('backup') : isRoot ? t('systemDisk') : path;
    return `<article class="memo-disk${use >= 85 ? ' warn' : ''}"><div class="memo-disk-head"><strong>${esc(label)}</strong><span class="memo-disk-badge">${use.toFixed(1)}%</span></div><div class="memo-disk-meta"><div class="memo-disk-kv"><small>${esc(t('mountpoint'))}</small><span>${esc(path)}</span></div><div class="memo-disk-kv"><small>${esc(t('device'))}</small><span>${esc(disk.device || '—')}</span></div><div class="memo-disk-kv"><small>${esc(t('filesystem'))}</small><span>${esc(disk.fstype || '—')}</span></div></div><div class="memo-disk-capacity">${esc(size(disk.used_gib))} ${esc(t('used'))} · ${esc(size(disk.available_gib))} ${esc(t('free'))} · ${esc(size(disk.total_gib))} ${esc(t('total'))}</div><div class="memo-infra-bar"><span style="width:${use}%"></span></div></article>`;
  };

  const render = async (force = false) => {
    if (busy) return;
    if (!force && Date.now() - lastFetch < 4000) return;
    busy = true;
    const oldButton = root.querySelector('#memo-infra-refresh');
    if (oldButton) { oldButton.disabled = true; oldButton.textContent = t('refreshing'); }
    try {
      const response = await fetch(`/memo-network/live-stats.cgi?infrastructure=1&_=${Date.now()}`, {cache:'no-store', credentials:'same-origin'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const d = await response.json();
      const disks = Array.isArray(d.disks) ? d.disks : [];
      const backupOk = !!d.storage?.backup_mount_ok;
      const highDisk = disks.some(x => Number(x.used_percent || 0) >= 85);
      const storageOk = backupOk && !highDisk;
      const services = ['docker','amp','minio','wireguard'];
      const online = services.filter(key => !!d.services?.[key]).length;
      const stamp = new Date(Number(d.timestamp || 0) * 1000);
      const time = Number.isNaN(stamp.getTime()) ? '—' : stamp.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});
      const temp = d.system?.temperature_c == null ? '—' : `${d.system.temperature_c}°C`;
      const updateCount = Number(d.updates_available || 0);
      const reboot = !!d.reboot_required;

      root.innerHTML = `
        <div class="memo-infra-head"><div><small>${esc(t('eyebrow'))}</small><h2>${esc(t('title'))}</h2><p>${esc(t('subtitle'))}</p></div><div class="memo-infra-actions"><span class="memo-infra-time">${esc(t('lastUpdate'))}: ${esc(time)}</span><button class="memo-infra-btn" id="memo-infra-refresh" type="button">↻ ${esc(t('refresh'))}</button></div></div>
        <div class="memo-infra-summary">
          <div class="memo-infra-card ${storageOk ? 'ok' : 'bad'}"><small>${esc(t('storageHealth'))}</small><strong>${esc(storageOk ? t('healthy') : t('attention'))}</strong><span>${disks.length} ${esc(t('filesystems').toLowerCase())}</span></div>
          <div class="memo-infra-card ${backupOk ? 'ok' : 'bad'}"><small>${esc(t('backup'))}</small><strong>${esc(backupOk ? t('mounted') : t('notMounted'))}</strong><span>${esc(d.storage?.backup_device || '/mnt/backups')}</span></div>
          <div class="memo-infra-card"><small>${esc(t('platform'))}</small><strong>${online} / ${services.length}</strong><span>${esc(t('servicesOnline'))}</span></div>
          <div class="memo-infra-card"><small>${esc(t('network'))}</small><strong>↓ ${Number(d.network_rx_kib_s || 0).toFixed(1)} KiB/s</strong><span>↑ ${Number(d.network_tx_kib_s || 0).toFixed(1)} KiB/s</span></div>
        </div>
        ${!backupOk ? `<div class="memo-infra-warning">${esc(t('backupWarning'))}</div>` : ''}
        ${highDisk ? `<div class="memo-infra-warning amber">${esc(t('storageWarning'))}</div>` : ''}
        <section class="memo-infra-panel"><div class="memo-infra-panelhead"><h3>${esc(t('filesystems'))}</h3><a href="/mount/index.cgi">${esc(t('disks'))} →</a></div><div class="memo-disk-grid">${disks.length ? disks.map(diskCard).join('') : `<div class="memo-infra-kv">${esc(t('noDisks'))}</div>`}</div></section>
        <div class="memo-infra-grid">
          <section class="memo-infra-panel"><div class="memo-infra-panelhead"><h3>${esc(t('server'))}</h3><a href="/memo-network/system-info.cgi">${esc(t('systemInfo'))} →</a></div><div class="memo-infra-kvgrid"><div class="memo-infra-kv"><small>${esc(t('hostname'))}</small><strong>${esc(d.system?.hostname || '—')}</strong></div><div class="memo-infra-kv"><small>${esc(t('operatingSystem'))}</small><strong>${esc(d.system?.os || '—')}</strong></div><div class="memo-infra-kv"><small>${esc(t('kernel'))}</small><strong>${esc(d.system?.kernel || '—')}</strong></div><div class="memo-infra-kv"><small>${esc(t('processor'))}</small><strong>${esc(d.system?.cpu || '—')}</strong></div><div class="memo-infra-kv"><small>${esc(t('uptime'))}</small><strong>${esc(uptime(d.system?.uptime_seconds))}</strong></div><div class="memo-infra-kv"><small>${esc(t('processes'))}</small><strong>${esc(d.system?.processes ?? '—')}</strong></div><div class="memo-infra-kv"><small>${esc(t('temperature'))}</small><strong>${esc(temp)}</strong></div><div class="memo-infra-kv"><small>CPU</small><strong>${esc(d.system?.cpu_cores || 0)} ${esc(t('cores'))}</strong></div></div></section>
          <section class="memo-infra-panel"><div class="memo-infra-panelhead"><h3>${esc(t('platform'))}</h3></div><div class="memo-service-strip">${services.map(key => `<div class="memo-service-chip${d.services?.[key] ? ' online' : ''}"><b>${esc(serviceName(key))}</b><span>${d.services?.[key] ? 'Online' : 'Offline'}</span></div>`).join('')}</div><div class="memo-infra-kvgrid" style="margin-top:9px"><div class="memo-infra-kv"><small>${esc(t('reboot'))}</small><strong>${esc(reboot ? t('yes') : t('no'))}</strong></div><div class="memo-infra-kv"><small>${esc(t('updates'))}</small><strong>${updateCount}</strong></div></div></section>
        </div>
        <section class="memo-infra-panel"><div class="memo-infra-panelhead"><h3>${esc(t('tools'))}</h3></div><div class="memo-infra-links"><a href="/mount/index.cgi">${esc(t('disks'))}</a><a href="/net/index.cgi">${esc(t('networkManage'))}</a><a href="/memo-network/system-info.cgi">${esc(t('systemInfo'))}</a><a href="/package-updates/index.cgi">${esc(t('updatesOpen'))}</a></div></section>`;

      root.querySelector('#memo-infra-refresh')?.addEventListener('click', () => render(true));
      lastFetch = Date.now();
    } catch (error) {
      root.innerHTML = `<div class="memo-infra-error"><strong>${esc(t('failedLoad'))}</strong><div style="margin-top:5px">${esc(error?.message || error)}</div></div>`;
    } finally {
      busy = false;
      const button = root.querySelector('#memo-infra-refresh');
      if (button) { button.disabled = false; button.textContent = `↻ ${t('refresh')}`; }
    }
  };

  const active = () => view.classList.contains('active');
  const observer = new MutationObserver(() => { if (active()) render(); });
  observer.observe(view, {attributes:true, attributeFilter:['class']});
  render(true);
  setInterval(() => { if (active()) render(); }, 5000);

  window.MemoNetworkV5Infrastructure = {refresh: () => render(true)};
})();
