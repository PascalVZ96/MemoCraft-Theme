(() => {
  if (window.MemoDashboardI18n) return;

  const cookieLanguage = () => {
    const match = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
    return match ? match[1].toLowerCase() : '';
  };

  const frameLanguage = () => {
    const inspect = win => {
      try {
        const text = String(win.document?.body?.innerText || win.document?.body?.textContent || '').toLowerCase();
        if (text.includes('abmelden') || text.includes('module aktualisieren') || text.includes('systeminformationen')) return 'de';
        if (text.includes('uitloggen') || text.includes('ververs modules') || text.includes('systeeminformatie')) return 'nl';
        if (text.includes('logout') || text.includes('refresh modules') || text.includes('system information')) return 'en';
      } catch (_error) {}
      return '';
    };
    try {
      const direct = inspect(parent);
      if (direct) return direct;
      for (const frame of Array.from(top.frames || [])) {
        const found = inspect(frame);
        if (found) return found;
      }
    } catch (_error) {}
    return '';
  };

  const exact = {
    de: {
      'Nu verversen':'Jetzt aktualisieren','Systeeminfo':'Systeminfo','Updates':'Updates','AMP openen':'AMP öffnen','Schijven':'Datenträger','Herstartbeheer':'Neustartverwaltung','Inzichten':'Einblicke','Gezond':'Gesund','Alle bewaakte onderdelen zijn in orde':'Alle überwachten Komponenten sind in Ordnung','Services online':'Dienste online','Hoogste belasting':'Höchste Auslastung','Actieve meldingen':'Aktive Meldungen','API reactietijd':'API-Reaktionszeit','Geheugen':'Arbeitsspeicher','Opslag':'Speicher','Actuele belasting':'Aktuelle Auslastung','Totaal geheugen':'Gesamtspeicher','Server online':'Server online','Netwerkverkeer':'Netzwerkverkehr','Download':'Download','Upload':'Upload','Besturingssysteem':'Betriebssystem','Processor':'Prozessor','Temperatuur':'Temperatur','Processen':'Prozesse','Laatste update':'Letzte Aktualisierung','Services':'Dienste','Klik op een service voor live details en beheer':'Klicke auf einen Dienst für Live-Details und Verwaltung','Online':'Online','Offline':'Offline','Details':'Details','actief van':'aktiv von','containers':'Container','instances':'Instanzen','Per gemount bestandssysteem':'Pro eingehängtem Dateisystem','Systeembeheer en Webmin-functies':'Systemverwaltung und Webmin-Funktionen','Systeeminformatie':'Systeminformationen','Serverstatus bekijken':'Serverstatus anzeigen','Mounts en vrije ruimte':'Mounts und freier Speicher','Netwerkinterfaces':'Netzwerkschnittstellen','IP en netwerkconfiguratie':'IP- und Netzwerkkonfiguration','Actieve processen':'Aktive Prozesse','Processen bekijken':'Prozesse anzeigen','Pakketupdates':'Paketupdates','Updates installeren':'Updates installieren','Webmin-logboek':'Webmin-Protokoll','Recente acties':'Letzte Aktionen','Opstarten en afsluiten':'Starten und Herunterfahren','Services en reboot':'Dienste und Neustart','Dashboard configureren':'Dashboard konfigurieren','Klassieke onderdelen':'Klassische Komponenten','Service-details':'Dienst-Details','Sluiten':'Schließen','Status':'Status','Actief':'Aktiv','Totaal':'Gesamt','Docker-beheer':'Docker-Verwaltung','AMP-instances':'AMP-Instanzen','MinIO-beheer':'MinIO-Verwaltung','WireGuard-peers':'WireGuard-Peers','Backup-opslag':'Backup-Speicher','Docker-processen':'Docker-Prozesse','AMP-processen':'AMP-Prozesse','MinIO-processen':'MinIO-Prozesse','Beheer':'Verwaltung','Gestopt':'Gestoppt','Start':'Start','Stop':'Stopp','Herstart':'Neustart','Niet beschikbaar':'Nicht verfügbar','Geen handshake':'Kein Handshake','Geen schijfgegevens gevonden.':'Keine Datenträgerdaten gefunden.','Onbekend apparaat':'Unbekanntes Gerät','bestandssysteem':'Dateisystem','Opslaggegevens laden…':'Speicherdaten werden geladen…','Controleren…':'Wird geprüft…','S3-opslagservice':'S3-Speicherdienst','Lokaal proces':'Lokaler Prozess','Niet gedetecteerd':'Nicht erkannt','Geen containers gevonden.':'Keine Container gefunden.','Geen AMP-instances gevonden.':'Keine AMP-Instanzen gefunden.','Geen peers geconfigureerd of zichtbaar.':'Keine Peers konfiguriert oder sichtbar.','Image / netwerk':'Image / Netzwerk','Module / poort':'Modul / Port','Openen':'Öffnen','Verkeer / handshake':'Verkehr / Handshake','Endpoint / IP':'Endpunkt / IP','Recent':'Kürzlich','Inactief':'Inaktiv','Meldingen':'Meldungen','Aandacht nodig':'Achtung erforderlich','Kritiek':'Kritisch','Live controle van server en services':'Live-Überwachung von Server und Diensten'
    },
    en: {
      'Nu verversen':'Refresh now','Systeeminfo':'System info','AMP openen':'Open AMP','Schijven':'Disks','Herstartbeheer':'Restart management','Inzichten':'Insights','Gezond':'Healthy','Alle bewaakte onderdelen zijn in orde':'All monitored components are healthy','Services online':'Services online','Hoogste belasting':'Highest load','Actieve meldingen':'Active alerts','API reactietijd':'API response time','Geheugen':'Memory','Opslag':'Storage','Actuele belasting':'Current load','Totaal geheugen':'Total memory','Netwerkverkeer':'Network traffic','Besturingssysteem':'Operating system','Processor':'Processor','Temperatuur':'Temperature','Processen':'Processes','Laatste update':'Last update','Klik op een service voor live details en beheer':'Click a service for live details and management','actief van':'active of','Per gemount bestandssysteem':'Per mounted filesystem','Systeembeheer en Webmin-functies':'System management and Webmin functions','Systeeminformatie':'System information','Serverstatus bekijken':'View server status','Mounts en vrije ruimte':'Mounts and free space','Netwerkinterfaces':'Network interfaces','IP en netwerkconfiguratie':'IP and network configuration','Actieve processen':'Active processes','Processen bekijken':'View processes','Pakketupdates':'Package updates','Updates installeren':'Install updates','Webmin-logboek':'Webmin log','Recente acties':'Recent actions','Opstarten en afsluiten':'Boot and shutdown','Services en reboot':'Services and restart','Dashboard configureren':'Configure dashboard','Klassieke onderdelen':'Classic components','Sluiten':'Close','Actief':'Active','Totaal':'Total','Docker-beheer':'Docker management','AMP-instances':'AMP instances','MinIO-beheer':'MinIO management','Backup-opslag':'Backup storage','Docker-processen':'Docker processes','AMP-processen':'AMP processes','MinIO-processen':'MinIO processes','Beheer':'Management','Gestopt':'Stopped','Herstart':'Restart','Niet beschikbaar':'Unavailable','Geen handshake':'No handshake','Geen schijfgegevens gevonden.':'No disk data found.','Onbekend apparaat':'Unknown device','bestandssysteem':'filesystem','Opslaggegevens laden…':'Loading storage data…','Controleren…':'Checking…','S3-opslagservice':'S3 storage service','Lokaal proces':'Local process','Niet gedetecteerd':'Not detected','Geen containers gevonden.':'No containers found.','Geen AMP-instances gevonden.':'No AMP instances found.','Geen peers geconfigureerd of zichtbaar.':'No peers configured or visible.','Image / netwerk':'Image / network','Module / poort':'Module / port','Openen':'Open','Verkeer / handshake':'Traffic / handshake','Endpoint / IP':'Endpoint / IP','Inactief':'Inactive','Meldingen':'Alerts','Aandacht nodig':'Needs attention','Kritiek':'Critical','Live controle van server en services':'Live monitoring of server and services'
    }
  };

  let language = '';
  let observer = null;

  const dynamic = value => {
    const s = String(value || '').trim();
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
    if ((m=s.match(/^(\d+) peers? · (\d+) uur geleden$/))) return de ? `${m[1]} Peers · vor ${m[2]} Std.` : `${m[1]} peers · ${m[2]} hr ago`;
    if ((m=s.match(/^(\d+) peers? · (\d+) min geleden$/))) return de ? `${m[1]} Peer${Number(m[1])===1?'':'s'} · vor ${m[2]} Min.` : `${m[1]} peer${Number(m[1])===1?'':'s'} · ${m[2]} min ago`;
    if ((m=s.match(/^(\d+) actief van (\d+) containers$/))) return de ? `${m[1]} aktiv von ${m[2]} Containern` : `${m[1]} active of ${m[2]} containers`;
    if ((m=s.match(/^(\d+) actief van (\d+) instances$/))) return de ? `${m[1]} aktiv von ${m[2]} Instanzen` : `${m[1]} active of ${m[2]} instances`;
    if ((m=s.match(/^([0-9.]+) TiB totaal · ([0-9.]+) TiB vrij$/))) return de ? `${m[1]} TiB gesamt · ${m[2]} TiB frei` : `${m[1]} TiB total · ${m[2]} TiB free`;
    if ((m=s.match(/^([0-9.]+) GiB totaal · ([0-9.]+) GiB vrij$/))) return de ? `${m[1]} GiB gesamt · ${m[2]} GiB frei` : `${m[1]} GiB total · ${m[2]} GiB free`;
    return exact[language]?.[s] || s;
  };

  const translateNode = node => {
    const raw = node.nodeValue;
    if (!raw || !raw.trim()) return;
    const trimmed = raw.trim();
    const translated = dynamic(trimmed);
    if (translated === trimmed) return;
    const lead = raw.match(/^\s*/)?.[0] || '';
    const tail = raw.match(/\s*$/)?.[0] || '';
    node.nodeValue = lead + translated + tail;
  };

  const translateTree = root => {
    if (!root || language === 'nl') return;
    document.documentElement.lang = language;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const parent = node.parentElement;
      if (!parent || /^(SCRIPT|STYLE|NOSCRIPT|PRE|CODE|TEXTAREA)$/i.test(parent.tagName)) continue;
      translateNode(node);
    }
    root.querySelectorAll?.('[title],[aria-label],[placeholder]').forEach(el => {
      for (const attr of ['title','aria-label','placeholder']) {
        if (!el.hasAttribute(attr)) continue;
        const old = el.getAttribute(attr);
        const translated = dynamic(old);
        if (translated !== old) el.setAttribute(attr, translated);
      }
    });
  };

  const start = lang => {
    if (!['nl','de','en'].includes(lang)) return false;
    language = lang;
    window.MemoDashboardI18n.language = language;
    translateTree(document.body);
    if (!observer) {
      observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          if (mutation.type === 'characterData') translateNode(mutation.target);
          for (const node of mutation.addedNodes || []) {
            if (node.nodeType === 3) translateNode(node);
            else if (node.nodeType === 1) translateTree(node);
          }
        }
      });
      observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    }
    return true;
  };

  window.MemoDashboardI18n = { language:'', refresh:() => translateTree(document.body) };

  let attempts = 0;
  const boot = () => {
    const detected = cookieLanguage() || frameLanguage();
    if (detected && start(detected)) return;
    attempts += 1;
    if (attempts < 40) setTimeout(boot, 150);
    else start('en');
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  setInterval(() => {
    const detected = cookieLanguage() || frameLanguage();
    if (detected && detected !== language) start(detected);
    else translateTree(document.body);
  }, 1000);
})();
