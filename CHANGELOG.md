# MemoNetwork changelog

## v5.0.0 — in ontwikkeling

De volgende grote MemoNetwork-release. Ontwikkeling vindt plaats op de aparte `v5` branch totdat de release stabiel genoeg is om naar `main` te gaan.

### Alpha 12

- De internet-speedtest heeft nu een permanente prestatiegeschiedenis in plaats van alleen de laatste meting.
- Tot 90 speedtests worden server-side bewaard; het Control Center toont de laatste 30 als download- en uploadgrafiek.
- Gemiddelde download, gemiddelde upload, gemiddelde ping en beste downloadsnelheid worden automatisch berekend.
- De laatste zes metingen worden als compacte tabel getoond met datum, download, upload, ping en bron van de meting.
- Handmatige en automatische speedtests worden voortaan apart gemarkeerd in de geschiedenis.
- De bestaande `memonetwork-speedtest.timer` wordt automatisch uitgelezen en toont status, schema en eerstvolgende geplande run in het Control Center.
- De eerder ingestelde nachtelijke speedtest blijft volledig via systemd lopen; het dashboard maakt geen extra planning aan en start geen onverwachte tests.
- Een bestaande laatste speedtest wordt automatisch als eerste geschiedenispunt gebruikt, zodat de grafiek zonder verlies van de huidige meting begint.
- Testserverweergave is opgeschoond om foutieve `Â·`-tekens in oudere speedtestresultaten te corrigeren.
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
- Speedtest-interface en foutmeldingen ondersteunen Nederlands, Duits en Engels.

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
