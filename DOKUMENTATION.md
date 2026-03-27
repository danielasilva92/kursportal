# Teknisk dokumentation

## Arkitektur

Projektet är uppdelat i en frontend och en backend som pratar med varandra via ett REST API.

**Frontend** är byggt med React, TypeScript och Vite. Det är ett dashboard där man kan se, filtrera och exportera kreatörer. Det gör inga direkta anrop till OpenAI eller skrapar några sidor självt, allt det sker på backend-sidan.

**Backend** är en Express-server i Node.js. Den hanterar discovery, skrapning, AI-analys och CSV-export. Den körs på port 5000 och exponerar sju endpoints.

```
kursportal/
  src/                   React-frontend
    components/          UI-komponenter (tabell, AI-panel, export, batch-panel med mera)
    pages/               Dashboardsidan
    lib/api.ts           API-klient mot backend
    types/               TypeScript-typer

  server/
    services/
      CreatorService.js         Discovery och skrapning av kreatörer
      Scraper.js                Hämtar och parsar webbsidor
      aiAnalysisService.js      AI-analys via OpenAI
      ExportService.js          Konverterar data till CSV
      WaybackDiscoveryService.js Hittar plattformssubdomäner via Wayback Machine
      FacebookAdsService.js     Discovery via Meta Ads Library (valfritt)
      DnsDiscoveryService.js    DNS/CNAME-lookup (används ej i huvudflödet)
      Queue.js                  Håller koll på besökta URLs
    utils/
      Platform.js        Identifierar vilken plattform en URL tillhör
      Extractors.js      Extraherar priser, e-poster, sociala medier med mera
      Swedish.js         Avgör om en sida riktar sig till svensk marknad
      Builder.js         Sätter ihop ett kreatörsobjekt från rådata
    controllers/
      ScrapeController   Kopplar ihop routes med services
    routes/
      ScrapeRoutes.js    Definierar API-endpoints
```

## Datakällor

### Aggregatorsajter

kurser.se och utbildning.se innehåller listor över svenska kurser och ger bra träffar på faktiska svenska kreatörer. Verktyget skrapar kurs- och distanssidorna och extraherar länkarna därifrån. Tre seed-URLs används:

- `https://www.kurser.se/kurser/distans`
- `https://www.kurser.se/kurser/online`
- `https://www.utbildning.se/kurser/distansutbildningar`

### Facebook Ads Library

Om miljövariabeln `FACEBOOK_ACCESS_TOKEN` är satt söker verktyget i Meta Ads Library API:et efter svenska annonsörer som länkar till kursplattformar. Det hittar aktiva kreatörer som annonserar just nu. Utan token hoppas detta steg över automatiskt.

### Wayback Machine CDX (Djupskanning)

Wayback Machine CDX API:et används för att hitta historiskt arkiverade URLs från kursplattformarna. Verktyget söker efter subdomäner på Kajabi och Teachable genom att fråga efter alla arkiverade URLs som matchar mönstret `*.kajabi.com` och `*.teachable.com`. Resultatet är tusentals unika kreatörsubdomäner.

Djupskanningen tar ett slumpmässigt urval på 300 av de hittade URL:erna och skrapar dem. Bara sidor som klassas som svenska returneras.

CDX-anropet använder `collapse=urlkey` för att undvika dubbletter och begränsar till de senaste 5000 raderna från 2023 och framåt.

### DNS/CNAME-lookup

Verktyget kan söka efter `.se`-domäner som pekar mot kursplattformar via CNAME-poster. En CNAME som pekar mot till exempel `ssl-proxy.teachable.com` eller `custom.kajabi-cdn.com` visar att domänen är en kreatörssida med egen domän. Tjänsten är implementerad men används inte i huvudflödet eftersom den inte ger tillräckliga träffar på svenska kreatörer utan en betald sökmotor-API.

## Hur skrapningen fungerar

För varje URL försöker verktyget först göra en vanlig HTTP-request med axios och parsa HTML med Cheerio. Det är snabbt och fungerar för de flesta sidor.

Om sidan returnerar för lite text (under 400 tecken), vilket händer när innehållet laddas in med JavaScript, faller verktyget tillbaka på Puppeteer. Puppeteer startar en headless Chrome-webbläsare, väntar tills sidan är klar och hämtar den renderade HTML-koden.

Från HTML:n extraheras titel, meta-beskrivning, all löptext, priser i kronor/sek, e-postadresser med regex och länkar till Instagram, Facebook, LinkedIn, YouTube och TikTok.

## Hur AI används

OpenAI GPT-4o används för att analysera enskilda kreatörer på begäran. Det är inte en del av det automatiska flödet utan körs manuellt från dashboardet.

