# MemoCraft Theme

Een zelfstandig Webmin-thema in ontwikkeling.

## Doel

Het thema moet als aparte keuze naast **Authentic Theme** en **Framed Theme** verschijnen, zonder bestaande Webmin-thema's te wijzigen.

## Huidige status

De eerste echte basis staat klaar:

- het officiële Framed Theme wordt tijdens de build als bewezen basis opgehaald;
- alle interne verwijzingen worden omgezet naar `memocraft-theme`;
- een eigen `theme.info` wordt aangemaakt;
- de eerste MemoCraft-stijl wordt toegevoegd;
- GitHub Actions bouwt automatisch `memocraft-theme.wbt.gz`;
- de workflow controleert of de verplichte Webmin-bestanden in het pakket zitten.

Hierdoor bewaren we niet handmatig duizenden oude Webmin-bestanden in deze repository en is iedere build reproduceerbaar.

## Build downloaden

1. Open het tabblad **Actions** van deze repository.
2. Open de nieuwste geslaagde workflow **Build Webmin theme**.
3. Download onder **Artifacts** het bestand **memocraft-theme**.
4. Pak de gedownloade ZIP uit.
5. Installeer `memocraft-theme.wbt.gz` via Webmin.

## Lokaal bouwen

Vereisten: Linux, Bash, Git en tar.

```bash
chmod +x build.sh
./build.sh
```

Het pakket verschijnt daarna als:

```text
dist/memocraft-theme.wbt.gz
```

## Roadmap

- v0.1: minimale werkende theme package
- v0.2: MemoCraft-kleuren en basisstijl
- v0.3: aangepaste loginpagina en iconen
- v1.0: stabiele release en installatiepakket

## Veilig testen

Houd tijdens het testen altijd een extra Webmin-tabblad met Authentic Theme open, zodat je direct kunt terugschakelen als een ontwikkelversie niet goed laadt.
