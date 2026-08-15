(() => {
  if (window.MemoNetworkV5Operations) return;
  const view = document.getElementById('overview');
  if (!view) return;

  const cookie = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
  const lang = cookie ? cookie[1].toLowerCase() : (document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
  const dict = {
    nl: {
      eyebrow:'Centrale bewaking', title:'Operations Center', subtitle:'Belangrijkste systeem-, backup-, netwerk- en beveiligingssignalen samengevoegd op één plek.', refresh:'Alles vernieuwen', refreshing:'Controleren…', updated:'Bijgewerkt', attention:'Aandachtspunten', noAttention:'Geen directe aandachtspunten gevonden.', sources:'Bronstatus', ok:'Goed', warning:'Aandacht', critical:'Kritiek', unknown:'Onbekend', unavailable:'Niet beschikbaar', open:'Openen', details:'Bekijken',
      system:'Systeem', services:'Services', backup:'Backups', security:'Beveiliging', network:'Netwerk', internet:'Internet',
      systemHealthy:'Systeembelasting normaal', servicesHealthy:'Alle platformservices online', backupHealthy:'Backupomgeving in orde', securityHealthy:'Auto Defense actief', networkHealthy:'Laatste netwerkcontrole goed', internetHealthy:'Laatste speedtest in orde',
      rebootTitle:'Serverherstart vereist', rebootMsg:'Ubuntu meldt dat een herstart nodig is om geïnstalleerde wijzigingen volledig toe te passen.', updatesTitle:'Systeemupdates beschikbaar', updatesMsg:'Er staan {n} pakketupdate(s) klaar.', cpuTitle:'CPU-belasting zeer hoog', cpuMsg:'Actuele CPU-belasting: {n}%.', ramTitle:'Geheugengebruik hoog', ramMsg:'Actueel geheugengebruik: {n}%.', diskTitle:'Opslag bijna vol', diskMsg:'Een bestandssysteem gebruikt {n}% van de capaciteit.', tempTitle:'Temperatuur verhoogd', tempMsg:'De gemeten temperatuur is {n}°C.',
      serviceTitle:'Platformservice offline', serviceMsg:'Offline: {names}.', backupMountTitle:'Backup-HDD niet correct gemount', backupMountMsg:'/mnt/backups staat niet op een apart bestandssysteem.', backupStaleTitle:'Laatste backup is verouderd', backupStaleMsg:'De nieuwste gevonden backup is {age} oud.', backupAgingTitle:'Backup wordt ouder', backupAgingMsg:'De nieuwste gevonden backup is {age} oud.', backupNever:'Nog geen backupscan uitgevoerd', backupNeverMsg:'Start in Infrastructuur een backupcontrole om de leeftijd van de nieuwste backup vast te leggen.', minioTitle:'MinIO offline', minioMsg:'De S3-opslagservice voor backups is niet actief.',
      securityOff:'Auto Defense staat uit', securityOffMsg:'Automatische SSH-brute-forcebescherming is momenteel uitgeschakeld.', securityTimer:'Auto Defense scanner niet actief', securityTimerMsg:'Auto Defense is ingeschakeld, maar de systemd-timer draait niet.', securityError:'Auto Defense meldt een fout', securityBlocks:'Actieve blokkades', securityBlocksMsg:'{n} extern(e) IP-adres(sen) zijn momenteel automatisch geblokkeerd.', securityDetections:'Aanvalspogingen gedetecteerd', securityDetectionsMsg:'{n} detectie(s) in de afgelopen 24 uur.',
      networkNever:'Nog geen netwerkcontrole uitgevoerd', networkNeverMsg:'Voer in Diagnostiek een netwerkcontrole uit om route, DNS en internetbereikbaarheid te meten.', networkBad:'Netwerkcontrole onvoldoende', networkBadMsg:'De laatste netwerkscore is {n}/100.', networkWarn:'Netwerkcontrole vraagt aandacht', networkWarnMsg:'De laatste netwerkscore is {n}/100.', networkOld:'Netwerkcontrole is verouderd', networkOldMsg:'De laatste controle is {age} geleden uitgevoerd.',
      speedNever:'Nog geen speedtest beschikbaar', speedNeverMsg:'Start in Infrastructuur een speedtest om internetprestaties te bewaken.', speedOld:'Speedtest is verouderd', speedOldMsg:'De laatste speedtest is {age} geleden uitgevoerd.', speedSlow:'Internetsnelheid sterk gedaald', speedSlowMsg:'Laatste meting {down}/{up} Mbit/s; normaal rond {baseDown}/{baseUp} Mbit/s.', speedPing:'Hoge internetlatency', speedPingMsg:'De laatste ping is {n} ms.',
      partial:'Een of meer statusbronnen reageerden niet. De overige gegevens blijven bruikbaar.', navAttention:'aandachtspunt(en)'
    },
    de: {
      eyebrow:'Zentrale Überwachung', title:'Operations Center', subtitle:'Wichtige System-, Backup-, Netzwerk- und Sicherheitssignale an einer Stelle zusammengeführt.', refresh:'Alles aktualisieren', refreshing:'Prüfung läuft…', updated:'Aktualisiert', attention:'Hinweise', noAttention:'Keine unmittelbaren Hinweise gefunden.', sources:'Quellstatus', ok:'Gut', warning:'Achtung', critical:'Kritisch', unknown:'Unbekannt', unavailable:'Nicht verfügbar', open:'Öffnen', details:'Ansehen',
      system:'System', services:'Dienste', backup:'Backups', security:'Sicherheit', network:'Netzwerk', internet:'Internet',
      systemHealthy:'Systemlast normal', servicesHealthy:'Alle Plattformdienste online', backupHealthy:'Backup-Umgebung in Ordnung', securityHealthy:'Auto Defense aktiv', networkHealthy:'Letzte Netzwerkprüfung gut', internetHealthy:'Letzter Speedtest in Ordnung',
      rebootTitle:'Serverneustart erforderlich', rebootMsg:'Ubuntu meldet, dass ein Neustart nötig ist, um installierte Änderungen vollständig anzuwenden.', updatesTitle:'Systemupdates verfügbar', updatesMsg:'{n} Paketupdate(s) verfügbar.', cpuTitle:'CPU-Auslastung sehr hoch', cpuMsg:'Aktuelle CPU-Auslastung: {n}%.', ramTitle:'Speicherauslastung hoch', ramMsg:'Aktuelle Speicherauslastung: {n}%.', diskTitle:'Speicher fast voll', diskMsg:'Ein Dateisystem verwendet {n}% seiner Kapazität.', tempTitle:'Temperatur erhöht', tempMsg:'Gemessene Temperatur: {n}°C.',
      serviceTitle:'Plattformdienst offline', serviceMsg:'Offline: {names}.', backupMountTitle:'Backup-HDD nicht korrekt eingehängt', backupMountMsg:'/mnt/backups liegt nicht auf einem separaten Dateisystem.', backupStaleTitle:'Letztes Backup ist veraltet', backupStaleMsg:'Das neueste gefundene Backup ist {age} alt.', backupAgingTitle:'Backup wird älter', backupAgingMsg:'Das neueste gefundene Backup ist {age} alt.', backupNever:'Noch kein Backup-Scan ausgeführt', backupNeverMsg:'In Infrastruktur eine Backup-Prüfung starten, um das Alter des neuesten Backups zu erfassen.', minioTitle:'MinIO offline', minioMsg:'Der S3-Speicherdienst für Backups ist nicht aktiv.',
      securityOff:'Auto Defense ist ausgeschaltet', securityOffMsg:'Der automatische SSH-Brute-Force-Schutz ist derzeit deaktiviert.', securityTimer:'Auto-Defense-Scanner nicht aktiv', securityTimerMsg:'Auto Defense ist aktiviert, aber der systemd-Timer läuft nicht.', securityError:'Auto Defense meldet einen Fehler', securityBlocks:'Aktive Sperren', securityBlocksMsg:'{n} externe IP-Adresse(n) sind derzeit automatisch gesperrt.', securityDetections:'Angriffsversuche erkannt', securityDetectionsMsg:'{n} Erkennung(en) in den letzten 24 Stunden.',
      networkNever:'Noch keine Netzwerkprüfung ausgeführt', networkNeverMsg:'Unter Diagnose eine Netzwerkprüfung ausführen, um Route, DNS und Internetzugang zu messen.', networkBad:'Netzwerkprüfung unzureichend', networkBadMsg:'Der letzte Netzwerkscore beträgt {n}/100.', networkWarn:'Netzwerkprüfung benötigt Aufmerksamkeit', networkWarnMsg:'Der letzte Netzwerkscore beträgt {n}/100.', networkOld:'Netzwerkprüfung ist veraltet', networkOldMsg:'Die letzte Prüfung wurde vor {age} ausgeführt.',
      speedNever:'Noch kein Speedtest verfügbar', speedNeverMsg:'Unter Infrastruktur einen Speedtest starten, um die Internetleistung zu überwachen.', speedOld:'Speedtest ist veraltet', speedOldMsg:'Der letzte Speedtest wurde vor {age} ausgeführt.', speedSlow:'Internetgeschwindigkeit stark gesunken', speedSlowMsg:'Letzte Messung {down}/{up} Mbit/s; normal etwa {baseDown}/{baseUp} Mbit/s.', speedPing:'Hohe Internetlatenz', speedPingMsg:'Der letzte Ping beträgt {n} ms.',
      partial:'Eine oder mehrere Statusquellen haben nicht geantwortet. Die übrigen Daten bleiben nutzbar.', navAttention:'Hinweis(e)'
    },
    en: {
      eyebrow:'Central monitoring', title:'Operations Center', subtitle:'Important system, backup, network and security signals combined in one place.', refresh:'Refresh all', refreshing:'Checking…', updated:'Updated', attention:'Items needing attention', noAttention:'No immediate attention items found.', sources:'Source status', ok:'Good', warning:'Attention', critical:'Critical', unknown:'Unknown', unavailable:'Unavailable', open:'Open', details:'View',
      system:'System', services:'Services', backup:'Backups', security:'Security', network:'Network', internet:'Internet',
      systemHealthy:'System load normal', servicesHealthy:'All platform services online', backupHealthy:'Backup environment healthy', securityHealthy:'Auto Defense active', networkHealthy:'Last network check healthy', internetHealthy:'Last speedtest healthy',
      rebootTitle:'Server restart required', rebootMsg:'Ubuntu reports that a restart is required to fully apply installed changes.', updatesTitle:'System updates available', updatesMsg:'{n} package update(s) are available.', cpuTitle:'CPU load very high', cpuMsg:'Current CPU load: {n}%.', ramTitle:'Memory usage high', ramMsg:'Current memory usage: {n}%.', diskTitle:'Storage almost full', diskMsg:'A filesystem is using {n}% of its capacity.', tempTitle:'Temperature elevated', tempMsg:'Measured temperature is {n}°C.',
      serviceTitle:'Platform service offline', serviceMsg:'Offline: {names}.', backupMountTitle:'Backup HDD not mounted correctly', backupMountMsg:'/mnt/backups is not on a separate filesystem.', backupStaleTitle:'Latest backup is stale', backupStaleMsg:'The newest backup found is {age} old.', backupAgingTitle:'Backup is getting old', backupAgingMsg:'The newest backup found is {age} old.', backupNever:'No backup scan has been run yet', backupNeverMsg:'Run a backup check under Infrastructure to record the age of the newest backup.', minioTitle:'MinIO offline', minioMsg:'The S3 storage service used for backups is not active.',
      securityOff:'Auto Defense is off', securityOffMsg:'Automatic SSH brute-force protection is currently disabled.', securityTimer:'Auto Defense scanner inactive', securityTimerMsg:'Auto Defense is enabled, but its systemd timer is not running.', securityError:'Auto Defense reports an error', securityBlocks:'Active blocks', securityBlocksMsg:'{n} external IP address(es) are currently blocked automatically.', securityDetections:'Attack attempts detected', securityDetectionsMsg:'{n} detection(s) in the last 24 hours.',
      networkNever:'No network check has been run yet', networkNeverMsg:'Run a network check under Diagnostics to measure routing, DNS and internet reachability.', networkBad:'Network check insufficient', networkBadMsg:'The last network score is {n}/100.', networkWarn:'Network check needs attention', networkWarnMsg:'The last network score is {n}/100.', networkOld:'Network check is stale', networkOldMsg:'The last check was run {age} ago.',
      speedNever:'No speedtest available yet', speedNeverMsg:'Run a speedtest under Infrastructure to monitor internet performance.', speedOld:'Speedtest is stale', speedOldMsg:'The latest speedtest was run {age} ago.', speedSlow:'Internet speed dropped sharply', speedSlowMsg:'Latest result {down}/{up} Mbit/s; normal is around {baseDown}/{baseUp} Mbit/s.', speedPing:'High internet latency', speedPingMsg:'The latest ping is {n} ms.',
      partial:'One or more status sources did not respond. The remaining data is still usable.', navAttention:'attention item(s)'
    }
  };

  const t = (key, vars = {}) => {
    let value = dict[lang]?.[key] || dict.en[key] || key;
    for (const [k, v] of Object.entries(vars)) value = value.replaceAll(`{${k}}`, String(v));
    return value;
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pct = value => Math.max(0, Math.min(100, Number(value || 0)));
  const ageText = seconds => {
    const s = Math.max(0, Number(seconds || 0));
    if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min`;
    if (s < 86400) return `${(s / 3600).toFixed(1)} ${lang === 'de' ? 'Std.' : lang === 'nl' ? 'u' : 'h'}`;
    return `${(s / 86400).toFixed(1)} d`;
  };
  const median = values => {
    const a = values.map(Number).filter(Number.isFinite).sort((x, y) => x - y);
    if (!a.length) return 0;
    const mid = Math.floor(a.length / 2);
    return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
  };

  const style = document.createElement('style');
  style.textContent = `
    #memo-operations{margin-top:14px;padding:16px;border:1px solid #2b4a6b;border-radius:18px;background:linear-gradient(145deg,#13243a,#0d1928)}
    .memo-op-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}.memo-op-head small{display:block;color:#7895b6;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.06em}.memo-op-head h2{margin:3px 0 0;font-size:18px}.memo-op-head p{margin:5px 0 0;color:#8ea6c2;font-size:11px}.memo-op-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}.memo-op-time{color:#7895b6;font-size:9px}.memo-op-btn{appearance:none;border:1px solid #315776;border-radius:9px;background:#10233a;color:#c9e8ff;padding:8px 10px;font-weight:800;cursor:pointer}.memo-op-btn:hover{border-color:#60a5fa;background:#133052}.memo-op-btn:disabled{opacity:.55;cursor:wait}
    .memo-op-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}.memo-op-summary>div{padding:10px 11px;border:1px solid #263d59;border-radius:11px;background:#0b1726}.memo-op-summary small{display:block;color:#7895b6;font-size:8px;text-transform:uppercase;font-weight:850}.memo-op-summary strong{display:block;margin-top:4px;font-size:16px}.memo-op-summary .crit strong{color:#fca5a5}.memo-op-summary .warn strong{color:#fde68a}.memo-op-summary .good strong{color:#86efac}
    .memo-op-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-top:10px}.memo-op-source{appearance:none;text-align:left;padding:11px;border:1px solid #263d59;border-radius:12px;background:#0b1726;color:#e7f2ff;cursor:pointer;min-width:0}.memo-op-source:hover{border-color:#60a5fa;background:#10233a}.memo-op-source .topline{display:flex;align-items:center;justify-content:space-between;gap:7px}.memo-op-source b{font-size:11px}.memo-op-dot{width:8px;height:8px;border-radius:50%;background:#64748b;flex:0 0 auto}.memo-op-source.ok .memo-op-dot{background:#22c55e;box-shadow:0 0 8px rgba(34,197,94,.5)}.memo-op-source.warning .memo-op-dot{background:#f59e0b}.memo-op-source.critical .memo-op-dot{background:#fb7185}.memo-op-source span{display:block;margin-top:6px;color:#8ea6c2;font-size:9px;line-height:1.35;overflow-wrap:anywhere}.memo-op-source strong{display:block;margin-top:4px;font-size:10px}.memo-op-source.ok strong{color:#86efac}.memo-op-source.warning strong{color:#fde68a}.memo-op-source.critical strong{color:#fca5a5}
    .memo-op-body{display:grid;grid-template-columns:1.15fr .85fr;gap:10px;margin-top:10px}.memo-op-panel{padding:12px;border:1px solid #263d59;border-radius:12px;background:#0b1726}.memo-op-panelhead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.memo-op-panelhead h3{margin:0;font-size:12px}.memo-op-list{display:grid;gap:7px}.memo-op-alert{padding:10px;border:1px solid #2a4059;border-radius:10px;background:#091625}.memo-op-alert.warning{border-color:#6d5b25;background:#201c10}.memo-op-alert.critical{border-color:#713241;background:#24121a}.memo-op-alert.info{border-color:#315d8a}.memo-op-alert b{display:block;font-size:10px}.memo-op-alert p{margin:4px 0 0;color:#9ab0c8;font-size:9px;line-height:1.4}.memo-op-alert button,.memo-op-alert a{display:inline-block;margin-top:7px;border:0;background:none;color:#8fd3ff;text-decoration:none;font-size:9px;font-weight:800;cursor:pointer;padding:0}.memo-op-empty{padding:16px 6px;text-align:center;color:#86efac;font-size:10px}.memo-op-partial{margin-top:10px;padding:9px;border:1px solid #725d28;border-radius:9px;background:#2a2312;color:#fde68a;font-size:9px}.memo-op-navcount{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;margin-left:6px;border-radius:999px;background:#7f1d1d;color:#fecaca;font-size:9px;font-weight:900}
    @media(max-width:1150px){.memo-op-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:800px){.memo-op-body{grid-template-columns:1fr}}@media(max-width:650px){.memo-op-head{flex-direction:column}.memo-op-actions{justify-content:flex-start}.memo-op-grid,.memo-op-summary{grid-template-columns:repeat(2,1fr)}}
  `;
  document.head.appendChild(style);

  const root = document.createElement('section');
  root.id = 'memo-operations';
  const hero = view.querySelector('.hero');
  if (hero) hero.insertAdjacentElement('afterend', root); else view.prepend(root);

  const state = {busy:false, data:{}, errors:0, updated:0};
  const severityRank = {critical:0, warning:1, info:2};

  const fetchJson = async (url, timeoutMs = 6500) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`, {credentials:'same-origin', cache:'no-store', signal:controller.signal});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data?.ok === false) throw new Error(data.error || 'API error');
      return data;
    } finally { clearTimeout(timer); }
  };

  const jump = name => document.querySelector(`.nav button[data-view="${name}"]`)?.click();
  const add = (list, severity, code, title, message, action) => list.push({severity, code, title, message, action});

  function analyse() {
    const {live, backup, security, network, speed} = state.data;
    const alerts = [];
    const sources = {};

    if (live) {
      const ramPct = live.ram_total_gib > 0 ? (Number(live.ram_used_gib || 0) / Number(live.ram_total_gib)) * 100 : 0;
      const disks = Array.isArray(live.disks) ? live.disks : [];
      const highDisk = disks.reduce((m, d) => Math.max(m, Number(d.used_percent || 0)), 0);
      const temp = Number(live.system?.temperature_c);
      let systemStatus = 'ok';
      if (Number(live.cpu_percent || 0) >= 90) { add(alerts,'critical','cpu',t('cpuTitle'),t('cpuMsg',{n:Number(live.cpu_percent).toFixed(1)}),{href:'/memo-network/processes.cgi'}); systemStatus='critical'; }
      if (ramPct >= 90) { add(alerts,'warning','ram',t('ramTitle'),t('ramMsg',{n:ramPct.toFixed(1)}),{href:'/memo-network/system-info.cgi'}); if(systemStatus==='ok')systemStatus='warning'; }
      if (highDisk >= 90) { add(alerts,'warning','disk',t('diskTitle'),t('diskMsg',{n:highDisk.toFixed(1)}),{view:'infrastructure'}); if(systemStatus==='ok')systemStatus='warning'; }
      if (Number.isFinite(temp) && temp >= 80) { add(alerts,'warning','temp',t('tempTitle'),t('tempMsg',{n:temp.toFixed(0)}),{href:'/memo-network/system-info.cgi'}); if(systemStatus==='ok')systemStatus='warning'; }
      if (live.reboot_required) { add(alerts,'warning','reboot',t('rebootTitle'),t('rebootMsg'),{href:'/init/index.cgi'}); if(systemStatus==='ok')systemStatus='warning'; }
      if (Number(live.updates_available || 0) > 0) add(alerts,'info','updates',t('updatesTitle'),t('updatesMsg',{n:Number(live.updates_available)}),{href:'/package-updates/index.cgi'});
      sources.system = {status:systemStatus, label:t('system'), summary:t('systemHealthy'), meta:`CPU ${Number(live.cpu_percent||0).toFixed(1)}% · RAM ${ramPct.toFixed(1)}%`, action:{href:'/memo-network/system-info.cgi'}};

      const serviceMap = {docker:'Docker',amp:'AMP',minio:'MinIO',wireguard:'WireGuard'};
      const offline = Object.entries(serviceMap).filter(([key]) => !live.services?.[key]).map(([,name]) => name);
      if (offline.length) add(alerts,'warning','services',t('serviceTitle'),t('serviceMsg',{names:offline.join(', ')}),{view:'services'});
      sources.services = {status:offline.length?'warning':'ok', label:t('services'), summary:offline.length?`${offline.length} offline`:t('servicesHealthy'), meta:offline.length?offline.join(', '):'Docker · AMP · MinIO · WireGuard', action:{view:'services'}};
    } else {
      sources.system = {status:'unknown',label:t('system'),summary:t('unavailable'),meta:'—',action:{href:'/memo-network/system-info.cgi'}};
      sources.services = {status:'unknown',label:t('services'),summary:t('unavailable'),meta:'—',action:{view:'services'}};
    }

    if (backup) {
      const mountOk = !!backup.mount?.separate_filesystem;
      const minioOk = !!backup.minio?.running;
      let status = 'ok';
      if (!mountOk) { add(alerts,'critical','backup_mount',t('backupMountTitle'),t('backupMountMsg'),{view:'infrastructure'}); status='critical'; }
      if (!minioOk) { add(alerts,'warning','backup_minio',t('minioTitle'),t('minioMsg'),{view:'infrastructure'}); if(status==='ok')status='warning'; }
      if (backup.freshness === 'stale') { add(alerts,'critical','backup_stale',t('backupStaleTitle'),t('backupStaleMsg',{age:ageText(backup.latest_age_seconds)}),{view:'infrastructure'}); status='critical'; }
      else if (backup.freshness === 'aging') { add(alerts,'warning','backup_aging',t('backupAgingTitle'),t('backupAgingMsg',{age:ageText(backup.latest_age_seconds)}),{view:'infrastructure'}); if(status==='ok')status='warning'; }
      else if (!backup.scan?.scanned_at) add(alerts,'info','backup_never',t('backupNever'),t('backupNeverMsg'),{view:'infrastructure'});
      const latest = backup.scan?.latest ? ageText(backup.latest_age_seconds) : t('unknown');
      sources.backup = {status,label:t('backup'),summary:status==='ok'?t('backupHealthy'):status==='critical'?t('critical'):t('warning'),meta:`/mnt/backups · ${latest}`,action:{view:'infrastructure'}};
    } else sources.backup = {status:'unknown',label:t('backup'),summary:t('unavailable'),meta:'—',action:{view:'infrastructure'}};

    if (security) {
      let status = 'ok';
      if (security.last_error) { add(alerts,'critical','security_error',t('securityError'),String(security.last_error),{view:'diagnostics'}); status='critical'; }
      if (security.mode === 'off') { add(alerts,'info','security_off',t('securityOff'),t('securityOffMsg'),{view:'diagnostics'}); status='warning'; }
      else if (!security.timer?.active) { add(alerts,'critical','security_timer',t('securityTimer'),t('securityTimerMsg'),{view:'diagnostics'}); status='critical'; }
      if (Number(security.blocks?.length || 0) > 0) add(alerts,'info','security_blocks',t('securityBlocks'),t('securityBlocksMsg',{n:security.blocks.length}),{view:'diagnostics'});
      if (Number(security.detections_24h || 0) > 0) { add(alerts,'warning','security_detections',t('securityDetections'),t('securityDetectionsMsg',{n:security.detections_24h}),{view:'diagnostics'}); if(status==='ok')status='warning'; }
      sources.security = {status,label:t('security'),summary:status==='ok'?t('securityHealthy'):status==='critical'?t('critical'):t('warning'),meta:`${security.mode || 'off'} · ${Number(security.blocks?.length||0)} block(s)`,action:{view:'diagnostics'}};
    } else sources.security = {status:'unknown',label:t('security'),summary:t('unavailable'),meta:'—',action:{view:'diagnostics'}};

    if (network) {
      const result = network.result;
      let status = 'ok';
      if (!result) { add(alerts,'info','network_never',t('networkNever'),t('networkNeverMsg'),{view:'diagnostics'}); status='unknown'; }
      else {
        const score = Number(result.score || 0);
        const age = Math.max(0, Date.now()/1000 - Number(result.tested_at || 0));
        if (score < 60) { add(alerts,'critical','network_bad',t('networkBad'),t('networkBadMsg',{n:score}),{view:'diagnostics'}); status='critical'; }
        else if (score < 85) { add(alerts,'warning','network_warn',t('networkWarn'),t('networkWarnMsg',{n:score}),{view:'diagnostics'}); status='warning'; }
        if (age > 86400) { add(alerts,'info','network_old',t('networkOld'),t('networkOldMsg',{age:ageText(age)}),{view:'diagnostics'}); }
      }
      sources.network = {status,label:t('network'),summary:result?`${Number(result.score||0)}/100 · ${status==='ok'?t('networkHealthy'):t(status)}`:t('unknown'),meta:result?.tested_at?ageText(Date.now()/1000-Number(result.tested_at)):'—',action:{view:'diagnostics'}};
    } else sources.network = {status:'unknown',label:t('network'),summary:t('unavailable'),meta:'—',action:{view:'diagnostics'}};

    if (speed) {
      const result = speed.result;
      let status = 'ok';
      if (!result) { add(alerts,'info','speed_never',t('speedNever'),t('speedNeverMsg'),{view:'infrastructure'}); status='unknown'; }
      else {
        const age = Math.max(0, Date.now()/1000 - Number(result.tested_at || 0));
        if (age > 129600) { add(alerts,'warning','speed_old',t('speedOld'),t('speedOldMsg',{age:ageText(age)}),{view:'infrastructure'}); status='warning'; }
        const history = (Array.isArray(speed.history)?speed.history:[]).filter(x => x && Number(x.download_mbps)>0 && Number(x.upload_mbps)>0).sort((a,b)=>Number(b.tested_at||0)-Number(a.tested_at||0));
        const baselinePool = history.filter(x => Number(x.tested_at||0) < Number(result.tested_at||0)).slice(0,7);
        const baseDown = median(baselinePool.map(x=>x.download_mbps));
        const baseUp = median(baselinePool.map(x=>x.upload_mbps));
        const down = Number(result.download_mbps||0), up = Number(result.upload_mbps||0);
        if (baselinePool.length >= 3 && baseDown >= 50 && baseUp >= 50 && (down < baseDown*.70 || up < baseUp*.70)) {
          add(alerts,'warning','speed_slow',t('speedSlow'),t('speedSlowMsg',{down:down.toFixed(0),up:up.toFixed(0),baseDown:baseDown.toFixed(0),baseUp:baseUp.toFixed(0)}),{view:'infrastructure'}); status='warning';
        }
        if (Number(result.ping_ms||0) > 50) { add(alerts,'warning','speed_ping',t('speedPing'),t('speedPingMsg',{n:Number(result.ping_ms).toFixed(1)}),{view:'infrastructure'}); status='warning'; }
      }
      sources.internet = {status,label:t('internet'),summary:result?`${Number(result.download_mbps||0).toFixed(0)}↓ / ${Number(result.upload_mbps||0).toFixed(0)}↑ Mbit/s`:t('unknown'),meta:result?`${Number(result.ping_ms||0).toFixed(1)} ms · ${ageText(Math.max(0,Date.now()/1000-Number(result.tested_at||0)))}`:'—',action:{view:'infrastructure'}};
    } else sources.internet = {status:'unknown',label:t('internet'),summary:t('unavailable'),meta:'—',action:{view:'infrastructure'}};

    alerts.sort((a,b)=>(severityRank[a.severity]??9)-(severityRank[b.severity]??9));
    return {alerts,sources};
  }

  function actionHtml(action) {
    if (!action) return '';
    if (action.href) return `<a href="${esc(action.href)}">${esc(t('details'))} →</a>`;
    if (action.view) return `<button type="button" data-op-view="${esc(action.view)}">${esc(t('details'))} →</button>`;
    return '';
  }

  function sourceHtml(source, key) {
    return `<button class="memo-op-source ${esc(source.status||'unknown')}" type="button" data-source="${esc(key)}" data-view-target="${esc(source.action?.view||'')}" data-href-target="${esc(source.action?.href||'')}"><div class="topline"><b>${esc(source.label)}</b><i class="memo-op-dot"></i></div><strong>${esc(source.status==='ok'?t('ok'):source.status==='warning'?t('warning'):source.status==='critical'?t('critical'):t('unknown'))}</strong><span>${esc(source.summary)}<br>${esc(source.meta)}</span></button>`;
  }

  function updateNav(count) {
    const button = document.querySelector('.nav button[data-view="overview"]');
    if (!button) return;
    let badge = button.querySelector('.memo-op-navcount');
    if (!count) { badge?.remove(); return; }
    if (!badge) { badge=document.createElement('span'); badge.className='memo-op-navcount'; button.appendChild(badge); }
    badge.textContent=String(count);
    badge.title=`${count} ${t('navAttention')}`;
  }

  function render() {
    const {alerts,sources}=analyse();
    const critical=alerts.filter(x=>x.severity==='critical').length;
    const warning=alerts.filter(x=>x.severity==='warning').length;
    const important=critical+warning;
    updateNav(important);
    const stamp = state.updated ? new Date(state.updated).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '—';
    const sourceOrder=['system','services','backup','security','network','internet'];
    const visibleAlerts=alerts.slice(0,6);
    root.innerHTML=`
      <div class="memo-op-head"><div><small>${esc(t('eyebrow'))}</small><h2>${esc(t('title'))}</h2><p>${esc(t('subtitle'))}</p></div><div class="memo-op-actions"><span class="memo-op-time">${esc(t('updated'))}: ${esc(stamp)}</span><button class="memo-op-btn" id="memo-op-refresh" type="button" ${state.busy?'disabled':''}>${esc(state.busy?t('refreshing'):t('refresh'))}</button></div></div>
      <div class="memo-op-summary"><div class="crit"><small>${esc(t('critical'))}</small><strong>${critical}</strong></div><div class="warn"><small>${esc(t('warning'))}</small><strong>${warning}</strong></div><div class="good"><small>${esc(t('sources'))}</small><strong>${sourceOrder.filter(k=>sources[k]?.status==='ok').length} / ${sourceOrder.length}</strong></div></div>
      <div class="memo-op-grid">${sourceOrder.map(k=>sourceHtml(sources[k]||{status:'unknown',label:t(k),summary:t('unknown'),meta:'—',action:{}},k)).join('')}</div>
      <div class="memo-op-body"><div class="memo-op-panel"><div class="memo-op-panelhead"><h3>${esc(t('attention'))}</h3><span class="memo-op-time">${important}</span></div><div class="memo-op-list">${visibleAlerts.length?visibleAlerts.map(a=>`<article class="memo-op-alert ${esc(a.severity)}"><b>${esc(a.title)}</b><p>${esc(a.message)}</p>${actionHtml(a.action)}</article>`).join(''):`<div class="memo-op-empty">✓ ${esc(t('noAttention'))}</div>`}</div></div><div class="memo-op-panel"><div class="memo-op-panelhead"><h3>${esc(t('sources'))}</h3></div><div class="memo-op-list">${sourceOrder.map(k=>{const s=sources[k]||{};return `<article class="memo-op-alert ${s.status==='critical'?'critical':s.status==='warning'?'warning':'info'}"><b>${esc(s.label||t(k))}</b><p>${esc(s.summary||t('unknown'))} · ${esc(s.meta||'—')}</p></article>`;}).join('')}</div></div></div>
      ${state.errors?`<div class="memo-op-partial">${esc(t('partial'))}</div>`:''}`;

    root.querySelector('#memo-op-refresh')?.addEventListener('click',()=>load(true));
    root.querySelectorAll('[data-op-view]').forEach(btn=>btn.addEventListener('click',()=>jump(btn.dataset.opView)));
    root.querySelectorAll('.memo-op-source').forEach(btn=>btn.addEventListener('click',()=>{
      if(btn.dataset.viewTarget) jump(btn.dataset.viewTarget);
      else if(btn.dataset.hrefTarget) window.location.href=btn.dataset.hrefTarget;
    }));
  }

  async function load(force=false) {
    if (state.busy) return;
    if (!force && state.updated && Date.now()-state.updated<20000) return;
    state.busy=true; render();
    const endpoints={
      live:'/memo-network/live-stats.cgi',
      backup:'/memo-network/backup-health.cgi',
      security:'/memo-network/security.cgi',
      network:'/memo-network/network-check.cgi',
      speed:'/memo-network/speedtest.cgi'
    };
    const entries=Object.entries(endpoints);
    const settled=await Promise.allSettled(entries.map(([,url])=>fetchJson(url)));
    state.errors=0;
    settled.forEach((result,index)=>{
      const key=entries[index][0];
      if(result.status==='fulfilled') state.data[key]=result.value;
      else { state.errors++; delete state.data[key]; }
    });
    state.updated=Date.now(); state.busy=false; render();
  }

  render();
  setTimeout(()=>load(true),350);
  setInterval(()=>{if(!state.busy&&view.classList.contains('active'))load(false);},60000);
  window.MemoNetworkV5Operations={refresh:()=>load(true)};
})();
