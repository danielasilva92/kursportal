# Kursportal Prospekteringsverktyg

Ett verktyg som automatiskt hittar svenska kurskreatörer på internationella plattformar som Teachable, Kajabi och Thinkific. Resultatet visas i ett dashboard och kan exporteras som CSV.

## Vad gör det?

Verktyget söker igenom plattformar och aggregatorsajter, skrapar kreatörernas sidor och samlar in kontaktuppgifter, prissättning, räckvidd med mera. En AI-analys kan sedan köras på varje kreatör för att bedöma lead-potential och ge ett förslag på outreach-vinkel.

## Krav

Du behöver ha installerat:

- Node.js (version 18 eller senare)
- En OpenAI API-nyckel

## Kom igång

Klona repot och installera beroenden för både frontend och backend.

**Backend:**
```bash
cd kursportal/server
npm install
```

**Frontend:**
```bash
cd kursportal
npm install
```

Skapa en `.env`-fil i `kursportal/server/` med följande innehåll:

```
OPENAI_API_KEY=din_nyckel_här
OPENAI_MODEL=gpt-4o
PORT=5000
FACEBOOK_ACCESS_TOKEN=valfritt_om_du_vill_använda_ads_library
```

## Starta

Starta backend och frontend i varsin terminal.

**Backend (port 5000):**
```bash
cd kursportal/server
node index.js
```

**Frontend (port 5173):**
```bash
cd kursportal
npm run dev
```

Öppna sedan `http://localhost:5173` i webbläsaren.

## Användning

**Batch-sökning** finns i panelen till vänster i dashboardet. Varje rad är en datakälla med en play-knapp. Klicka på "Kör alla" för att köra alla automatiska källor parallellt, eller starta enskilda sources manuellt.

Tillgängliga datakällor:

- **Google SERP och aggregatorsidor** kör hela discovery-flödet, skrapar kurser.se och utbildning.se, och kör eventuellt Facebook Ads Library om token är satt.
- **Kurser.se och utbildning.se** kör enbart aggregator-skrapningen.
- **Djupskanning** använder Wayback Machine CDX för att hitta Kajabi och Teachable-subdomäner och skrapar ett slumpmässigt urval. Det tar flera minuter.
- **Manuell URL-import** låter dig klistra in egna URLs, en per rad, och skrapa dem direkt.

En notis visas i gränssnittet och som webbläsarnotis när en sökning är klar.

**AI-analys** kan köras på enskilda kreatörer via knappen "Analysera med AI" i sidopanelen. Du får en sammanfattning, en poäng för hur sannolikt det är att de riktar sig till svensk marknad, och ett förslag på hur man kan kontakta dem.

**Exportera CSV** laddar ner alla kreatörer i tabellen som en CSV-fil som öppnas korrekt i Excel. Om rader är markerade med kryssrutan exporteras bara de markerade.

## API-endpoints

Alla endpoints nås på `http://localhost:5000/api`.

| Endpoint | Metod | Beskrivning |
|---|---|---|
| `/run-pipeline` | GET | Kör hela flödet: discovery och skrapning |
| `/discover-creators` | GET | Hämta URLs utan att skrapa dem |
| `/find-creators` | POST | Skrapa en lista med URLs |
| `/scrape` | POST | Skrapa en enskild URL |
| `/analyze-creator` | POST | Kör AI-analys på en kreatör |
| `/export-csv` | POST | Konvertera kreatörslista till CSV |
| `/deep-scan` | GET | Wayback Machine-sökning efter plattformssubdomäner |

## Driftsättning med Docker

Projektet inkluderar en Dockerfile för driftsättning på till exempel Render. Puppeteer kräver Chromium som installeras i imagen.

**Bygga och köra lokalt:**
```bash
docker build -t kursportal .
docker run -p 5000:5000 --env-file kursportal/server/.env kursportal
```

**På Render:**

1. Koppla repot till Render och välj "Docker" som runtime.
2. Lägg till miljövariablerna `OPENAI_API_KEY`, `OPENAI_MODEL` och eventuellt `FACEBOOK_ACCESS_TOKEN` under "Environment".
3. Render bygger och startar containern automatiskt vid varje push.

Frontenden byggs som en del av Docker-bygget och serveras som statiska filer från Express på port 5000.
