# MemoNetwork Webmin Theme

MemoNetwork is een zelfstandig Webmin-thema en serverbeheeromgeving met een eigen **Control Center** voor dagelijkse monitoring, infrastructuur, incidenten, backups, beveiliging en diagnostiek.

**Huidige stabiele versie: v5.0.3**  
Releasekanaal: **stable**  
Getest op Ubuntu Server met Webmin.

## MemoNetwork 5

Vanaf v5 is het **Control Center de standaard startpagina** van MemoNetwork. Het oude v4-dashboard blijft alleen als legacy/weergave beschikbaar.

In v5.0.3 opent Webmin het Control Center direct via een server-side redirect, zodat het oude dashboard niet meer kort zichtbaar is. Ontwikkellabels zoals `Alpha 22 · ...` worden in de stable-interface automatisch verwijderd. De vaste tabvolgorde en Webmin-taalsynchronisatie uit v5.0.2 blijven behouden.

De hoofdonderdelen van het Control Center zijn:

- **Overzicht** — centrale status, healthscore en aandachtspunten;
- **Services** — Docker, AMP, MinIO en WireGuard;
- **Infrastructuur** — opslag, backup-HDD en servercomponenten;
- **Gezondheid** — gewogen Health Score en score-opbouw;
- **Betrouwbaarheid** — uptime-inschatting, meetdekking en SLO-status;
- **Meldingen** — centraal Notification Center;
- **Activiteit** — server-side gebeurtenissen en historie;
- **Incidenten** — actieve en herstelde incidenten;
- **Readiness** — installatie- en release-self-test;
- **Diagnostiek** — technische controle- en analysefuncties.

## Monitoring en Operations Center

Het Operations Center combineert de belangrijkste signalen uit:

- systeemstatus;
- services;
- backups;
- beveiliging;
- netwerk;
- internet/speedtest.

Hierdoor is direct zichtbaar of er kritieke problemen of aandachtspunten zijn en uit welke bron die komen.

## Health Score & Intelligence

MemoNetwork v5 berekent een servergezondheidsscore op basis van beschikbare bronnen. De score houdt onder andere rekening met:

- CPU-, RAM-, schijf- en temperatuurstatus;
- Docker, AMP, MinIO en WireGuard;
- backup-mount en backupversheid;
- Auto Defense / securitystatus;
- netwerkcontrole en internetsnelheid;
- betrouwbaarheid en meetdekking.

De Intelligence-laag bewaart scorehistorie, analyseert trends en maakt waarschuwingen zichtbaar zonder automatisch services of configuratie te wijzigen.

## Incident Center

Incidenten worden gecorreleerd uit meerdere bronnen en hebben een lifecycle van actief naar hersteld. Monitoringfouten of time-outs lossen een bestaand incident niet onterecht op.

Maintenance Mode kan worden gebruikt voor gepland onderhoud. Monitoring blijft daarbij actief, maar onderhoud wordt duidelijk als geplande situatie weergegeven.

## Activity Center

Het Activity Center bewaart server-side gebeurtenissen zoals:

- maintenance gestart/gestopt/verlopen;
- incident geopend/hersteld;
- service online/offline;
- backupstatus;
- netwerk- en speedtestmetingen;
- securitygebeurtenissen;
- handmatige notities.

## Reliability Center

Reliability toont voor 24 uur, 7 dagen en 30 dagen onder andere:

- geschatte uptime;
- meetdekking;
- 99% SLO-status;
- incidentaantallen;
- MTTR;
- uitgesloten onderhoudstijd.

Het SLO wordt pas als daadwerkelijk beoordeelbaar weergegeven wanneer voldoende meetdekking beschikbaar is.

## Backups

MemoNetwork bewaakt `/mnt/backups` en controleert onder andere:

- of de backup-HDD correct gemount is;
- vrije en gebruikte ruimte;
- MinIO-status;
- MinIO storage mapping;
- laatste backup/scan;
- backupversheid.

## Security

Het Security Center integreert MemoNetwork Auto Defense en toont onder andere:

- huidige beveiligingsmodus;
- detecties;
- blokkades;
- timerstatus;
- recente security-events;
- backendfouten.

## Netwerk en internet

Het Control Center bevat netwerkcontrole en speedtest-historie, waaronder:

- route/interface/gateway;
- DNS-resolvers;
- netwerkhealthscore;
- download/upload;
- ping;
- vergelijking met recente metingen.

## Meertalig

MemoNetwork volgt automatisch de taal van de ingelogde Webmin-gebruiker.

Ondersteund:

- Nederlands (`NL`);
- Duits (`DE`);
- Engels (`EN`).

## Repository-structuur

```text
memo-network/       MemoNetwork Control Center, CGI/API's en runtimes
memocraft-theme/    Webmin-theme en legacy dashboard
src/                theme CSS en JavaScript
build.sh            bouwt het installabele Webmin-pakket
release-check.sh    controleert het stable installatiepakket
version.json        huidige MemoNetwork-versie
```

## Installeren of bijwerken

```bash
cd ~/MemoCraft-Theme

set -e

git stash push -u -m "lokale wijzigingen voor update"
git fetch
git switch main
git pull --ff-only

./build.sh
bash ./release-check.sh

sudo tar -xzf dist/memocraft-theme.wbt.gz -C /usr/share/webmin/
```

Open Webmin daarna opnieuw en voer eventueel een harde refresh uit (`Ctrl+F5`).

## Alleen bouwen

```bash
chmod +x build.sh release-check.sh
./build.sh
bash ./release-check.sh
```

Het pakket wordt gemaakt als:

```text
dist/memocraft-theme.wbt.gz
```

## Releasebeleid

- `main` bevat de huidige stabiele MemoNetwork-release.
- Grote nieuwe versies worden eerst op een aparte ontwikkelbranch gebouwd en getest.
- Bugfixes voor een stabiele versie krijgen een patchversie, bijvoorbeeld `5.0.3`.
- Nieuwe grote functionaliteit wordt niet meer aan een afgeronde major toegevoegd zodra de volgende major in ontwikkeling gaat.

## Veiligheid

Beheeracties lopen via gecontroleerde MemoNetwork CGI-endpoints. Acties en invoer worden server-side gevalideerd. Monitoring-, Intelligence-, Readiness- en Reliability-functies zijn primair observerend en voeren niet zelfstandig destructieve reparaties uit.

Omdat Webmin beheerrechten heeft, hoort het alleen via een vertrouwde HTTPS-verbinding bereikbaar te zijn en goed te worden afgeschermd.

## Naamgeving

De repository heet historisch **MemoCraft-Theme**, maar de actieve branding en interface heten **MemoNetwork** / **MemoNetwork Edition**.