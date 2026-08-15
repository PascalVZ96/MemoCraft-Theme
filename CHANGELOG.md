# MemoNetwork changelog

## v5.0.0 — in ontwikkeling

De volgende grote MemoNetwork-release. Ontwikkeling vindt plaats op de aparte `v5` branch totdat de release stabiel genoeg is om naar `main` te gaan.

### Alpha 17

- Het tabblad **Overzicht** heeft nu een geïntegreerd **Operations Center** dat systeem, services, backups, beveiliging, netwerk en internetprestaties centraal samenbrengt.
- Zes compacte bronkaarten tonen direct of een onderdeel gezond, onbekend, aandachtspunt of kritiek is en springen met één klik naar het relevante beheeronderdeel.
- Kritieke en waarschuwingsmeldingen worden automatisch geprioriteerd; het tabblad Overzicht krijgt een compacte badge met het actuele aantal belangrijke aandachtspunten.
- Systeembewaking combineert CPU, RAM, schijfgebruik, temperatuur, rebootstatus en beschikbare pakketupdates zonder extra beheeracties uit te voeren.
- Servicebewaking controleert Docker, AMP, MinIO en WireGuard en bundelt offline platformservices in één duidelijke melding.
- Backupbewaking gebruikt de bestaande Backup Center-status voor mountcontrole, MinIO-status en versheid van de nieuwste gevonden backup.
- Security Center-signalen zoals uitgeschakelde bescherming, een stilgevallen scanner, actieve blokkades, recente detecties en backendfouten verschijnen centraal in Overzicht.
- De laatste netwerkcontrole wordt meegenomen met score, ouderdom en een waarschuwing wanneer de score onvoldoende is of de controle verouderd raakt.
- Internetbewaking gebruikt de bestaande speedtestgeschiedenis en kan een sterke snelheidsdaling signaleren ten opzichte van de mediaan van recente betrouwbare metingen; hoge latency en verouderde metingen worden eveneens gemarkeerd.
- Iedere statusbron heeft een afzonderlijke timeout, zodat één trage of niet-beschikbare backend het Control Center niet kan laten vastlopen; gedeeltelijke resultaten blijven zichtbaar.
- Operations Center vernieuwt automatisch maximaal eenmaal per minuut en kan ook handmatig volledig worden ververst.
- De nieuwe interface ondersteunt Nederlands, Duits en Engels en gebruikt uitsluitend bestaande read-only statusendpoints.

### Alpha 16

- Het tabblad **Infrastructuur** heeft nu een geïntegreerd **Backup Center** voor de backup-HDD en MinIO-opslag.
- `/mnt/backups` wordt onafhankelijk gecontroleerd op bestaan, echte mount, brondevice, bestandssysteem, capaciteit, gebruikte ruimte en vrije ruimte.
- MinIO wordt automatisch herkend wanneer het als Docker-container draait; containerstatus en de gekoppelde opslagbron worden direct weergegeven.
- Een handmatige **Backupscan** zoekt naar de nieuwste backupbestanden zonder bij iedere dashboard-refresh de volledige backupschijf te doorlopen.
- De scan bewaart maximaal de tien nieuwste gevonden bestanden en toont de vijf nieuwste compact in het Control Center.
- De nieuwste backup krijgt een versheidsstatus: actueel tot 24 uur, aandacht tussen 24 en 72 uur en verouderd na 72 uur.
- Tijdens een scan worden aantal gevonden bestanden en gescande datagrootte bijgehouden; een veiligheidslimiet van 15 seconden en maximaal één miljoen bestanden voorkomt onbeperkte belasting.
- Een onvolledige scan wordt duidelijk als gedeeltelijk gemarkeerd in plaats van onterecht als volledig resultaat gepresenteerd.
- De backupscan is POST-only met de MemoNetwork-requestheader, gebruikt een vaste backupmap en een lock tegen dubbele scans; er wordt geen vrij pad of shellcommando vanuit de browser geaccepteerd.
- `build.sh` maakt voortaan alle MemoNetwork CGI- en Perl-backends uitvoerbaar tijdens het bouwen, zodat nieuwe beheerendpoints consistent worden verpakt.
- Backup Center ondersteunt Nederlands, Duits en Engels.

### Alpha 15

