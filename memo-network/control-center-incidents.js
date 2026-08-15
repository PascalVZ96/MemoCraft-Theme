(() => {
  if (window.MemoNetworkV5Incidents) return;

  const VERSION = '5.0.0-alpha18';
  const STORE_KEY = 'memonetwork.v5.incidents.alpha18';
  const MAX_RECOVERED = 30;
  const RECOVERED_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
  const REFRESH_MS = 60 * 1000;
  const endpoints = {
    live: '/memo-network/live-stats.cgi',
    backup: '/memo-network/backup-health.cgi',
    security: '/memo-network/security.cgi',
    network: '/memo-network/network-check.cgi',
    speed: '/memo-network/speedtest.cgi',
  };

  const cookie = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
  const lang = cookie ? cookie[1].toLowerCase() : (document.documentElement.dataset.memoWebminLang || document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
  const dict = {
    nl: {
      nav:'Incidenten', eyebrow:'Alpha 18 · incidentcorrelatie', title:'Incident Center', subtitle:'Bundelt signalen uit systeem, services, backups, beveiliging en netwerk tot concrete incidenten met herstelhistorie.',
      refresh:'Vernieuwen', refreshing:'Bezig…', active:'Actief', critical:'Kritiek', recoveredToday:'Vandaag hersteld', lastCheck:'Laatste controle', never:'Nog niet',
      activeIncidents:'Actieve incidenten', activeSub:'Geprioriteerd op ernst en eerste detectie', recentRecovery:'Recent hersteld', recoverySub:'Automatisch gesloten nadat de relevante bronnen weer gezond rapporteerden',
      noActive:'Geen actieve incidenten. Alle gecontroleerde onderdelen zijn momenteel gezond.', noRecovered:'Nog geen herstelde incidenten in deze browser.',
      new:'Nieuw', ongoing:'Actief', recovered:'Hersteld', since:'Sinds', lastSeen:'Laatst gezien', resolvedAt:'Hersteld om', source:'Bron', evidence:'Signalen', open:'Openen',
      stripTitle:'Incident Center', stripHealthy:'Geen actieve incidenten', stripActive:'{count} actief · {critical} kritiek', viewIncidents:'Incidenten bekijken →',
      systemTitle:'Systeembelasting vraagt aandacht', systemSummary:'Een of meer systeemwaarden liggen boven de veilige waarschuwingsgrens.', cpu:'CPU {value}%', ram:'RAM {value}%', disk:'Schijfgebruik {value}%', temperature:'Temperatuur {value}°C',
      servicesTitle:'Platformservice niet beschikbaar', servicesSummary:'Niet beschikbaar: {list}.',
      backupTitle:'Backupketen niet gezond', backupSummary:'De opslag- of backupketen heeft een probleem dat succesvolle backups kan beïnvloeden.', mountBad:'Backup-HDD is niet als apart bestandssysteem gemount', minioDown:'MinIO is niet actief', backupStale:'Nieuwste backup is ouder dan 3 dagen', backupAging:'Nieuwste backup is ouder dan 24 uur',
      securityTitle:'Auto Defense vraagt aandacht', securitySummary:'De beveiligingslaag rapporteert een probleem of verhoogde aanvalactiviteit.', defenseError:'Scannerfout: {value}', defenseOff:'Auto Defense staat uit', defenseTimer:'Security scanner/timer is niet actief', defenseBlocks:'{count} actieve blokkade(s)', defenseDetections:'{count} detecties in 24 uur',
      connectivityTitle:'Connectiviteit gedegradeerd', connectivitySummary:'Netwerkcheck of internetmeting wijkt duidelijk af van de normale toestand.', networkScore:'Netwerkscore {value}/100', networkOld:'Netwerkcheck is ouder dan 24 uur', speedOld:'Laatste speedtest is ouder dan 36 uur', downloadDrop:'Download {value} Mbit/s versus mediaan {baseline} Mbit/s', uploadDrop:'Upload {value} Mbit/s versus mediaan {baseline} Mbit/s', highPing:'Ping {value} ms', speedScheduler:'Automatische speedtestplanning is niet actief',
      monitoringTitle:'Monitoring deels niet beschikbaar', monitoringSummary:'Een of meer gegevensbronnen reageerden niet binnen de timeout: {list}.',
      actionSystem:'Systeem bekijken', actionServices:'Services bekijken', actionBackup:'Backups bekijken', actionSecurity:'Security bekijken', actionNetwork:'Diagnostiek openen',
      sourceLive:'Systeem', sourceBackup:'Backups', sourceSecurity:'Security', sourceNetwork:'Netwerk', sourceSpeed:'Internet',
      minute:'min', hour:'uur', day:'dag', justNow:'zojuist', unknown:'Onbekend', localHistory:'Historie wordt lokaal in deze browser bewaard; er worden geen automatische herstelacties uitgevoerd.'
    },
    de: {
      nav:'Vorfälle', eyebrow:'Alpha 18 · Vorfallkorrelation', title:'Incident Center', subtitle:'Bündelt Signale aus System, Diensten, Backups, Sicherheit und Netzwerk zu konkreten Vorfällen mit Wiederherstellungsverlauf.',
      refresh:'Aktualisieren', refreshing:'Wird geladen…', active:'Aktiv', critical:'Kritisch', recoveredToday:'Heute behoben', lastCheck:'Letzte Prüfung', never:'Noch nicht',
      activeIncidents:'Aktive Vorfälle', activeSub:'Nach Schweregrad und erster Erkennung priorisiert', recentRecovery:'Kürzlich behoben', recoverySub:'Automatisch geschlossen, sobald die relevanten Quellen wieder gesund melden',
      noActive:'Keine aktiven Vorfälle. Alle geprüften Bereiche sind derzeit gesund.', noRecovered:'In diesem Browser wurden noch keine behobenen Vorfälle gespeichert.',
      new:'Neu', ongoing:'Aktiv', recovered:'Behoben', since:'Seit', lastSeen:'Zuletzt gesehen', resolvedAt:'Behoben um', source:'Quelle', evidence:'Signale', open:'Öffnen',
      stripTitle:'Incident Center', stripHealthy:'Keine aktiven Vorfälle', stripActive:'{count} aktiv · {critical} kritisch', viewIncidents:'Vorfälle ansehen →',
      systemTitle:'Systemlast benötigt Aufmerksamkeit', systemSummary:'Ein oder mehrere Systemwerte liegen über der sicheren Warnschwelle.', cpu:'CPU {value}%', ram:'RAM {value}%', disk:'Datenträger {value}%', temperature:'Temperatur {value}°C',
      servicesTitle:'Plattformdienst nicht verfügbar', servicesSummary:'Nicht verfügbar: {list}.',
      backupTitle:'Backup-Kette nicht gesund', backupSummary:'Die Speicher- oder Backup-Kette hat ein Problem, das erfolgreiche Backups beeinträchtigen kann.', mountBad:'Backup-Festplatte ist nicht als separates Dateisystem eingehängt', minioDown:'MinIO ist nicht aktiv', backupStale:'Neuestes Backup ist älter als 3 Tage', backupAging:'Neuestes Backup ist älter als 24 Stunden',
      securityTitle:'Auto Defense benötigt Aufmerksamkeit', securitySummary:'Die Sicherheitskomponente meldet ein Problem oder erhöhte Angriffsaktivität.', defenseError:'Scannerfehler: {value}', defenseOff:'Auto Defense ist ausgeschaltet', defenseTimer:'Security-Scanner/Timer ist nicht aktiv', defenseBlocks:'{count} aktive Sperre(n)', defenseDetections:'{count} Erkennungen in 24 Stunden',
      connectivityTitle:'Konnektivität beeinträchtigt', connectivitySummary:'Netzwerkprüfung oder Internetmessung weicht deutlich vom Normalzustand ab.', networkScore:'Netzwerkscore {value}/100', networkOld:'Netzwerkprüfung ist älter als 24 Stunden', speedOld:'Letzter Speedtest ist älter als 36 Stunden', downloadDrop:'Download {value} Mbit/s gegenüber Median {baseline} Mbit/s', uploadDrop:'Upload {value} Mbit/s gegenüber Median {baseline} Mbit/s', highPing:'Ping {value} ms', speedScheduler:'Automatische Speedtest-Planung ist nicht aktiv',
      monitoringTitle:'Monitoring teilweise nicht verfügbar', monitoringSummary:'Eine oder mehrere Datenquellen antworteten nicht innerhalb des Timeouts: {list}.',
      actionSystem:'System öffnen', actionServices:'Dienste öffnen', actionBackup:'Backups öffnen', actionSecurity:'Security öffnen', actionNetwork:'Diagnose öffnen',
      sourceLive:'System', sourceBackup:'Backups', sourceSecurity:'Security', sourceNetwork:'Netzwerk', sourceSpeed:'Internet',
      minute:'Min.', hour:'Std.', day:'Tag', justNow:'gerade eben', unknown:'Unbekannt', localHistory:'Der Verlauf wird lokal in diesem Browser gespeichert; es werden keine automatischen Reparaturaktionen ausgeführt.'
    },
    en: {
      nav:'Incidents', eyebrow:'Alpha 18 · incident correlation', title:'Incident Center', subtitle:'Combines system, service, backup, security and network signals into actionable incidents with recovery history.',
      refresh:'Refresh', refreshing:'Working…', active:'Active', critical:'Critical', recoveredToday:'Recovered today', lastCheck:'Last check', never:'Never',
      activeIncidents:'Active incidents', activeSub:'Prioritized by severity and first detection', recentRecovery:'Recently recovered', recoverySub:'Automatically closed once the relevant sources report healthy again',
      noActive:'No active incidents. All monitored areas are currently healthy.', noRecovered:'No recovered incidents have been stored in this browser yet.',
      new:'New', ongoing:'Active', recovered:'Recovered', since:'Since', lastSeen:'Last seen', resolvedAt:'Recovered at', source:'Source', evidence:'Signals', open:'Open',
      stripTitle:'Incident Center', stripHealthy:'No active incidents', stripActive:'{count} active · {critical} critical', viewIncidents:'View incidents →',
      systemTitle:'System load needs attention', systemSummary:'One or more system values are above the safe warning threshold.', cpu:'CPU {value}%', ram:'RAM {value}%', disk:'Disk usage {value}%', temperature:'Temperature {value}°C',
      servicesTitle:'Platform service unavailable', servicesSummary:'Unavailable: {list}.',
      backupTitle:'Backup chain unhealthy', backupSummary:'The storage or backup chain has a problem that may affect successful backups.', mountBad:'Backup HDD is not mounted as a separate filesystem', minioDown:'MinIO is not running', backupStale:'Newest backup is older than 3 days', backupAging:'Newest backup is older than 24 hours',
      securityTitle:'Auto Defense needs attention', securitySummary:'The security layer reports a problem or increased attack activity.', defenseError:'Scanner error: {value}', defenseOff:'Auto Defense is off', defenseTimer:'Security scanner/timer is not active', defenseBlocks:'{count} active block(s)', defenseDetections:'{count} detections in 24 hours',
      connectivityTitle:'Connectivity degraded', connectivitySummary:'Network check or internet measurement differs clearly from the normal state.', networkScore:'Network score {value}/100', networkOld:'Network check is older than 24 hours', speedOld:'Last speed test is older than 36 hours', downloadDrop:'Download {value} Mbps versus median {baseline} Mbps', uploadDrop:'Upload {value} Mbps versus median {baseline} Mbps', highPing:'Ping {value} ms', speedScheduler:'Automatic speed-test scheduling is not active',
      monitoringTitle:'Monitoring partly unavailable', monitoringSummary:'One or more data sources did not respond within the timeout: {list}.',
      actionSystem:'View system', actionServices:'View services', actionBackup:'View backups', actionSecurity:'View security', actionNetwork:'Open diagnostics',
      sourceLive:'System', sourceBackup:'Backups', sourceSecurity:'Security', sourceNetwork:'Network', sourceSpeed:'Internet',
      minute:'min', hour:'hr', day:'day', justNow:'just now', unknown:'Unknown', localHistory:'History is stored locally in this browser; no automatic repair actions are performed.'
    }
  };

  const text = (key, vars = {}) => {
    let value = dict[lang]?.[key] || dict.en[key] || key;
    Object.entries(vars).forEach(([name, replacement]) => { value = value.replaceAll(`{${name}}`, String(replacement)); });
    return value;
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
  const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const severityRank = {critical: 0, warning: 1, info: 2};
  const sourceLabel = key => text({live:'sourceLive',backup:'sourceBackup',security:'sourceSecurity',network:'sourceNetwork',speed:'sourceSpeed'}[key] || 'unknown');
  const median = values => {
    const sorted = values.map(Number).filter(Number.isFinite).sort((a,b) => a-b);
    if (!sorted.length) return 0;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  };
  const formatClock = time => time ? new Date(time).toLocaleString([], {dateStyle:'short', timeStyle:'short'}) : text('never');
  const humanSince = time => {
    if (!time) return text('unknown');
    const seconds = Math.max(0, Math.round((Date.now() - time) / 1000));
    if (seconds < 60) return text('justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} ${text('minute')}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 48) return `${hours} ${text('hour')}`;
    return `${Math.floor(hours / 24)} ${text('day')}`;
  };

  const readState = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      return {
        active: parsed && typeof parsed.active === 'object' && !Array.isArray(parsed.active) ? parsed.active : {},
        recovered: Array.isArray(parsed?.recovered) ? parsed.recovered : [],
      };
    } catch (_error) {
      return {active:{}, recovered:[]};
    }
  };
  const saveState = value => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(value)); } catch (_error) {}
  };

  const state = {
    data:{}, sourceOk:{}, active:{}, recovered:[], busy:false, lastCheck:0, error:'',
  };
  Object.assign(state, readState());

  const style = document.createElement('style');
  style.textContent = `
    #memo-incidents-nav{position:relative}.memo-inc-badge{display:inline-grid;place-items:center;min-width:18px;height:18px;margin-left:7px;padding:0 5px;border-radius:99px;background:#7f1d1d;color:#fecdd3;border:1px solid #be123c;font-size:9px;font-weight:900;vertical-align:middle}.memo-inc-badge.warn{background:#422006;color:#fde68a;border-color:#a16207}
    .memo-inc-shell{margin-top:0}.memo-inc-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.memo-inc-head small{display:block;color:#7895b6;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.06em}.memo-inc-head h2{margin:3px 0 0;font-size:19px}.memo-inc-head p{margin:5px 0 0;max-width:820px;color:#8ea6c2;font-size:11px}.memo-inc-refresh{appearance:none;border:1px solid #315776;border-radius:9px;background:#10233a;color:#c9e8ff;padding:8px 11px;font-weight:850;cursor:pointer;white-space:nowrap}.memo-inc-refresh:hover{border-color:#60a5fa;background:#133052}.memo-inc-refresh:disabled{opacity:.55;cursor:wait}
    .memo-inc-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:14px}.memo-inc-stat{padding:12px;border:1px solid #263d59;border-radius:12px;background:#0b1726}.memo-inc-stat small{display:block;color:#7895b6;font-size:8px;font-weight:850;text-transform:uppercase;letter-spacing:.05em}.memo-inc-stat strong{display:block;margin-top:5px;font-size:17px}.memo-inc-stat.critical strong{color:#fda4af}.memo-inc-stat.warning strong{color:#fde68a}.memo-inc-stat.good strong{color:#86efac}
    .memo-inc-note{margin-top:11px;padding:10px 11px;border:1px solid #29415e;border-radius:10px;background:#0b1726;color:#8ea6c2;font-size:10px}.memo-inc-list{display:grid;gap:9px}.memo-inc-card{position:relative;padding:13px 14px;border:1px solid #31445e;border-radius:13px;background:#0b1726}.memo-inc-card.critical{border-color:#7f3a49;background:linear-gradient(145deg,#25151d,#0b1726)}.memo-inc-card.warning{border-color:#6f5a21;background:linear-gradient(145deg,#211d11,#0b1726)}.memo-inc-card.recovered{border-color:#245f4a;background:linear-gradient(145deg,#10221c,#0b1726)}.memo-inc-row{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.memo-inc-main{min-width:0}.memo-inc-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px}.memo-inc-tag{display:inline-flex;align-items:center;border:1px solid #42566f;border-radius:99px;padding:3px 7px;color:#a8bed5;font-size:8px;font-weight:850;text-transform:uppercase}.memo-inc-tag.critical{border-color:#9f4255;background:#321620;color:#fecdd3}.memo-inc-tag.warning{border-color:#8a6c22;background:#2a2411;color:#fde68a}.memo-inc-tag.new{border-color:#2563eb;background:#102a54;color:#bfdbfe}.memo-inc-tag.recovered{border-color:#247653;background:#0d281f;color:#86efac}.memo-inc-card h3{margin:0;font-size:14px}.memo-inc-summary{margin-top:4px;color:#a8bed5;font-size:10px}.memo-inc-evidence{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.memo-inc-signal{padding:5px 7px;border:1px solid #2b4059;border-radius:8px;background:#091625;color:#9fb6cf;font-size:9px}.memo-inc-meta{margin-top:10px;color:#7895b6;font-size:9px}.memo-inc-action{appearance:none;border:1px solid #315776;border-radius:8px;background:#10233a;color:#c9e8ff;padding:7px 9px;font-size:9px;font-weight:850;cursor:pointer;white-space:nowrap}.memo-inc-action:hover{border-color:#60a5fa;background:#133052}.memo-inc-empty{padding:22px;border:1px dashed #2f4a67;border-radius:13px;background:#0a1624;color:#86efac;text-align:center;font-size:11px}
    #memo-inc-overview{margin-top:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 13px;border:1px solid #31506f;border-radius:12px;background:linear-gradient(135deg,#10243a,#0b1726);cursor:pointer}#memo-inc-overview:hover{border-color:#60a5fa}.memo-inc-overview-copy small{display:block;color:#7895b6;font-size:8px;font-weight:850;text-transform:uppercase}.memo-inc-overview-copy strong{display:block;margin-top:3px;font-size:12px}.memo-inc-overview-copy strong.critical{color:#fda4af}.memo-inc-overview-copy strong.warning{color:#fde68a}.memo-inc-overview-copy strong.good{color:#86efac}.memo-inc-overview-link{color:#8fd3ff;font-size:9px;font-weight:850;white-space:nowrap}
    @media(max-width:800px){.memo-inc-stats{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.memo-inc-head,.memo-inc-row,#memo-inc-overview{flex-direction:column}.memo-inc-stats{grid-template-columns:1fr}.memo-inc-action{align-self:flex-start}}
  `;
  document.head.appendChild(style);

  const ensureUi = () => {
    const nav = document.querySelector('.nav');
    const overview = document.getElementById('overview');
    if (!nav || !overview) return false;

    let button = document.getElementById('memo-incidents-nav');
    if (!button) {
      button = document.createElement('button');
      button.id = 'memo-incidents-nav';
      button.type = 'button';
      button.dataset.view = 'incidents';
      button.textContent = text('nav');
      const diagnostics = nav.querySelector('[data-view="diagnostics"]');
      nav.insertBefore(button, diagnostics || null);
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        document.querySelectorAll('.nav button').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.view').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        document.getElementById('incidents')?.classList.add('active');
        render();
      }, true);
    }

    let view = document.getElementById('incidents');
    if (!view) {
      view = document.createElement('main');
      view.id = 'incidents';
      view.className = 'view';
      const footer = document.querySelector('.footer');
      (footer?.parentNode || overview.parentNode).insertBefore(view, footer || null);
    }
    return true;
  };

  const ensureOverviewStrip = () => {
    const overview = document.getElementById('overview');
    if (!overview) return null;
    let strip = document.getElementById('memo-inc-overview');
    if (strip) return strip;
    strip = document.createElement('div');
    strip.id = 'memo-inc-overview';
    strip.tabIndex = 0;
    strip.setAttribute('role','button');
    strip.addEventListener('click', () => document.getElementById('memo-incidents-nav')?.click());
    strip.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); strip.click(); } });
    const operations = document.getElementById('memo-operations');
    if (operations?.parentNode) operations.insertAdjacentElement('afterend', strip);
    else {
      const quick = overview.querySelector('.section');
      if (quick?.parentNode) quick.parentNode.insertBefore(strip, quick);
      else overview.appendChild(strip);
    }
    return strip;
  };

  const fetchJson = async (key, timeout = 5000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const separator = endpoints[key].includes('?') ? '&' : '?';
      const response = await fetch(`${endpoints[key]}${separator}_=${Date.now()}`, {credentials:'same-origin', cache:'no-store', signal:controller.signal});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  };

  const incident = (id, severity, title, summary, evidence, sourceKeys, action) => ({id,severity,title,summary,evidence,sourceKeys,action});

  const analyze = () => {
    const list = [];
    const live = state.data.live;
    if (live) {
      const evidence = [];
      const cpu = num(live.cpu_percent);
      const ramTotal = num(live.ram_total_gib);
      const ramPct = ramTotal > 0 ? (num(live.ram_used_gib) / ramTotal) * 100 : 0;
      const highestDisk = Array.isArray(live.disks) ? Math.max(0, ...live.disks.map(item => num(item?.used_percent))) : 0;
      const temperature = num(live.system?.temperature_c);
      if (cpu >= 90) evidence.push(text('cpu',{value:cpu.toFixed(1)}));
      if (ramPct >= 90) evidence.push(text('ram',{value:ramPct.toFixed(1)}));
      if (highestDisk >= 90) evidence.push(text('disk',{value:highestDisk.toFixed(1)}));
      if (temperature >= 80) evidence.push(text('temperature',{value:temperature.toFixed(0)}));
      if (evidence.length) {
        const critical = cpu >= 95 || highestDisk >= 95 || temperature >= 90;
        list.push(incident('system-pressure', critical?'critical':'warning', text('systemTitle'), text('systemSummary'), evidence, ['live'], {label:text('actionSystem'),href:'/memo-network/system-info.cgi'}));
      }

      const services = live.services || {};
      const offline = ['docker','amp','wireguard'].filter(name => services[name] === false);
      if (offline.length) {
        list.push(incident('platform-services', offline.length >= 2 ? 'critical':'warning', text('servicesTitle'), text('servicesSummary',{list:offline.join(', ')}), offline, ['live'], {label:text('actionServices'),view:'services'}));
      }
    }

    const backup = state.data.backup;
    if (backup) {
      const evidence = [];
      if (!backup.mount?.separate_filesystem) evidence.push(text('mountBad'));
      if (backup.minio?.available && !backup.minio?.running) evidence.push(text('minioDown'));
      if (backup.freshness === 'stale') evidence.push(text('backupStale'));
      else if (backup.freshness === 'aging') evidence.push(text('backupAging'));
      if (evidence.length) {
        const critical = !backup.mount?.separate_filesystem || (backup.minio?.available && !backup.minio?.running) || backup.freshness === 'stale';
        list.push(incident('backup-chain', critical?'critical':'warning', text('backupTitle'), text('backupSummary'), evidence, ['backup'], {label:text('actionBackup'),view:'infrastructure'}));
      }
    }

    const security = state.data.security;
    if (security) {
      const evidence = [];
      if (security.last_error) evidence.push(text('defenseError',{value:security.last_error}));
      if (security.mode === 'off') evidence.push(text('defenseOff'));
      if (security.mode !== 'off' && !security.timer?.active) evidence.push(text('defenseTimer'));
      const blocks = Array.isArray(security.blocks) ? security.blocks.length : 0;
      const detections = num(security.detections_24h);
      if (blocks > 0) evidence.push(text('defenseBlocks',{count:blocks}));
      if (detections >= 5) evidence.push(text('defenseDetections',{count:detections}));
      if (evidence.length) {
        const critical = Boolean(security.last_error) || (security.mode !== 'off' && !security.timer?.active) || detections >= 20;
        list.push(incident('security-defense', critical?'critical':'warning', text('securityTitle'), text('securitySummary'), evidence, ['security'], {label:text('actionSecurity'),view:'diagnostics'}));
      }
    }

    const network = state.data.network;
    const speed = state.data.speed;
    const connectivityEvidence = [];
    const connectivitySources = [];
    let connectivityCritical = false;

    if (network?.result) {
      connectivitySources.push('network');
      const score = num(network.result.score);
      const age = Math.max(0, Date.now()/1000 - num(network.result.tested_at));
      if (score < 85) {
        connectivityEvidence.push(text('networkScore',{value:score}));
        if (score < 60) connectivityCritical = true;
      }
      if (network.result.tested_at && age > 86400) connectivityEvidence.push(text('networkOld'));
    }

    if (speed) {
      connectivitySources.push('speed');
      const current = speed.result;
      if (current) {
        const age = Math.max(0, Date.now()/1000 - num(current.tested_at));
        if (current.tested_at && age > 36*3600) connectivityEvidence.push(text('speedOld'));
        const history = Array.isArray(speed.history) ? speed.history.filter(item => num(item?.tested_at) !== num(current.tested_at)).slice(-7) : [];
        const downBaseline = median(history.map(item => item?.download_mbps));
        const upBaseline = median(history.map(item => item?.upload_mbps));
        const down = num(current.download_mbps);
        const up = num(current.upload_mbps);
        if (history.length >= 3 && downBaseline >= 50 && down > 0 && down < downBaseline * 0.70) connectivityEvidence.push(text('downloadDrop',{value:down.toFixed(1),baseline:downBaseline.toFixed(1)}));
        if (history.length >= 3 && upBaseline >= 50 && up > 0 && up < upBaseline * 0.70) connectivityEvidence.push(text('uploadDrop',{value:up.toFixed(1),baseline:upBaseline.toFixed(1)}));
        if (num(current.ping_ms) > 50) connectivityEvidence.push(text('highPing',{value:num(current.ping_ms).toFixed(1)}));
      }
      if (speed.scheduler?.detected && (!speed.scheduler?.active || !speed.scheduler?.enabled)) connectivityEvidence.push(text('speedScheduler'));
    }

    if (connectivityEvidence.length) {
      list.push(incident('connectivity', connectivityCritical?'critical':'warning', text('connectivityTitle'), text('connectivitySummary'), connectivityEvidence, connectivitySources.length?connectivitySources:['network','speed'], {label:text('actionNetwork'),view:'diagnostics'}));
    }

    const failed = Object.keys(endpoints).filter(key => state.sourceOk[key] === false);
    if (failed.length) {
      const names = failed.map(sourceLabel);
      list.push(incident('monitoring-gap', failed.length >= 3?'critical':'warning', text('monitoringTitle'), text('monitoringSummary',{list:names.join(', ')}), names, failed, {label:text('refresh')}));
    }

    return list.sort((a,b) => (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9) || a.title.localeCompare(b.title));
  };

  const reconcile = candidates => {
    const now = Date.now();
    const nextActive = {...state.active};
    const currentIds = new Set(candidates.map(item => item.id));

    candidates.forEach(item => {
      const existing = nextActive[item.id];
      if (existing) {
        nextActive[item.id] = {...existing, ...item, firstSeen:existing.firstSeen || now, lastSeen:now};
      } else {
        nextActive[item.id] = {...item, firstSeen:now, lastSeen:now};
      }
    });

    Object.entries(nextActive).forEach(([id, active]) => {
      if (currentIds.has(id)) return;
      const sources = Array.isArray(active.sourceKeys) ? active.sourceKeys : [];
      const canResolve = sources.length > 0 && sources.every(key => state.sourceOk[key] === true);
      if (!canResolve) return;
      state.recovered.unshift({...active, recoveredAt:now});
      delete nextActive[id];
    });

    state.active = nextActive;
    state.recovered = state.recovered
      .filter(item => item && item.recoveredAt && now - item.recoveredAt <= RECOVERED_RETENTION_MS)
      .sort((a,b) => b.recoveredAt - a.recoveredAt)
      .slice(0, MAX_RECOVERED);
    saveState({active:state.active,recovered:state.recovered});
  };

  const jump = action => {
    if (!action) return;
    if (action.view) {
      const button = document.querySelector(`.nav button[data-view="${CSS.escape(action.view)}"]`);
      if (button) { button.click(); return; }
    }
    if (action.href) {
      if (/^https?:\/\//i.test(action.href)) window.open(action.href, '_blank', 'noopener');
      else window.location.href = action.href;
      return;
    }
    load(true);
  };

  const cardHtml = (item, recovered = false) => {
    const isNew = !recovered && Date.now() - num(item.firstSeen) < 10 * 60 * 1000;
    const sourceNames = (Array.isArray(item.sourceKeys)?item.sourceKeys:[]).map(sourceLabel).join(' · ');
    const signals = (Array.isArray(item.evidence)?item.evidence:[]).map(value => `<span class="memo-inc-signal">${esc(value)}</span>`).join('');
    const action = !recovered && item.action ? `<button class="memo-inc-action" type="button" data-incident-action="${esc(item.id)}">${esc(item.action.label || text('open'))}</button>` : '';
    return `<article class="memo-inc-card ${recovered?'recovered':esc(item.severity)}">
      <div class="memo-inc-row"><div class="memo-inc-main"><div class="memo-inc-tags">
        <span class="memo-inc-tag ${recovered?'recovered':esc(item.severity)}">${esc(recovered?text('recovered'):item.severity==='critical'?text('critical'):text('ongoing'))}</span>
        ${isNew?`<span class="memo-inc-tag new">${esc(text('new'))}</span>`:''}
      </div><h3>${esc(item.title)}</h3><div class="memo-inc-summary">${esc(item.summary)}</div>
      <div class="memo-inc-evidence">${signals}</div>
      <div class="memo-inc-meta">${esc(text('source'))}: ${esc(sourceNames || text('unknown'))} · ${recovered?`${esc(text('resolvedAt'))}: ${esc(formatClock(item.recoveredAt))}`:`${esc(text('since'))}: ${esc(humanSince(item.firstSeen))} · ${esc(text('lastSeen'))}: ${esc(formatClock(item.lastSeen))}`}</div></div>${action}</div>
    </article>`;
  };

  const render = () => {
    if (!ensureUi()) return;
    const view = document.getElementById('incidents');
    const active = Object.values(state.active).sort((a,b) => (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9) || num(a.firstSeen) - num(b.firstSeen));
    const critical = active.filter(item => item.severity === 'critical').length;
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const recoveredToday = state.recovered.filter(item => num(item.recoveredAt) >= todayStart.getTime()).length;

    view.innerHTML = `<section class="section memo-inc-shell"><div class="memo-inc-head"><div><small>${esc(text('eyebrow'))}</small><h2>${esc(text('title'))}</h2><p>${esc(text('subtitle'))}</p></div><button id="memo-inc-refresh" class="memo-inc-refresh" type="button" ${state.busy?'disabled':''}>↻ ${esc(state.busy?text('refreshing'):text('refresh'))}</button></div>
      <div class="memo-inc-stats"><div class="memo-inc-stat ${active.length?'warning':'good'}"><small>${esc(text('active'))}</small><strong>${active.length}</strong></div><div class="memo-inc-stat ${critical?'critical':'good'}"><small>${esc(text('critical'))}</small><strong>${critical}</strong></div><div class="memo-inc-stat good"><small>${esc(text('recoveredToday'))}</small><strong>${recoveredToday}</strong></div><div class="memo-inc-stat"><small>${esc(text('lastCheck'))}</small><strong style="font-size:12px">${esc(state.lastCheck?formatClock(state.lastCheck):text('never'))}</strong></div></div>
      <div class="memo-inc-note">${esc(text('localHistory'))}</div></section>
      <section class="section"><div class="sectionhead"><div><small>${esc(text('activeSub'))}</small><h2>${esc(text('activeIncidents'))}</h2></div><span>${active.length}</span></div><div class="memo-inc-list">${active.length?active.map(item=>cardHtml(item,false)).join(''):`<div class="memo-inc-empty">${esc(text('noActive'))}</div>`}</div></section>
      <section class="section"><div class="sectionhead"><div><small>${esc(text('recoverySub'))}</small><h2>${esc(text('recentRecovery'))}</h2></div><span>${state.recovered.length}</span></div><div class="memo-inc-list">${state.recovered.length?state.recovered.slice(0,10).map(item=>cardHtml(item,true)).join(''):`<div class="memo-inc-empty" style="color:#7895b6">${esc(text('noRecovered'))}</div>`}</div></section>`;

    view.querySelector('#memo-inc-refresh')?.addEventListener('click', () => load(true));
    view.querySelectorAll('[data-incident-action]').forEach(button => button.addEventListener('click', () => {
      const item = state.active[button.dataset.incidentAction];
      jump(item?.action);
    }));

    const nav = document.getElementById('memo-incidents-nav');
    if (nav) {
      nav.querySelector('.memo-inc-badge')?.remove();
      if (active.length) {
        const badge = document.createElement('span');
        badge.className = `memo-inc-badge ${critical?'':'warn'}`;
        badge.textContent = String(active.length);
        nav.appendChild(badge);
      }
    }

    const strip = ensureOverviewStrip();
    if (strip) {
      strip.innerHTML = `<div class="memo-inc-overview-copy"><small>${esc(text('stripTitle'))}</small><strong class="${critical?'critical':active.length?'warning':'good'}">${esc(active.length?text('stripActive',{count:active.length,critical}):text('stripHealthy'))}</strong></div><div class="memo-inc-overview-link">${esc(text('viewIncidents'))}</div>`;
    }
  };

  const load = async force => {
    if (state.busy && !force) return;
    state.busy = true;
    state.error = '';
    render();
    const entries = Object.keys(endpoints);
    const results = await Promise.allSettled(entries.map(key => fetchJson(key, key === 'live' ? 6500 : 5000)));
    results.forEach((result,index) => {
      const key = entries[index];
      if (result.status === 'fulfilled') {
        state.data[key] = result.value;
        state.sourceOk[key] = true;
      } else {
        state.sourceOk[key] = false;
      }
    });
    state.lastCheck = Date.now();
    reconcile(analyze());
    state.busy = false;
    render();
  };

  ensureUi();
  render();
  setTimeout(() => load(false), 650);
  setInterval(() => load(false), REFRESH_MS);

  const observer = new MutationObserver(() => ensureOverviewStrip() && render());
  const overview = document.getElementById('overview');
  if (overview) observer.observe(overview, {childList:true, subtree:false});

  window.MemoNetworkV5Incidents = {
    version: VERSION,
    refresh: () => load(true),
    state: () => ({active:{...state.active}, recovered:[...state.recovered], lastCheck:state.lastCheck}),
  };
})();