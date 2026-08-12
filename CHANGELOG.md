# MemoNetwork changelog

## v5.0.0 — in ontwikkeling

De volgende grote MemoNetwork-release. Ontwikkeling vindt plaats op de aparte `v5` branch totdat de release stabiel genoeg is om naar `main` te gaan.

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