- Het tabblad **Diagnostiek** heeft nu een geïntegreerd **Security Center** voor automatische bescherming tegen duidelijke SSH-brute-forceaanvallen.
- Er zijn drie modi: **Uit**, **Alleen detecteren** en **Automatisch blokkeren**.
- De scanner telt alleen herkenbare mislukte SSH/PAM-aanmeldingen en grijpt pas in na 5 pogingen vanaf hetzelfde externe IPv4-adres binnen 10 minuten.
- Lokale, private, carrier-grade NAT-, multicast- en gereserveerde IPv4-adressen worden nooit automatisch geblokkeerd.
- Automatische blokkades gebruiken een eigen `memonetwork_defense` nftables-table en set met ingebouwde timeout, zodat bestaande UFW-regels niet worden gewijzigd.
- Een automatische blokkade duurt standaard 60 minuten en verloopt daarna vanzelf in nftables.
- Het Security Center toont actieve blokkades, detecties van de laatste 24 uur, scannerstatus, laatste scan en recente beveiligingsgebeurtenissen.
- Actieve blokkades kunnen rechtstreeks vanuit het Control Center handmatig worden opgeheven.
- Bij het inschakelen van automatische blokkering probeert MemoNetwork het huidige publieke beheer-IP automatisch aan de allowlist toe te voegen.
- Detectie en automatische bescherming draaien via een eigen systemd-timer iedere 5 minuten; uitschakelen stopt die timer.
- Beheeracties zijn POST-only met de bestaande MemoNetwork-requestheader; alle IP-adressen en modi worden streng gevalideerd en externe commando's worden zonder shell-interpolatie uitgevoerd.
- Security Center ondersteunt Nederlands, Duits en Engels.

### Alpha 14

- Het tabblad **Diagnostiek** heeft nu een geïntegreerd **Log Center** voor recente systemd-journalmeldingen.
- Logregels kunnen direct worden gefilterd op laatste uur, 6 uur, 24 uur of sinds de huidige serverstart.
- Niveaufilters voor alle meldingen, waarschuwingen, fouten en kritieke meldingen zijn toegevoegd.
- Bron- en unitfilters worden automatisch opgebouwd uit de werkelijk gevonden journalbronnen.
- Een lokale zoekfunctie doorzoekt bron, unit, PID en berichttekst zonder extra servercommando's uit te voeren.
- Samenvattingskaarten tonen aantallen logregels, waarschuwingen, fouten en kritieke meldingen voor de gekozen periode.
- Het Log Center toont maximaal 100 gefilterde regels tegelijk en de backend begrenst de journaluitvoer voor een voorspelbare belasting.
- Automatisch verversen staat standaard aan en vernieuwt iedere 30 seconden zolang Diagnostiek geopend is; dit kan direct worden uitgezet.
- De backend is volledig read-only en accepteert alleen een vaste allowlist van tijdsperiodes; er wordt geen vrije journalctl- of shellinvoer uitgevoerd.
- Log Center ondersteunt Nederlands, Duits en Engels.

### Alpha 13

- Het tabblad **Services** heeft nu een geïntegreerde Docker Container Monitor voor alle Docker-containers en Docker-gebaseerde MinIO-installaties.
- Iedere container krijgt naast Starten, Stoppen en Herstarten een aparte **Monitor**-knop.
- De monitor toont live CPU-gebruik, geheugenpercentage, geheugengebruik, netwerk-I/O, schijf-I/O, PID-aantal, herstarts en uptime.
- Docker health-status, image, poorten, exitcode en korte container-ID zijn direct zichtbaar.
- Tot 20 actieve processen binnen de container worden veilig read-only weergegeven.
- De laatste 120 Docker-logregels worden geïntegreerd getoond met een lokale zoek/filterfunctie en een knop om logs te kopiëren.
- Containergegevens worden standaard iedere vijf seconden automatisch ververst zolang de monitor geopend is; automatisch verversen kan direct worden uitgezet.
- De nieuwe backend accepteert alleen geldige containernamen die daadwerkelijk in `docker ps -a` voorkomen en voert alle Docker-commando's als losse argumenten uit zonder shell-interpolatie.
- De monitor is volledig read-only; bestaande start/stop/herstartacties blijven via het afzonderlijke beveiligde beheerendpoint lopen.
- Container Monitor ondersteunt Nederlands, Duits en Engels.

### Alpha 12

