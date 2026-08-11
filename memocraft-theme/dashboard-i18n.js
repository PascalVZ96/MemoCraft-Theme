(() => {
  if (window.MemoDashboardI18n) return;

  const cookieLanguage = () => {
    const match = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
    return match ? match[1].toLowerCase() : '';
  };

  const detectFromText = text => {
    const value = String(text || '').toLowerCase();
    if (value.includes('abmelden') || value.includes('module aktualisieren') || value.includes('systeminformationen')) return 'de';
    if (value.includes('uitloggen') || value.includes('ververs modules') || value.includes('systeeminformatie')) return 'nl';
    if (value.includes('logout') || value.includes('refresh modules') || value.includes('system information')) return 'en';
    return '';
  };

  const sidebarLanguage = () => {
    try {
      for (const frame of Array.from(top.frames || [])) {
        try {
          const doc = frame.document;
          if (!doc?.body) continue;
          if (!doc.querySelector('.leftmenu, .memo-menu-content, #memo-version-footer')) continue;
          const found = detectFromText(doc.body.innerText || doc.body.textContent || '');
          if (found) return found;
        } catch (_error) {}
      }
    } catch (_error) {}
    try {
      const doc = parent?.document;
      if (doc?.body && doc !== document && doc.querySelector('.leftmenu, .memo-menu-content, #memo-version-footer')) {
        return detectFromText(doc.body.innerText || doc.body.textContent || '');
      }
    } catch (_error) {}
    return '';
  };

  const exact = {
    de: {
      'Nu verversen':'Jetzt aktualisieren','Systeeminfo':'Systeminfo','Updates':'Updates','AMP openen':'AMP öffnen','Schijven':'Datenträger','Herstartbeheer':'Neustartverwaltung','Inzichten':'Einblicke','Gezond':'Gesund','Alle bewaakte onderdelen zijn in orde':'Alle überwachten Komponenten sind in Ordnung','Services online':'Dienste online','Hoogste belasting':'Höchste Auslastung','Actieve meldingen':'Aktive Meldungen','API reactietijd':'API-Reaktionszeit','Geheugen':'Arbeitsspeicher','Opslag':'Speicher','Actuele belasting':'Aktuelle Auslastung','Totaal geheugen':'Gesamtspeicher','Server online':'Server online','Netwerkverkeer':'Netzwerkverkehr','Download':'Download','Upload':'Upload','Besturingssysteem':'Betriebssystem','Processor':'Prozessor','Temperatuur':'Temperatur','Processen':'Prozesse','Laatste update':'Letzte Aktualisierung','Services':'Dienste','Klik op een service voor live details en beheer':'Klicke auf einen Dienst für Live-Details und Verwaltung','Online':'Online','Offline':'Offline','Details':'Details','actief van':'aktiv von','containers':'Container','instances':'Instanzen','Per gemount bestandssysteem':'Pro eingehängtem Dateisystem','Systeembeheer en Webmin-functies':'Systemverwaltung und Webmin-Funktionen','Systeeminformatie':'Systeminformationen','Serverstatus bekijken':'Serverstatus anzeigen','Mounts en vrije ruimte':'Mounts und freier Speicher','Netwerkinterfaces':'Netzwerkschnittstellen','IP en netwerkconfiguratie':'IP- und Netzwerkkonfiguration','Actieve processen':'Aktive Prozesse','Processen bekijken':'Prozesse anzeigen','Pakketupdates':'Paketupdates','Updates installeren':'Updates installieren','Webmin-logboek':'Webmin-Protokoll','Recente acties':'Letzte Aktionen','Opstarten en afsluiten':'Starten und Herunterfahren','Services en reboot':'Dienste und Neustart','Dashboard configureren':'Dashboard konfigurieren','Klassieke onderdelen':'Klassische Komponenten','Service-details':'Dienst-Details','Sluiten':'Schließen','Status':'Status','Actief':'Aktiv','Totaal':'Gesamt','Docker-beheer':'Docker-Verwaltung','AMP-instances':'AMP-Instanzen','MinIO-beheer':'MinIO-Verwaltung','WireGuard-peers':'WireGuard-Peers','Backup-opslag':'Backup-Speicher','Docker-processen':'Docker-Prozesse','AMP-processen':'AMP-Prozesse','MinIO-processen':'MinIO-Prozesse','Beheer':'Verwaltung','Gestopt':'Gestoppt','Start':'Start','Stop':'Stopp','Herstart':'Neustart','Niet beschikbaar':'Nicht verfügbar','Geen handshake':'Kein Handshake','Geen schijfgegevens gevonden.':'Keine Datenträgerdaten gefunden.','Onbekend apparaat':'Unbekanntes Gerät','bestandssysteem':'Dateisystem','Opslaggegevens laden…':'Speicherdaten werden geladen…','Controleren…':'Wird geprüft…','S3-opslagservice':'S3-Speicherdienst','Lokaal proces':'Lokaler Prozess','Niet gedetecteerd':'Nicht erkannt','Geen containers gevonden.':'Keine Container gefunden.','Geen AMP-instances gevonden.':'Keine AMP-Instanzen gefunden.','Geen peers geconfigureerd of zichtbaar.':'Keine Peers konfiguriert oder sichtbar.','Image / netwerk':'Image / Netzwerk','Module / poort':'Modul / Port','Openen':'Öffnen','Verkeer / handshake':'Verkehr / Handshake','Endpoint / IP':'Endpunkt / IP','Recent':'Kürzlich','Inactief':'Inaktiv','Meldingen':'Meldungen','Aandacht nodig':'Achtung erforderlich','Kritiek':'Kritisch','Live controle van server en services':'Live-Überwachung von Server und Diensten','Uptime':'Betriebszeit','Load average':'Systemlast','Laatste meting':'Letzte Messung','Systeemoverzicht':'Systemübersicht','Hostnaam':'Hostname','Systeemtijd':'Systemzeit','Pakketstatus':'Paketstatus','Harddiskgebruik':'Festplattennutzung','Recente Webmin-acties':'Letzte Webmin-Aktionen','Alles bijgewerkt':'Alles aktuell','Geen onderdelen gevonden':'Keine Einträge gefunden','De service heeft geen detailgegevens teruggegeven.':'Der Dienst hat keine Detaildaten zurückgegeben.','Testversie':'Testversion','Versie controleren…':'Version wird geprüft…','Laatste versie':'Neueste Version','Update beschikbaar:':'Update verfügbar:','Versiecontrole niet beschikbaar':'Versionsprüfung nicht verfügbar'
    },
    en: {
      'Nu verversen':'Refresh now','Systeeminfo':'System info','Updates':'Updates','AMP openen':'Open AMP','Schijven':'Disks','Herstartbeheer':'Restart management','Inzichten':'Insights','Gezond':'Healthy','Alle bewaakte onderdelen zijn in orde':'All monitored components are healthy','Services online':'Services online','Hoogste belasting':'Highest load','Actieve meldingen':'Active alerts','API reactietijd':'API response time','Geheugen':'Memory','Opslag':'Storage','Actuele belasting':'Current load','Totaal geheugen':'Total memory','Server online':'Server online','Netwerkverkeer':'Network traffic','Download':'Download','Upload':'Upload','Besturingssysteem':'Operating system','Processor':'Processor','Temperatuur':'Temperature','Processen':'Processes','Laatste update':'Last update','Services':'Services','Klik op een service voor live details en beheer':'Click a service for live details and management','Online':'Online','Offline':'Offline','Details':'Details','actief van':'active of','containers':'containers','instances':'instances','Per gemount bestandssysteem':'Per mounted filesystem','Systeembeheer en Webmin-functies':'System management and Webmin functions','Systeeminformatie':'System information','Serverstatus bekijken':'View server status','Mounts en vrije ruimte':'Mounts and free space','Netwerkinterfaces':'Network interfaces','IP en netwerkconfiguratie':'IP and network configuration','Actieve processen':'Active processes','Processen bekijken':'View processes','Pakketupdates':'Package updates','Updates installeren':'Install updates','Webmin-logboek':'Webmin log','Recente acties':'Recent actions','Opstarten en afsluiten':'Boot and shutdown','Services en reboot':'Services and restart','Dashboard configureren':'Configure dashboard','Klassieke onderdelen':'Classic components','Service-details':'Service details','Sluiten':'Close','Status':'Status','Actief':'Active','Totaal':'Total','Docker-beheer':'Docker management','AMP-instances':'AMP instances','MinIO-beheer':'MinIO management','WireGuard-peers':'WireGuard peers','Backup-opslag':'Backup storage','Docker-processen':'Docker processes','AMP-processen':'AMP processes','MinIO-processen':'MinIO processes','Beheer':'Management','Gestopt':'Stopped','Start':'Start','Stop':'Stop','Herstart':'Restart','Niet beschikbaar':'Unavailable','Geen handshake':'No handshake','Geen schijfgegevens gevonden.':'No disk data found.','Onbekend apparaat':'Unknown device','bestandssysteem':'filesystem','Opslaggegevens laden…':'Loading storage data…','Controleren…':'Checking…','S3-opslagservice':'S3 storage service','Lokaal proces':'Local process','Niet gedetecteerd':'Not detected','Geen containers gevonden.':'No containers found.','Geen AMP-instances gevonden.':'No AMP instances found.','Geen peers geconfigureerd of zichtbaar.':'No peers configured or visible.','Image / netwerk':'Image / network','Module / poort':'Module / port','Openen':'Open','Verkeer / handshake':'Traffic / handshake','Endpoint / IP':'Endpoint / IP','Recent':'Recent','Inactief':'Inactive','Meldingen':'Alerts','Aandacht nodig':'Needs attention','Kritiek':'Critical','Live controle van server en services':'Live monitoring of server and services','Uptime':'Uptime','Load average':'Load average','Laatste meting':'Last measurement','Systeemoverzicht':'System overview','Hostnaam':'Hostname','Systeemtijd':'System time','Pakketstatus':'Package status','Harddiskgebruik':'Disk usage','Recente Webmin-acties':'Recent Webmin actions','Alles bijgewerkt':'Everything up to date','Geen onderdelen gevonden':'No items found','De service heeft geen detailgegevens teruggegeven.':'The service returned no detail data.','Testversie':'Test version','Versie controleren…':'Checking version…','Laatste versie':'Latest version','Update beschikbaar:':'Update available:','Versiecontrole niet beschikbaar':'Version check unavailable'
    }
  };

  const reverse = {de:{}, en:{}};
  for (const lang of ['de','en']) {
    for (const [nl, translated] of Object.entries(exact[lang])) reverse[lang][translated] = nl;
  }

  let language = '';
  let observer = null;
  let scheduled = false;

  const canonicalDynamic = value => {
    const s = String(value || '').trim();
    let m;

    if ((m=s.match(/^Automatisch:\s*(\d+(?:\.\d+)?) Sek\.$/))) return `Automatisch: ${m[1]} sec`;
    if ((m=s.match(/^Automatic:\s*(\d+(?:\.\d+)?) sec$/))) return `Automatisch: ${m[1]} sec`;
    if ((m=s.match(/^(\d+) Kerne · aktuelle Auslastung$/))) return `${m[1]} cores · actuele belasting`;
    if ((m=s.match(/^(\d+) cores · current load$/))) return `${m[1]} cores · actuele belasting`;
    if ((m=s.match(/^([0-9.]+ GiB) gesamt · ([0-9.]+)%$/))) return `${m[1]} totaal · ${m[2]}%`;
    if ((m=s.match(/^([0-9.]+ GiB) total · ([0-9.]+)%$/))) return `${m[1]} totaal · ${m[2]}%`;
    if ((m=s.match(/^(.+) gesamt · (.+) frei$/))) return `${m[1]} totaal · ${m[2]} vrij`;
    if ((m=s.match(/^(.+) total · (.+) free$/))) return `${m[1]} totaal · ${m[2]} vrij`;
    if ((m=s.match(/^(.+) belegt · (.+) frei · (.+) gesamt$/))) return `${m[1]} gebruikt · ${m[2]} vrij · ${m[3]} totaal`;
    if ((m=s.match(/^(.+) used · (.+) free · (.+) total$/))) return `${m[1]} gebruikt · ${m[2]} vrij · ${m[3]} totaal`;
    if ((m=s.match(/^([0-9.]+)% belegt$/))) return `${m[1]}% gebruikt`;
    if ((m=s.match(/^([0-9.]+)% used$/))) return `${m[1]}% gebruikt`;
    if ((m=s.match(/^(\d+) Tag(?:e)?, (\d+) Std\., (\d+) Min\.$/))) return `${m[1]} dag${Number(m[1])===1?'':'en'}, ${m[2]} uur, ${m[3]} min`;
    if ((m=s.match(/^(\d+) day(?:s)?, (\d+) hr, (\d+) min$/))) return `${m[1]} dag${Number(m[1])===1?'':'en'}, ${m[2]} uur, ${m[3]} min`;
    if ((m=s.match(/^(\d+) Std\., (\d+) Min\.$/))) return `${m[1]} uur, ${m[2]} min`;
    if ((m=s.match(/^(\d+) hr, (\d+) min$/))) return `${m[1]} uur, ${m[2]} min`;
    if ((m=s.match(/^(\d+) Peer(?:s)? · vor (\d+) Std\.$/))) return `${m[1]} peer${Number(m[1])===1?'':'s'} · ${m[2]} uur geleden`;
    if ((m=s.match(/^(\d+) peer(?:s)? · (\d+) hr ago$/))) return `${m[1]} peer${Number(m[1])===1?'':'s'} · ${m[2]} uur geleden`;
    if ((m=s.match(/^(\d+) Peer(?:s)? · vor (\d+) Min\.$/))) return `${m[1]} peer${Number(m[1])===1?'':'s'} · ${m[2]} min geleden`;
    if ((m=s.match(/^(\d+) peer(?:s)? · (\d+) min ago$/))) return `${m[1]} peer${Number(m[1])===1?'':'s'} · ${m[2]} min geleden`;
    if ((m=s.match(/^(\d+) aktiv von (\d+) Containern$/))) return `${m[1]} actief van ${m[2]} containers`;
    if ((m=s.match(/^(\d+) active of (\d+) containers$/))) return `${m[1]} actief van ${m[2]} containers`;
    if ((m=s.match(/^(\d+) aktiv von (\d+) Instanzen$/))) return `${m[1]} actief van ${m[2]} instances`;
    if ((m=s.match(/^(\d+) active of (\d+) instances$/))) return `${m[1]} actief van ${m[2]} instances`;
    if ((m=s.match(/^Testversion · main v(.+)$/))) return `Testversie · main v${m[1]}`;
    if ((m=s.match(/^Test version · main v(.+)$/))) return `Testversie · main v${m[1]}`;
    return s;
  };

  const canonical = value => {
    let s = String(value || '').trim();
    if (!s) return s;
    s = reverse.de[s] || reverse.en[s] || s;
    return canonicalDynamic(s);
  };

  const translateDynamic = value => {
    const s = String(value || '').trim();
    if (language === 'nl') return s;
    const de = language === 'de';
    let m;
    if ((m=s.match(/^Automatisch:\s*(\d+(?:\.\d+)?) sec$/))) return de ? `Automatisch: ${m[1]} Sek.` : `Automatic: ${m[1]} sec`;
    if ((m=s.match(/^(\d+) cores · actuele belasting$/))) return de ? `${m[1]} Kerne · aktuelle Auslastung` : `${m[1]} cores · current load`;
    if ((m=s.match(/^([0-9.]+ GiB) totaal · ([0-9.]+)%$/))) return de ? `${m[1]} gesamt · ${m[2]}%` : `${m[1]} total · ${m[2]}%`;
    if ((m=s.match(/^(.+) totaal · (.+) vrij$/))) return de ? `${m[1]} gesamt · ${m[2]} frei` : `${m[1]} total · ${m[2]} free`;
    if ((m=s.match(/^(.+) gebruikt · (.+) vrij · (.+) totaal$/))) return de ? `${m[1]} belegt · ${m[2]} frei · ${m[3]} gesamt` : `${m[1]} used · ${m[2]} free · ${m[3]} total`;
    if ((m=s.match(/^([0-9.]+)% gebruikt$/))) return de ? `${m[1]}% belegt` : `${m[1]}% used`;
    if ((m=s.match(/^(\d+) dag(?:en)?, (\d+) uur, (\d+) min$/))) return de ? `${m[1]} Tag${Number(m[1])===1?'':'e'}, ${m[2]} Std., ${m[3]} Min.` : `${m[1]} day${Number(m[1])===1?'':'s'}, ${m[2]} hr, ${m[3]} min`;
    if ((m=s.match(/^(\d+) uur, (\d+) min$/))) return de ? `${m[1]} Std., ${m[2]} Min.` : `${m[1]} hr, ${m[2]} min`;
    if ((m=s.match(/^(\d+) peers? · (\d+) uur geleden$/))) return de ? `${m[1]} Peer${Number(m[1])===1?'':'s'} · vor ${m[2]} Std.` : `${m[1]} peer${Number(m[1])===1?'':'s'} · ${m[2]} hr ago`;
    if ((m=s.match(/^(\d+) peers? · (\d+) min geleden$/))) return de ? `${m[1]} Peer${Number(m[1])===1?'':'s'} · vor ${m[2]} Min.` : `${m[1]} peer${Number(m[1])===1?'':'s'} · ${m[2]} min ago`;
    if ((m=s.match(/^(\d+) actief van (\d+) containers$/))) return de ? `${m[1]} aktiv von ${m[2]} Containern` : `${m[1]} active of ${m[2]} containers`;
    if ((m=s.match(/^(\d+) actief van (\d+) instances$/))) return de ? `${m[1]} aktiv von ${m[2]} Instanzen` : `${m[1]} active of ${m[2]} instances`;
    if ((m=s.match(/^Testversie · main v(.+)$/))) return de ? `Testversion · main v${m[1]}` : `Test version · main v${m[1]}`;
    return exact[language]?.[s] || s;
  };

  const translateValue = value => {
    const raw = String(value || '');
    if (!raw.trim()) return raw;
    const lead = raw.match(/^\s*/)?.[0] || '';
    const tail = raw.match(/\s*$/)?.[0] || '';
    const source = canonical(raw);
    return lead + translateDynamic(source) + tail;
  };

  const translateNode = node => {
    if (!node || typeof node.nodeValue !== 'string') return;
    const next = translateValue(node.nodeValue);
    if (next !== node.nodeValue) node.nodeValue = next;
  };

  const translateAttributes = root => {
    if (!root?.querySelectorAll) return;
    const elements = [];
    if (root.nodeType === 1) elements.push(root);
    elements.push(...root.querySelectorAll('[title],[aria-label],[placeholder]'));
    for (const el of elements) {
      for (const attr of ['title','aria-label','placeholder']) {
        if (!el.hasAttribute?.(attr)) continue;
        const old = el.getAttribute(attr);
        const next = translateValue(old);
        if (next !== old) el.setAttribute(attr, next);
      }
    }
  };

  const translateTree = root => {
    if (!root) return;
    document.documentElement.lang = language || 'nl';
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const parent = node.parentElement;
      if (!parent || /^(SCRIPT|STYLE|NOSCRIPT|PRE|CODE|TEXTAREA)$/i.test(parent.tagName)) continue;
      translateNode(node);
    }
    translateAttributes(root);
  };

  const detectLanguage = () => sidebarLanguage() || cookieLanguage() || 'en';

  const render = () => {
    const detected = detectLanguage();
    if (['nl','de','en'].includes(detected)) language = detected;
    window.MemoDashboardI18n.language = language;
    translateTree(document.body);
  };

  const scheduleRender = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      render();
    });
  };

  window.MemoDashboardI18n = {
    language:'',
    refresh: render,
    setLanguage: lang => {
      if (!['nl','de','en'].includes(lang)) return;
      language = lang;
      render();
    }
  };

  const boot = () => {
    render();
    if (!observer) {
      observer = new MutationObserver(scheduleRender);
      observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder']});
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();

  setInterval(render, 500);
})();
