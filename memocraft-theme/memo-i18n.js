(() => {
  if (window.MemoNetworkI18n) return;

  const endpoint = '/memo-network/language.cgi';
  let language = 'en';
  let ready = false;
  const observed = new WeakSet();
  const wrappedWindows = new WeakSet();

  const exact = {
    nl: {
      'Server Management': 'Serverbeheer',
      'Checking version…': 'Versie controleren…'
    },
    de: {
      'Server Management': 'Serververwaltung',
      'Ga naar MemoNetwork Dashboard': 'Zum MemoNetwork-Dashboard',
      'Terug naar dashboard': 'Zurück zum Dashboard',
      'Versie controleren…': 'Version wird geprüft…',
      'Laatste versie': 'Neueste Version',
      'Testversie': 'Testversion',
      'Update beschikbaar:': 'Update verfügbar:',
      'Versiecontrole niet beschikbaar': 'Versionsprüfung nicht verfügbar',
      'Status laden…': 'Status wird geladen…',
      'Nu verversen': 'Jetzt aktualisieren',
      'Systeeminfo': 'Systeminfo',
      'AMP openen': 'AMP öffnen',
      'Schijven': 'Datenträger',
      'Herstartbeheer': 'Neustartverwaltung',
      'Pauze': 'Pause',
      'Updates beschikbaar': 'Updates verfügbar',
      'Beschikbare systeem- en beveiligingsupdates kunnen worden geïnstalleerd.': 'Verfügbare System- und Sicherheitsupdates können installiert werden.',
      'Updates openen': 'Updates öffnen',
      'Herstart vereist': 'Neustart erforderlich',
      'Herstart de server om alle wijzigingen volledig toe te passen.': 'Starte den Server neu, um alle Änderungen vollständig anzuwenden.',
      'Nu herstarten': 'Jetzt neu starten',
      'Systeemstatus laden…': 'Systemstatus wird geladen…',
      'Live controle van server en services': 'Live-Überwachung von Server und Diensten',
      'Services online': 'Dienste online',
      'Hoogste belasting': 'Höchste Auslastung',
      'Actieve meldingen': 'Aktive Meldungen',
      'API reactietijd': 'API-Reaktionszeit',
      'Meldingen': 'Meldungen',
      'Actuele belasting': 'Aktuelle Auslastung',
      'Geheugen': 'Arbeitsspeicher',
      'Totaal geheugen': 'Gesamtspeicher',
      'Opslag': 'Speicher',
      'Opslag laden…': 'Speicher wird geladen…',
      'Server online': 'Server online',
      'Netwerkverkeer': 'Netzwerkaktivität',
      'Besturingssysteem': 'Betriebssystem',
      'Temperatuur': 'Temperatur',
      'Processen': 'Prozesse',
      'Laatste update': 'Letzte Aktualisierung',
      'Klik op een service voor live details en beheer': 'Klicke auf einen Dienst für Live-Details und Verwaltung',
      'Controleren…': 'Wird geprüft…',
      'actief van': 'aktiv von',
      'Actief': 'Aktiv',
      'Gestopt': 'Gestoppt',
      'S3-opslagservice': 'S3-Speicherdienst',
      'Service-details': 'Dienst-Details',
      'Sluiten': 'Schließen',
      'Totaal': 'Gesamt',
      'Per gemount bestandssysteem': 'Pro eingehängtem Dateisystem',
      'Opslaggegevens laden…': 'Speicherdaten werden geladen…',
      'Systeembeheer en Webmin-functies': 'Systemverwaltung und Webmin-Funktionen',
      'Systeeminformatie': 'Systeminformationen',
      'Serverstatus bekijken': 'Serverstatus anzeigen',
      'Mounts en vrije ruimte': 'Mounts und freier Speicher',
      'Netwerkinterfaces': 'Netzwerkschnittstellen',
      'IP en netwerkconfiguratie': 'IP- und Netzwerkkonfiguration',
      'Actieve processen': 'Aktive Prozesse',
      'Processen bekijken': 'Prozesse anzeigen',
      'Pakketupdates': 'Paketupdates',
      'Updates installeren': 'Updates installieren',
      'Webmin-logboek': 'Webmin-Protokoll',
      'Recente acties': 'Letzte Aktionen',
      'Opstarten en afsluiten': 'Starten und Herunterfahren',
      'Services en reboot': 'Dienste und Neustart',
      'Dashboard configureren': 'Dashboard konfigurieren',
      'Klassieke onderdelen': 'Klassische Komponenten',
      'Geen schijfgegevens gevonden.': 'Keine Datenträgerdaten gefunden.',
      'Onbekend apparaat': 'Unbekanntes Gerät',
      'bestandssysteem': 'Dateisystem',
      'Gezond': 'Gesund',
      'Aandacht nodig': 'Achtung erforderlich',
      'Kritiek': 'Kritisch',
      'Alle bewaakte onderdelen zijn in orde': 'Alle überwachten Komponenten sind in Ordnung',
      'Bezig…': 'Bitte warten…',
      'Herstart': 'Neustart',
      'Docker-beheer': 'Docker-Verwaltung',
      'AMP-instances': 'AMP-Instanzen',
      'MinIO-beheer': 'MinIO-Verwaltung',
      'WireGuard-peers': 'WireGuard-Peers',
      'Backup-opslag': 'Backup-Speicher',
      'AMP-processen': 'AMP-Prozesse',
      'Docker-processen': 'Docker-Prozesse',
      'MinIO-processen': 'MinIO-Prozesse',
      'Container': 'Container',
      'Image / netwerk': 'Image / Netzwerk',
      'Beheer': 'Verwaltung',
      'Onbekend image': 'Unbekanntes Image',
      'Geen gepubliceerde poorten': 'Keine veröffentlichten Ports',
      'Geen containers gevonden.': 'Keine Container gefunden.',
      'Instance': 'Instanz',
      'Module / poort': 'Modul / Port',
      'Openen': 'Öffnen',
      'AMP instance': 'AMP-Instanz',
      'poort': 'Port',
      'Geen AMP-instances gevonden.': 'Keine AMP-Instanzen gefunden.',
      'Docker-container': 'Docker-Container',
      'Lokaal proces': 'Lokaler Prozess',
      'Niet gedetecteerd': 'Nicht erkannt',
      'Peer': 'Peer',
      'Endpoint / IP': 'Endpunkt / IP',
      'Verkeer / handshake': 'Verkehr / Handshake',
      'Geen endpoint': 'Kein Endpunkt',
      'Geen allowed IPs': 'Keine erlaubten IPs',
      'Recent': 'Kürzlich',
      'Inactief': 'Inaktiv',
      'Geen peers geconfigureerd of zichtbaar.': 'Keine Peers konfiguriert oder sichtbar.',
      'Geen handshake': 'Kein Handshake',
      'Herstarten…': 'Neustart…',
      'Herstartopdracht wordt verzonden…': 'Neustartbefehl wird gesendet…',
      'Server wordt nu herstart. Deze pagina zal tijdelijk niet bereikbaar zijn.': 'Der Server wird jetzt neu gestartet. Diese Seite ist vorübergehend nicht erreichbar.',
      'Herstart gestart': 'Neustart gestartet',
      'Geen data': 'Keine Daten',
      'Niet beschikbaar': 'Nicht verfügbar',
      'Automatisch: gepauzeerd': 'Automatisch: pausiert',
      'VERBINDEN…': 'VERBINDEN…',
      'Inzichten': 'Einblicke',
      'Inzichten openen': 'Einblicke öffnen',
      'MemoNetwork Inzichten': 'MemoNetwork Einblicke',
      'Live diagnostiek voor processen, netwerk, services en systeemmeldingen': 'Live-Diagnose für Prozesse, Netzwerk, Dienste und Systemmeldungen',
      'Vernieuwen': 'Aktualisieren',
      'Server gestart': 'Server gestartet',
      'Laatste boot': 'Letzter Start',
      'mislukt': 'fehlgeschlagen',
      'Aandacht vereist': 'Achtung erforderlich',
      'Geen mislukte units': 'Keine fehlgeschlagenen Units',
      'Netwerk': 'Netzwerk',
      'interfaces gedetecteerd': 'Schnittstellen erkannt',
      'Interface': 'Schnittstelle',
      'Snelheid': 'Geschwindigkeit',
      'Ontvangen': 'Empfangen',
      'Verzonden': 'Gesendet',
      'Geen netwerkinterfaces gevonden.': 'Keine Netzwerkschnittstellen gefunden.',
      'Mislukte systemd-units': 'Fehlgeschlagene systemd-Units',
      'Geen mislukte systemd-units.': 'Keine fehlgeschlagenen systemd-Units.',
      'Aangemelde sessies': 'Angemeldete Sitzungen',
      'Geen interactieve sessies gevonden.': 'Keine interaktiven Sitzungen gefunden.',
      'Luisterende netwerkpoorten': 'Lauschende Netzwerkports',
      'Protocol': 'Protokoll',
      'Lokaal adres': 'Lokale Adresse',
      'Geen luisterende sockets gevonden of ss is niet beschikbaar.': 'Keine lauschenden Sockets gefunden oder ss ist nicht verfügbar.',
      'Top CPU-processen': 'Top CPU-Prozesse',
      'Proces': 'Prozess',
      'Top geheugenprocessen': 'Top Speicherprozesse',
      'Recente systeemwaarschuwingen': 'Aktuelle Systemwarnungen',
      'Geen recente waarschuwingen gevonden.': 'Keine aktuellen Warnungen gefunden.',
      'MemoNetwork Systeeminformatie': 'MemoNetwork Systeminformationen',
      'Hostnaam': 'Hostname',
      'Processor': 'Prozessor',
      'Updates beschikbaar': 'Updates verfügbar',
      'Backup HDD': 'Backup-HDD',
      'Gemount': 'Eingehängt',
      'Niet gemount': 'Nicht eingehängt',
      'Schijven beheren': 'Datenträger verwalten',
      'Ja': 'Ja',
      'Nee': 'Nein',
      'Backup HDD niet gemount': 'Backup-HDD nicht eingehängt',
      '/mnt/backups staat niet op een apart bestandssysteem. Backups kunnen op de systeemschijf terechtkomen.': '/mnt/backups befindet sich nicht auf einem separaten Dateisystem. Backups könnten auf dem Systemlaufwerk landen.',
      'Ubuntu meldt dat een herstart nodig is om wijzigingen volledig toe te passen.': 'Ubuntu meldet, dass ein Neustart erforderlich ist, um Änderungen vollständig anzuwenden.',
      'Er zijn systeem- of beveiligingsupdates beschikbaar.': 'System- oder Sicherheitsupdates sind verfügbar.',
      'CPU-belasting zeer hoog': 'CPU-Auslastung sehr hoch',
      'Geheugengebruik hoog': 'Speicherauslastung hoch',
      'Opslag bijna vol': 'Speicher fast voll',
      'Temperatuur verhoogd': 'Temperatur erhöht',
      'Docker offline': 'Docker offline',
      'De Docker-service is niet actief.': 'Der Docker-Dienst ist nicht aktiv.',
      'AMP niet gedetecteerd': 'AMP nicht erkannt',
      'Er zijn geen actieve AMP-instances gedetecteerd.': 'Es wurden keine aktiven AMP-Instanzen erkannt.',
      'MinIO offline': 'MinIO offline',
      'De S3-opslagservice is niet actief.': 'Der S3-Speicherdienst ist nicht aktiv.',
      'WireGuard offline': 'WireGuard offline',
      'De wg0-interface is niet beschikbaar.': 'Die wg0-Schnittstelle ist nicht verfügbar.',
      'Schijven controleren': 'Datenträger prüfen',
      'Schijven bekijken': 'Datenträger anzeigen',
      'Netwerk bekijken': 'Netzwerk anzeigen'
    },
    en: {
      'Server Management': 'Server Management',
      'Ga naar MemoNetwork Dashboard': 'Go to MemoNetwork Dashboard',
      'Terug naar dashboard': 'Back to dashboard',
      'Versie controleren…': 'Checking version…',
      'Laatste versie': 'Latest version',
      'Testversie': 'Test version',
      'Update beschikbaar:': 'Update available:',
      'Versiecontrole niet beschikbaar': 'Version check unavailable',
      'Status laden…': 'Loading status…',
      'Nu verversen': 'Refresh now',
      'Systeeminfo': 'System info',
      'AMP openen': 'Open AMP',
      'Schijven': 'Disks',
      'Herstartbeheer': 'Restart management',
      'Pauze': 'Pause',
      'Updates beschikbaar': 'Updates available',
      'Beschikbare systeem- en beveiligingsupdates kunnen worden geïnstalleerd.': 'Available system and security updates can be installed.',
      'Updates openen': 'Open updates',
      'Herstart vereist': 'Restart required',
      'Herstart de server om alle wijzigingen volledig toe te passen.': 'Restart the server to fully apply all changes.',
      'Nu herstarten': 'Restart now',
      'Systeemstatus laden…': 'Loading system status…',
      'Live controle van server en services': 'Live monitoring of server and services',
      'Services online': 'Services online',
      'Hoogste belasting': 'Highest load',
      'Actieve meldingen': 'Active alerts',
      'API reactietijd': 'API response time',
      'Meldingen': 'Alerts',
      'Actuele belasting': 'Current load',
      'Geheugen': 'Memory',
      'Totaal geheugen': 'Total memory',
      'Opslag': 'Storage',
      'Opslag laden…': 'Loading storage…',
      'Server online': 'Server online',
      'Netwerkverkeer': 'Network traffic',
      'Besturingssysteem': 'Operating system',
      'Temperatuur': 'Temperature',
      'Processen': 'Processes',
      'Laatste update': 'Last update',
      'Klik op een service voor live details en beheer': 'Click a service for live details and management',
      'Controleren…': 'Checking…',
      'actief van': 'active of',
      'Actief': 'Active',
      'Gestopt': 'Stopped',
      'S3-opslagservice': 'S3 storage service',
      'Service-details': 'Service details',
      'Sluiten': 'Close',
      'Totaal': 'Total',
      'Per gemount bestandssysteem': 'Per mounted filesystem',
      'Opslaggegevens laden…': 'Loading storage data…',
      'Systeembeheer en Webmin-functies': 'System management and Webmin functions',
      'Systeeminformatie': 'System information',
      'Serverstatus bekijken': 'View server status',
      'Mounts en vrije ruimte': 'Mounts and free space',
      'Netwerkinterfaces': 'Network interfaces',
      'IP en netwerkconfiguratie': 'IP and network configuration',
      'Actieve processen': 'Active processes',
      'Processen bekijken': 'View processes',
      'Pakketupdates': 'Package updates',
      'Updates installeren': 'Install updates',
      'Webmin-logboek': 'Webmin log',
      'Recente acties': 'Recent actions',
      'Opstarten en afsluiten': 'Boot and shutdown',
      'Services en reboot': 'Services and restart',
      'Dashboard configureren': 'Configure dashboard',
      'Klassieke onderdelen': 'Classic components',
      'Geen schijfgegevens gevonden.': 'No disk data found.',
      'Onbekend apparaat': 'Unknown device',
      'bestandssysteem': 'filesystem',
      'Gezond': 'Healthy',
      'Aandacht nodig': 'Needs attention',
      'Kritiek': 'Critical',
      'Alle bewaakte onderdelen zijn in orde': 'All monitored components are healthy',
      'Bezig…': 'Working…',
      'Herstart': 'Restart',
      'Docker-beheer': 'Docker management',
      'AMP-instances': 'AMP instances',
      'MinIO-beheer': 'MinIO management',
      'WireGuard-peers': 'WireGuard peers',
      'Backup-opslag': 'Backup storage',
      'AMP-processen': 'AMP processes',
      'Docker-processen': 'Docker processes',
      'MinIO-processen': 'MinIO processes',
      'Image / netwerk': 'Image / network',
      'Beheer': 'Management',
      'Onbekend image': 'Unknown image',
      'Geen gepubliceerde poorten': 'No published ports',
      'Geen containers gevonden.': 'No containers found.',
      'Instance': 'Instance',
      'Module / poort': 'Module / port',
      'Openen': 'Open',
      'AMP instance': 'AMP instance',
      'poort': 'port',
      'Geen AMP-instances gevonden.': 'No AMP instances found.',
      'Lokaal proces': 'Local process',
      'Niet gedetecteerd': 'Not detected',
      'Endpoint / IP': 'Endpoint / IP',
      'Verkeer / handshake': 'Traffic / handshake',
      'Geen endpoint': 'No endpoint',
      'Geen allowed IPs': 'No allowed IPs',
      'Recent': 'Recent',
      'Inactief': 'Inactive',
      'Geen peers geconfigureerd of zichtbaar.': 'No peers configured or visible.',
      'Geen handshake': 'No handshake',
      'Herstarten…': 'Restarting…',
      'Herstartopdracht wordt verzonden…': 'Sending restart request…',
      'Server wordt nu herstart. Deze pagina zal tijdelijk niet bereikbaar zijn.': 'The server is restarting now. This page will be temporarily unavailable.',
      'Herstart gestart': 'Restart started',
      'Geen data': 'No data',
      'Niet beschikbaar': 'Unavailable',
      'Automatisch: gepauzeerd': 'Automatic: paused',
      'VERBINDEN…': 'CONNECTING…',
      'Inzichten': 'Insights',
      'Inzichten openen': 'Open insights',
      'MemoNetwork Inzichten': 'MemoNetwork Insights',
      'Live diagnostiek voor processen, netwerk, services en systeemmeldingen': 'Live diagnostics for processes, network, services and system alerts',
      'Vernieuwen': 'Refresh',
      'Server gestart': 'Server started',
      'Laatste boot': 'Last boot',
      'mislukt': 'failed',
      'Aandacht vereist': 'Attention required',
      'Geen mislukte units': 'No failed units',
      'Netwerk': 'Network',
      'interfaces gedetecteerd': 'interfaces detected',
      'Snelheid': 'Speed',
      'Ontvangen': 'Received',
      'Verzonden': 'Sent',
      'Geen netwerkinterfaces gevonden.': 'No network interfaces found.',
      'Mislukte systemd-units': 'Failed systemd units',
      'Geen mislukte systemd-units.': 'No failed systemd units.',
      'Aangemelde sessies': 'Logged-in sessions',
      'Geen interactieve sessies gevonden.': 'No interactive sessions found.',
      'Luisterende netwerkpoorten': 'Listening network ports',
      'Lokaal adres': 'Local address',
      'Geen luisterende sockets gevonden of ss is niet beschikbaar.': 'No listening sockets found or ss is unavailable.',
      'Top CPU-processen': 'Top CPU processes',
      'Proces': 'Process',
      'Top geheugenprocessen': 'Top memory processes',
      'Recente systeemwaarschuwingen': 'Recent system warnings',
      'Geen recente waarschuwingen gevonden.': 'No recent warnings found.',
      'MemoNetwork Systeeminformatie': 'MemoNetwork System Information',
      'Hostnaam': 'Hostname',
      'Besturingssysteem': 'Operating system',
      'Processor': 'Processor',
      'Updates beschikbaar': 'Updates available',
      'Backup HDD': 'Backup HDD',
      'Gemount': 'Mounted',
      'Niet gemount': 'Not mounted',
      'Schijven beheren': 'Manage disks',
      'Ja': 'Yes',
      'Nee': 'No',
      'Backup HDD niet gemount': 'Backup HDD not mounted',
      '/mnt/backups staat niet op een apart bestandssysteem. Backups kunnen op de systeemschijf terechtkomen.': '/mnt/backups is not on a separate filesystem. Backups could end up on the system disk.',
      'Ubuntu meldt dat een herstart nodig is om wijzigingen volledig toe te passen.': 'Ubuntu reports that a restart is required to fully apply changes.',
      'Er zijn systeem- of beveiligingsupdates beschikbaar.': 'System or security updates are available.',
      'CPU-belasting zeer hoog': 'CPU load very high',
      'Geheugengebruik hoog': 'Memory usage high',
      'Opslag bijna vol': 'Storage almost full',
      'Temperatuur verhoogd': 'Temperature elevated',
      'De Docker-service is niet actief.': 'The Docker service is not active.',
      'AMP niet gedetecteerd': 'AMP not detected',
      'Er zijn geen actieve AMP-instances gedetecteerd.': 'No active AMP instances were detected.',
      'De S3-opslagservice is niet actief.': 'The S3 storage service is not active.',
      'De wg0-interface is niet beschikbaar.': 'The wg0 interface is unavailable.',
      'Schijven controleren': 'Check disks',
      'Schijven bekijken': 'View disks',
      'Netwerk bekijken': 'View network'
    }
  };

  const preserveWhitespace = (original, translated) => {
    const lead = original.match(/^\s*/)?.[0] || '';
    const tail = original.match(/\s*$/)?.[0] || '';
    return lead + translated + tail;
  };

  const dynamicTranslate = (value) => {
    let s = value;
    if (language === 'nl') {
      if (s === 'Server Management') return 'Serverbeheer';
      return s;
    }

    const de = language === 'de';
    const rules = [
      [/^Automatisch:\s*(\d+(?:\.\d+)?) sec$/, m => de ? `Automatisch: ${m[1]} Sek.` : `Automatic: ${m[1]} sec`],
      [/^(\d+) pakketupdate(s?) beschikbaar$/, m => de ? `${m[1]} Paketupdate${Number(m[1]) === 1 ? '' : 's'} verfügbar` : `${m[1]} package update${Number(m[1]) === 1 ? '' : 's'} available`],
      [/^(\d+) actief$/, m => de ? `${m[1]} aktiv` : `${m[1]} active`],
      [/^(\d+) actieve melding(?:en)?$/, m => de ? `${m[1]} aktive Meldung${Number(m[1]) === 1 ? '' : 'en'}` : `${m[1]} active alert${Number(m[1]) === 1 ? '' : 's'}`],
      [/^(\d+) cores · actuele belasting$/, m => de ? `${m[1]} Kerne · aktuelle Auslastung` : `${m[1]} cores · current load`],
      [/^([0-9.]+ GiB) totaal · ([0-9.]+)%$/, m => de ? `${m[1]} gesamt · ${m[2]}%` : `${m[1]} total · ${m[2]}%`],
      [/^(.+) totaal · (.+) vrij$/, m => de ? `${m[1]} gesamt · ${m[2]} frei` : `${m[1]} total · ${m[2]} free`],
      [/^(.+) gebruikt · (.+) vrij · (.+) totaal$/, m => de ? `${m[1]} belegt · ${m[2]} frei · ${m[3]} gesamt` : `${m[1]} used · ${m[2]} free · ${m[3]} total`],
      [/^([0-9.]+)% gebruikt$/, m => de ? `${m[1]}% belegt` : `${m[1]}% used`],
      [/^(\d+) peer(s?) · (.+)$/, m => de ? `${m[1]} Peer${Number(m[1]) === 1 ? '' : 's'} · ${dynamicTranslate(m[3])}` : `${m[1]} peer${Number(m[1]) === 1 ? '' : 's'} · ${dynamicTranslate(m[3])}`],
      [/^(\d+) sec geleden$/, m => de ? `vor ${m[1]} Sek.` : `${m[1]} sec ago`],
      [/^(\d+) min geleden$/, m => de ? `vor ${m[1]} Min.` : `${m[1]} min ago`],
      [/^(\d+) uur geleden$/, m => de ? `vor ${m[1]} Std.` : `${m[1]} hr ago`],
      [/^(\d+) dagen geleden$/, m => de ? `vor ${m[1]} Tagen` : `${m[1]} days ago`],
      [/^(\d+) dag(?:en)?, (\d+) uur, (\d+) min$/, m => de ? `${m[1]} Tag${Number(m[1]) === 1 ? '' : 'e'}, ${m[2]} Std., ${m[3]} Min.` : `${m[1]} day${Number(m[1]) === 1 ? '' : 's'}, ${m[2]} hr, ${m[3]} min`],
      [/^(\d+) uur, (\d+) min$/, m => de ? `${m[1]} Std., ${m[2]} Min.` : `${m[1]} hr, ${m[2]} min`],
      [/^(\d+) min$/, m => de ? `${m[1]} Min.` : `${m[1]} min`],
      [/^Docker-actie mislukt:\s*(.+)$/, m => de ? `Docker-Aktion fehlgeschlagen: ${m[1]}` : `Docker action failed: ${m[1]}`],
      [/^(.+): (start|stop|restart) uitgevoerd$/, m => de ? `${m[1]}: ${m[2]} ausgeführt` : `${m[1]}: ${m[2]} completed`],
      [/^De actuele CPU-belasting is ([0-9.]+)%\.$/, m => de ? `Die aktuelle CPU-Auslastung beträgt ${m[1]}%.` : `Current CPU load is ${m[1]}%.`],
      [/^Het geheugengebruik is ([0-9.]+)%\.$/, m => de ? `Die Speicherauslastung beträgt ${m[1]}%.` : `Memory usage is ${m[1]}%.`],
      [/^Een bestandssysteem is ([0-9.]+)% gevuld\.$/, m => de ? `Ein Dateisystem ist zu ${m[1]}% belegt.` : `A filesystem is ${m[1]}% full.`],
      [/^De gemeten temperatuur is ([0-9.]+)°C\.$/, m => de ? `Die gemessene Temperatur beträgt ${m[1]}°C.` : `The measured temperature is ${m[1]}°C.`],
      [/^(\d+) mislukt$/, m => de ? `${m[1]} fehlgeschlagen` : `${m[1]} failed`],
      [/^(\d+) actief$/, m => de ? `${m[1]} aktiv` : `${m[1]} active`],
      [/^(\d+) interfaces gedetecteerd$/, m => de ? `${m[1]} Schnittstellen erkannt` : `${m[1]} interfaces detected`],
      [/^([0-9]+) cores$/, m => de ? `${m[1]} Kerne` : `${m[1]} cores`],
      [/^Herstart kon niet worden gestart:\s*(.+)$/, m => de ? `Neustart konnte nicht gestartet werden: ${m[1]}` : `Restart could not be started: ${m[1]}`],
      [/^Server nu herstarten\? Alle actieve verbindingen worden verbroken\.$/, () => de ? 'Server jetzt neu starten? Alle aktiven Verbindungen werden getrennt.' : 'Restart the server now? All active connections will be disconnected.'],
      [/^(.+) stoppen\?$/, m => de ? `${m[1]} stoppen?` : `Stop ${m[1]}?`],
      [/^(.+) herstarten\?$/, m => de ? `${m[1]} neu starten?` : `Restart ${m[1]}?`],
      [/^geen handshake$/, () => de ? 'kein Handshake' : 'no handshake']
    ];
    for (const [pattern, replacer] of rules) {
      const match = s.match(pattern);
      if (match) return replacer(match);
    }
    return s;
  };

  const translateString = (value) => {
    if (typeof value !== 'string' || !value.trim()) return value;
    const trimmed = value.trim();
    const mapped = exact[language]?.[trimmed];
    const translated = mapped !== undefined ? mapped : dynamicTranslate(trimmed);
    return translated === trimmed ? value : preserveWhitespace(value, translated);
  };

  const isMemoDocument = (doc) => {
    if (!doc?.documentElement) return false;
    try {
      const path = doc.defaultView?.location?.pathname || '';
      return !!doc.querySelector('.v3, .memo-brand, #memo-version-footer') ||
        path === '/right.cgi' || path === '/memocraft-theme/memo-dashboard.cgi' ||
        path === '/memo-network/system-info.cgi';
    } catch (_error) {
      return false;
    }
  };

  const translateAttributes = (root) => {
    if (!root?.querySelectorAll) return;
    const elements = [];
    if (root.nodeType === 1) elements.push(root);
    elements.push(...root.querySelectorAll('[title],[aria-label],[placeholder]'));
    for (const el of elements) {
      for (const attr of ['title', 'aria-label', 'placeholder']) {
        if (!el.hasAttribute?.(attr)) continue;
        const oldValue = el.getAttribute(attr);
        const newValue = translateString(oldValue);
        if (newValue !== oldValue) el.setAttribute(attr, newValue);
      }
    }
  };

  const translateTree = (doc, root = doc.body) => {
    if (!root || !isMemoDocument(doc)) return;
    doc.documentElement.lang = language;
    const walker = doc.createTreeWalker(root, 4);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const parent = node.parentElement;
      if (!parent || /^(SCRIPT|STYLE|NOSCRIPT|PRE|CODE|TEXTAREA)$/i.test(parent.tagName)) continue;
      const oldValue = node.nodeValue;
      const newValue = translateString(oldValue);
      if (newValue !== oldValue) node.nodeValue = newValue;
    }
    translateAttributes(root.nodeType === 9 ? doc.documentElement : root);
  };

  const wrapDialogs = (win) => {
    if (!win || wrappedWindows.has(win)) return;
    try {
      const nativeConfirm = win.confirm.bind(win);
      const nativeAlert = win.alert.bind(win);
      win.confirm = message => nativeConfirm(translateString(String(message)));
      win.alert = message => nativeAlert(translateString(String(message)));
      wrappedWindows.add(win);
    } catch (_error) {}
  };

  const observeDocument = (doc) => {
    if (!doc?.body || !isMemoDocument(doc)) return;
    translateTree(doc, doc.body);
    wrapDialogs(doc.defaultView);
    if (observed.has(doc)) return;
    observed.add(doc);
    const Observer = doc.defaultView?.MutationObserver || MutationObserver;
    const observer = new Observer(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          const node = mutation.target;
          const parent = node.parentElement;
          if (!parent || /^(SCRIPT|STYLE|NOSCRIPT|PRE|CODE|TEXTAREA)$/i.test(parent.tagName)) continue;
          const translated = translateString(node.nodeValue);
          if (translated !== node.nodeValue) node.nodeValue = translated;
        }
        for (const node of mutation.addedNodes || []) {
          if (node.nodeType === 3) {
            const translated = translateString(node.nodeValue);
            if (translated !== node.nodeValue) node.nodeValue = translated;
          } else if (node.nodeType === 1) {
            translateTree(doc, node);
          }
        }
      }
    });
    observer.observe(doc.body, {subtree:true, childList:true, characterData:true});
  };

  const scanFrames = () => {
    if (!ready) return;
    observeDocument(document);
    try {
      if (parent && parent !== window) {
        for (const frame of Array.from(parent.frames || [])) {
          try { observeDocument(frame.document); } catch (_error) {}
        }
      }
    } catch (_error) {}
  };

  const detectLanguage = async () => {
    try {
      const response = await fetch(`${endpoint}?_=${Date.now()}`, {credentials:'same-origin', cache:'no-store'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const value = String(data.language || '').toLowerCase();
      language = value === 'de' || value === 'nl' || value === 'en' ? value : 'en';
    } catch (_error) {
      const browser = String(navigator.language || 'en').toLowerCase();
      language = browser.startsWith('de') ? 'de' : browser.startsWith('nl') ? 'nl' : 'en';
    }
    ready = true;
    window.MemoNetworkI18n.language = language;
    scanFrames();
  };

  window.MemoNetworkI18n = {
    language,
    translate: translateString,
    refresh: scanFrames
  };

  detectLanguage();
  window.addEventListener('load', scanFrames);
  setInterval(scanFrames, 900);
})();