- De internet-speedtest heeft nu een permanente prestatiegeschiedenis in plaats van alleen de laatste meting.
- Tot 90 speedtests worden server-side bewaard; het Control Center toont alleen de drie nieuwste metingen zodat Infrastructuur compact blijft.
- Een aparte **Speedtest geschiedenis**-pagina bevat de volledige opgeslagen historie, een grotere grafiek en beheeropties.
- Individuele slechte speedtestmetingen kunnen veilig worden verwijderd; ook de volledige geschiedenis kan na bevestiging worden geleegd.
- Gemiddelde download, gemiddelde upload, gemiddelde ping en beste downloadsnelheid worden automatisch berekend.
- Handmatige en automatische speedtests worden apart gemarkeerd in de geschiedenis.
- De bestaande `memonetwork-speedtest.timer` wordt automatisch uitgelezen en toont status, schema en eerstvolgende geplande run in het Control Center.
- De eerder ingestelde nachtelijke speedtest blijft volledig via systemd lopen; het dashboard maakt geen extra planning aan en start geen onverwachte tests.
- Een bestaande laatste speedtest wordt automatisch als eerste geschiedenispunt gebruikt, zodat de grafiek zonder verlies van de huidige meting begint.
- Testserverweergave is opgeschoond om foutieve `Â·`-tekens in oudere speedtestresultaten te corrigeren.
- Voor `speedtest-cli` gebruikt MemoNetwork de geteste server **toob Ltd / London** met server-ID `26922`, zodat opeenvolgende metingen betrouwbaar vergelijkbaar zijn.
- De backend controleert dat de speedtest daadwerkelijk server `26922` gebruikte en slaat een meting anders niet op.
- Geschiedenis, planning en nieuwe labels ondersteunen Nederlands, Duits en Engels.

### Alpha 11

- Het tabblad **Diagnostiek** heeft nu een geïntegreerde netwerkcontrole voor route, gateway, internetbereikbaarheid, DNS, packet loss en latency.
- De netwerkcontrole toont een compacte netwerkscore van 0–100 en markeert direct of aandacht nodig is.
- Standaardinterface, gateway, bron-IP en actieve nameservers worden automatisch gedetecteerd.
- Internetbereikbaarheid wordt gemeten met een vast diagnostisch doel; DNS-resolutie gebruikt eveneens een vast doel en accepteert geen vrije hostinvoer.
- Gateway- en internetmetingen tonen latency en packet loss afzonderlijk.
- De laatste netwerkcontrole wordt server-side bewaard en blijft zichtbaar na opnieuw openen van Webmin.
- De controle start alleen handmatig en gebruikt een POST-only MemoNetwork-endpoint met requestheader, lock tegen dubbele controles en timeout.
- Het nieuwe netwerkpaneel wordt automatisch opnieuw ingevoegd wanneer het bestaande live Diagnostiek-scherm ververst.
- Netwerkdiagnostiek ondersteunt Nederlands, Duits en Engels.
- De v5-runtime-loader is opgeschoond zodat Services, Diagnostiek, Infrastructuur, Speedtest en Netwerkcontrole via één consistente loader worden geladen.

### Alpha 10

- In het v5-tabblad **Infrastructuur** is een volledig geïntegreerde internet-speedtest toegevoegd.
- De speedtest draait alleen handmatig om onnodig bandbreedtegebruik te voorkomen.
- Download, upload en ping worden duidelijk als aparte live meetwaarden getoond.
- Testserver, provider, extern IP en tijdstip van de laatste meting worden bewaard en opnieuw weergegeven.
- Resultaten worden server-side gecachet zodat de laatste meting zichtbaar blijft tot een nieuwe test wordt uitgevoerd.
- De speedtest ondersteunt zowel `speedtest-cli` als de officiële Ookla `speedtest` CLI wanneer die aanwezig is.
- Ontbreekt een speedtest-client, dan toont het Control Center direct het installatiecommando `sudo apt install speedtest-cli -y`.
- Speedtests gebruiken een afzonderlijk beveiligd CGI-endpoint met POST-only uitvoering, MemoNetwork-requestheader, lock tegen dubbele tests en een timeout.
- De interface toont tijdens de test een duidelijke voortgangsstatus en blokkeert dubbele starts.
- Speedtest-interface en foutmeldingen ondersteunen NL / DE / EN.

### Alpha 9

