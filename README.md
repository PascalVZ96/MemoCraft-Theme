# MemoNetwork Webmin Theme

MemoNetwork is een zelfstandig Webmin-thema met een eigen serverdashboard en MemoNetwork-beheerpagina's. Het thema is gebaseerd op Webmins Framed/Gray Theme-structuur, maar wordt als aparte theme package gebouwd zodat bestaande Webmin-thema's niet hoeven te worden aangepast.

**Huidige stabiele versie: v4.6.0**  
Getest met Webmin 2.653 op Ubuntu Server.

## Belangrijkste functies

### MemoNetwork Dashboard

Het dashboard toont live informatie over de server, waaronder:

- CPU-belasting en load average;
- RAM-gebruik;
- netwerkverkeer met live grafieken;
- uptime;
- opslaggebruik per gemount bestandssysteem;
- aparte bewaking van `/mnt/backups`;
- server healthscore en API-reactietijd;
- Ubuntu-, kernel-, processor- en procesinformatie;
- beschikbare pakketupdates;
- waarschuwing wanneer een reboot nodig is;
- instelbare automatische refresh.

### Meertalig: NL / DE / EN

Vanaf v4.6 volgt MemoNetwork automatisch de taal die de ingelogde gebruiker in Webmin heeft geselecteerd.

Ondersteunde talen:

- Nederlands (`NL`);
- Duits (`DE`);
- Engels (`EN`).

De taal geldt voor het dashboard, dynamische statistieken, meldingen, service-details, opslaginformatie, systeeminformatie, Inzichten en de MemoNetwork-interface. Wisselen tussen Webmin-talen wordt automatisch overgenomen zonder een aparte MemoNetwork-taalinstelling.

### Servicebewaking

Het dashboard bewaakt:

- Docker;
- AMP;
- MinIO;
- WireGuard.

Per service zijn aanvullende live details beschikbaar.

### Docker-beheer

Docker-containers worden rechtstreeks in het dashboard weergegeven met onder andere:

- containernaam;
- container-ID;
- image;
- status/state;
- poorten;
- actief/gestopt.

Containers kunnen vanuit het MemoNetwork-dashboard worden gestart, gestopt en herstart.

### AMP

AMP-instances worden automatisch gedetecteerd. Waar beschikbaar toont MemoNetwork ook module- en poortinformatie. Vanuit het dashboard kan AMP direct worden geopend.

### MinIO

MinIO wordt zowel als lokaal proces als Docker-container herkend. Wanneer MinIO via Docker draait worden containerstatus, ID en poorten meegenomen in de live status.

### WireGuard

Voor `wg0` toont het dashboard onder andere:

- aantal peers;
- public key;
- endpoint;
- allowed IPs;
- laatste handshake;
- ontvangen en verzonden data;
- persistent keepalive.

### Meldingen

MemoNetwork genereert waarschuwingen voor onder andere:

- backup-HDD niet correct gemount;
- reboot vereist;
- beschikbare systeemupdates;
- hoge CPU-belasting;
- hoog RAM-gebruik;
- bijna volle opslag;
- verhoogde temperatuur;
- Docker, AMP, MinIO of WireGuard offline.

### Inzichten

Vanaf v4.5 bevat MemoNetwork een aparte **Inzichten**-pagina met extra diagnostiek:

- netwerkinterfaces en IPv4-adressen;
- linkstatus en interfacesnelheid;
- totale RX/TX-data per interface;
- top CPU-processen;
- top RAM-processen;
- mislukte systemd-units;
- actieve gebruikerssessies;
- luisterende netwerkpoorten;
- boot-tijd en load average;
- recente waarschuwingen uit `journalctl`.

## Repository-structuur

```text
memo-network/       MemoNetwork CGI/API-pagina's
memocraft-theme/    Webmin-theme en dashboard
src/                eigen CSS en JavaScript
build.sh            bouwt het installabele Webmin-pakket
version.json        huidige MemoNetwork-versie
```

Tijdens `build.sh` worden de MemoNetwork-aanpassingen in de theme-bestanden verwerkt, wordt de dashboard-taalruntime direct in `right.cgi` ingebed en wordt het volledige Webmin-theme-pakket gebouwd.

## Vereisten

Voor lokaal bouwen:

- Linux / Ubuntu;
- Bash;
- Python 3;
- Git;
- tar + gzip.

Voor alle dashboardfuncties zijn de bijbehorende services uiteraard alleen beschikbaar wanneer ze op de server zijn geïnstalleerd, bijvoorbeeld Docker, AMP, MinIO en WireGuard.

## Installeren of bijwerken vanaf GitHub

Op de server:

```bash
cd ~/MemoCraft-Theme

git stash push -u -m "lokale wijzigingen voor update"
git switch main
git pull

./build.sh
sudo tar -xzf dist/memocraft-theme.wbt.gz -C /usr/share/webmin/
```

Ververs Webmin daarna volledig. Onderaan de zijbalk staat de geïnstalleerde **MemoNetwork Edition**-versie en wordt gecontroleerd of `main` een nieuwere versie bevat.

## Alleen bouwen

```bash
chmod +x build.sh
./build.sh
```

Het pakket wordt gemaakt als:

```text
dist/memocraft-theme.wbt.gz
```

`build.sh` controleert onder andere of de vereiste MemoNetwork- en Webmin-bestanden aanwezig zijn voordat het pakket als gereed wordt gemeld.

## Ontwikkelworkflow

`main` is bedoeld als stabiele branch. Grotere releases worden eerst op een aparte versiebranch gebouwd en getest. Pas nadat de release op de server goed werkt, wordt die branch naar `main` doorgeschoven en wordt `version.json` op de definitieve releaseversie gezet.

Dit maakt het mogelijk om grotere dashboardupdates te testen zonder de laatst werkende versie op `main` direct te vervangen.

## Veiligheid

Beheeracties zoals reboot en Docker start/stop/restart lopen via MemoNetwork CGI-endpoints en accepteren alleen de daarvoor bedoelde dashboard-POST-aanvragen. Container-namen en acties worden aan de serverkant gevalideerd voordat een opdracht wordt uitgevoerd.

Omdat het dashboard beheerrechten kan uitvoeren, hoort Webmin alleen via een vertrouwde HTTPS-verbinding bereikbaar te zijn en moet toegang tot Webmin goed worden afgeschermd.

## Naamgeving

De repository heet historisch **MemoCraft-Theme**, maar de actieve branding en het dashboard heten **MemoNetwork** / **MemoNetwork Edition**.