Modellen får en sammanfattning av kreatörens data och returnerar ett strukturerat JSON-svar med tio fält: sammanfattning, poäng för hur sannolikt det är att de riktar sig till svensk marknad (0 till 100), bedömd lead-potential, föreslagen kategori, outreach-vinkel, datakvalitet, lista på saknad data, rekommenderat nästa steg och konfidensgrad.

Strukturerade outputs används via `response_format` i Chat Completions-API:et, vilket garanterar att svaret alltid matchar det förväntade schemat.

Utöver AI-analysen finns en regelbaserad svensk-detektion som körs på alla sidor automatiskt. Den letar efter svenska nyckelord som "onlinekurs", "Swish", "BankID", "Klarna" och priser i kronor. Sidor med minst tre poäng klassas som troligtvis svenska.

## Vad som samlas in per kreatör

| Fält | Beskrivning |
|---|---|
| creatorName | Namn eller företagsnamn |
| platform | Plattform (Teachable, Kajabi med mera) |
| courseUrl | URL till kurssidan |
| subject | Ämne eller kategori |
| courseCount | Antal kurser om det syns |
| pricing | Priser i kronor om de syns |
| contact.website | Egen webbsida |
| contact.emails | E-postadresser |
| contact.socials | Sociala medier-länkar |
| estimatedReach | Uppskattad räckvidd (Liten, Medel, Stor) |
| dataSource | Var kreatören hittades |
| likelySwedish | Om sidan verkar rikta sig till Sverige |
| leadScore | Poäng 0 till 12 baserat på datakvalitet |

## API-endpoints

| Endpoint | Metod | Beskrivning |
|---|---|---|
| `/api/run-pipeline` | GET | Kör hela flödet: aggregator-discovery och skrapning |
| `/api/discover-creators` | GET | Hämta URLs utan att skrapa dem |
| `/api/find-creators` | POST | Skrapa en lista med URLs |
| `/api/scrape` | POST | Skrapa en enskild URL |
| `/api/analyze-creator` | POST | Kör AI-analys på en kreatör |
| `/api/export-csv` | POST | Konvertera kreatörslista till CSV |
| `/api/deep-scan` | GET | Wayback Machine-sökning och skrapning av plattformssubdomäner |

## Driftsättning

### Lokal körning

Backend och frontend startas i varsin terminal. Backend körs på port 5000, frontend på port 5173 via Vite.

### Docker och Render

Projektet inkluderar en `Dockerfile` i `kursportal/`. Puppeteer kräver Chromium som installeras i imagen.

Frontenden byggs med `npm run build` som en del av Docker-bygget. Express serverar sedan de statiska filerna och fångar alla icke-API-routes med en fallback till `index.html` så att React Router fungerar.

Miljövariablerna `OPENAI_API_KEY`, `OPENAI_MODEL` och eventuellt `FACEBOOK_ACCESS_TOKEN` sätts i Render under "Environment". `.env`-filen är undantagen från Docker-bygget via `.dockerignore`.

## Begränsningar

**Blockerade sidor.** Vissa plattformar blockerar automatiserade requests. Puppeteer hjälper i många fall men inte alltid. Sidor med Cloudflare eller liknande skydd kan misslyckas.

**Wayback Machine-tillgänglighet.** CDX API:et kan vara långsamt eller returnera 504 vid hög belastning. Djupskanningen använder en timeout på tre minuter per plattform.

**Teachable och Thinkific.** Wayback Machine har få arkiverade kreatörsubdomäner för dessa plattformar, de flesta arkiverade URL:er är marknadsföringssidor. Kajabi ger bäst resultat med tusentals unika subdomäner.

**Datakvalitet.** Hur mycket data som kan extraheras beror helt på hur sidan är uppbyggd. Prissättning och antal kurser syns inte alltid och kan saknas.

**Ingen databas.** All data lagras bara i frontend-state och försvinner när man laddar om sidan. CSV-export är det enda sättet att spara resultaten just nu.

## Förslag på vidareutveckling

En databas som SQLite eller PostgreSQL skulle göra det möjligt att spara och söka bland kreatörer mellan sessioner utan att behöva exportera varje gång.

Schemalagd körning av pipeline via en cron-job skulle hålla listan uppdaterad automatiskt utan manuell trigger.

En betald sök-API som Bing Search eller Google Custom Search skulle ge bättre täckning av Teachable och Thinkific-kreatörer, eftersom Wayback Machine inte har tillräcklig täckning för dessa plattformar.

Stöd för fler annonsplattformar som TikTok Ads eller LinkedIn Campaign Manager skulle kunna ge ytterligare träffar på svenska kreatörer.

En deduplicering som slår ihop kreatörer som dyker upp från flera datakällor skulle minska dubbletter i listan.