- Het tabblad **Infrastructuur** is vervangen door een volledige live v5-interface.
- Systeemschijf en backup-HDD worden apart weergegeven met mountpoint, device, filesystem, capaciteit en gebruikspercentage.
- De backup-mount wordt expliciet gecontroleerd en krijgt een duidelijke foutmelding wanneer `/mnt/backups` niet op een apart bestandssysteem staat.
- Bestandssystemen vanaf 85% gebruik krijgen een opslagwaarschuwing.
- Serveridentiteit, OS, kernel, processor, cores, uptime, processen en temperatuur zijn direct zichtbaar.
- Docker, AMP, MinIO en WireGuard krijgen een compacte platformstatus.
- Rebootstatus, beschikbare updates en actuele netwerkactiviteit zijn toegevoegd.
- Infrastructuur ondersteunt live verversing en NL / DE / EN.

### Alpha 8

- Het tabblad **Diagnostiek** is omgebouwd van losse links naar een geïntegreerd live diagnostiekdashboard.
- Netwerkinterfaces, IPv4-adressen, snelheid en verkeer zijn direct zichtbaar.
- Mislukte systemd-units en aangemelde sessies zijn geïntegreerd.
- Luisterende netwerkpoorten worden rechtstreeks in het Control Center weergegeven.
- Top CPU- en geheugenprocessen zijn toegevoegd.
- Recente systeemwaarschuwingen worden binnen v5 weergegeven.
- Diagnostiek ondersteunt handmatige en automatische verversing en NL / DE / EN.

### Alpha 7

- Service-details in het v5 Control Center zijn uitgebreid met directe beheeracties.
- Docker-containers kunnen vanuit het detailpaneel worden gestart, gestopt en herstart.
- MinIO kan direct vanuit het Control Center worden beheerd wanneer MinIO als Docker-container draait.
- Stop- en herstartacties vragen eerst om bevestiging.
- Acties tonen direct een duidelijke bezig-, succes- of foutstatus zonder de pagina te verlaten.
- Na een Docker-actie worden de live servicegegevens meteen opnieuw geladen.
- AMP krijgt een directe knop naar het AMP-paneel en WireGuard een koppeling naar netwerkbeheer.
- Beheeracties en meldingen ondersteunen Nederlands, Duits en Engels.

### Alpha 6

- De pakketupdatepagina gebruikt nu een eigen MemoNetwork v5-header in plaats van Webmins oude gecentreerde legacy-header.
- De oude image-based Webmin-tabs zijn vervangen door moderne functionele tabs voor pakketupdates, geplande updates en pakketbronnen.
- Dubbele actieknoppen boven en onder de pakketlijst zijn verwijderd uit beeld en vervangen door één duidelijke actiebalk.
- Aantal gevonden updates, selectie-acties en pakketbeheer staan nu logisch bij elkaar.
- Het grote omkaderde Webmin-tabpaneel is verwijderd; filterblok en pakketlijst worden als afzonderlijke compacte kaarten weergegeven.
- Webmins bestaande update- en tabfunctionaliteit blijft onderliggend behouden.
- Installatie-overlay en live voortgangsstatus blijven onderdeel van de nieuwe interface.

### Alpha 5

- De pakketupdatepagina is opnieuw opgebouwd rond Webmins echte native classes in plaats van generieke tabelherkenning.
- Oude witte `bgcolor`-spacers, image-corners en legacy tabopmaak worden nu gericht geneutraliseerd.
- **Package Updates / Scheduled Upgrades / Package Repositories** blijven functioneel, maar krijgen een compacte donkere MemoNetwork-tabstijl.
- Het zoek/filterblok, de pakketlijst en actieknoppen hebben nu elk een eigen gerichte stijl zonder Webmins layout-tabellen te vervormen.
- De installatie-overlay en voortgangsstatus van Alpha 4 blijven behouden.
- Pakketupdatepagina blijft NL / DE / EN ondersteunen.

### Alpha 4

- De Webmin-pagina **Software pakketten Update** heeft een volledige MemoNetwork v5-opfrisbeurt gekregen.
- Pakketlijsten, bevestigingsschermen, invoervelden en actieknoppen zijn rustiger en beter leesbaar gemaakt.
- **Installeer Nu** toont direct duidelijke voortgang in plaats van een pagina die lijkt vast te lopen.
- Tijdens de installatie blijft een statuskaart zichtbaar met live uitvoer uit Webmins pakketupdateproces.
- Als APT/dpkg tijdelijk geen nieuwe regels toont, blijft zichtbaar dat de installatie nog bezig is.
- Na afronding verschijnt een duidelijke successtatus met een knop terug naar de pakketupdates.
- De bestaande Webmin-installatiewerking blijft intact; de nieuwe runtime verandert alleen presentatie en voortgangsfeedback.
- Pakketupdate-interface en voortgangsteksten ondersteunen NL / DE / EN.
- De versie-indicatie in het v5 Control Center wordt automatisch gelijkgetrokken met de geïnstalleerde alpha-versie.

### Alpha 3

- Servicekaarten in het v5 Control Center zijn nu klikbaar.
- Docker toont per container naam, status, image en poorten.
- AMP toont per instance naam, module, paneelpoort en actieve status.
- MinIO toont modus, container, status, poorten en container-ID.
- WireGuard toont interface, peers, endpoint, allowed IPs, handshake-leeftijd en verkeer per peer.
- Geselecteerde services krijgen een duidelijke highlight en een uitklapbaar live detailpaneel.
- Service-details worden automatisch live bijgewerkt en ondersteunen toetsenbordbediening.
- Service-detailteksten ondersteunen NL / DE / EN.

### Alpha 2

- v5-overzicht blijft standaard compact en rustiger dan het v4-dashboard.
- Nieuwe knop **Meer details / Minder details** toegevoegd; de voorkeur blijft lokaal onthouden.
- Uitgebreide status toont optioneel uptime, OS, kernel, processor, processen, backup-HDD, services en opslagdetails.
- Beschikbare updates zijn direct klikbaar vanuit de samenvatting.
- Meldingen met een beheerlink zijn volledig klikbaar en krijgen een duidelijke actieknop.
- Update-acties gebruiken een beter leesbare knop met hoger contrast.
- Vanuit het detailoverzicht kan direct naar alle Services of Infrastructuur worden gesprongen.
- NL / DE / EN vertalingen uitgebreid voor de nieuwe detailmodus.

### Alpha 1

- Nieuwe zelfstandige **MemoNetwork v5 Control Center** preview toegevoegd.
- Nieuwe v5-navigatie met Overzicht, Services, Infrastructuur en Diagnostiek.
- Live CPU-, RAM-, opslag-, netwerk-, load- en temperatuurinformatie via de bestaande MemoNetwork API.
- Nieuwe healthscore en centrale meldingenweergave.
- Service-overzicht voor Docker, AMP, MinIO en WireGuard.
- Opslagweergave per bestandssysteem en aparte controle van de backup-mount.
- Snelle beheerkoppelingen naar systeeminformatie, updates, AMP en Inzichten.
- Control Center ondersteunt direct Nederlands, Duits en Engels via de actieve MemoNetwork/Webmin-taal.
- Het bestaande v4-dashboard blijft tijdens ontwikkeling beschikbaar; vanuit de v5-testbranch verschijnt een aparte knop **Control Center v5**.

## v4.9.0 — overgeslagen

Deze versie is bewust overgeslagen. Na de stabiele 4.6-lijn gaat de ontwikkeling rechtstreeks verder naar v5 vanwege de omvang van de volgende update.

## v4.8.0 — overgeslagen

Deze versie is bewust overgeslagen en bestaat alleen als onderdeel van de versiegeschiedenis.

## v4.7.0 — overgeslagen

Deze versie is bewust overgeslagen en bestaat alleen als onderdeel van de versiegeschiedenis.

## v4.6.3 — 11-08-2026

- Meertalige MemoNetwork-interface voor Nederlands, Duits en Engels.
- Taal volgt de per-gebruiker ingestelde Webmin-taal.
- Verbeterde Duitse dashboardterminologie, waaronder `Netzwerkaktivität`.
- Opgeschoonde dashboard-header.
- Verouderde v4.5 RC-badge verwijderd van de Inzichten-pagina.
- Live dashboard, Docker-beheer, AMP, MinIO, WireGuard, opslag, waarschuwingen en Inzichten blijven onderdeel van de stabiele 4.6-lijn.

## Oudere releases

De 4.x-reeks bevatte onder andere de grote dashboardrewrite, servicebeheer, opslagbewaking, Inzichten en de meertalige interface. Zie de Git-historie voor de afzonderlijke wijzigingen en commits.
