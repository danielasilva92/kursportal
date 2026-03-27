# Frontend

> React dashboard för prospektering av svenska kurskreatörer.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white)

---

## Struktur

```
src/
  components/
    BatchPanel.tsx        Batch-sökning med realtidsuppdatering per datakälla
    CreatorTable.tsx      Sorterbar tabell med checkboxar, score och kopiera-email
    AIInsightPanel.tsx    AI-analys och anteckningar per kreatör
    ExportButton.tsx      CSV-export av alla eller markerade kreatörer
    StatsCards.tsx        Statistikkort i headern
  pages/
    Index.tsx             Huvudvyn med all state och logik
  lib/
    api.ts                API-klient mot backend (fetch-wrapper)
  types/
    creator.ts            TypeScript-typer för Creator och BatchJob
    ai.ts                 Typ för AI-analyssvaret
  data/
    mockCreators.ts       Exempeldata som visas första gången
```

---

## Kom igång

```bash
npm install
npm run dev
```

Öppna `http://localhost:5173`. Backend behöver köra på port 5000.

### Miljövariabler

Skapa en `.env` i projektets rot om backend körs på en annan adress:

```env
VITE_API_URL=http://localhost:5000
```

---

## Komponenter

### BatchPanel

Visar fyra datakällor med individuella play-knappar och en "Kör alla"-knapp. Varje jobb uppdaterar en progress-bar i realtid. Toast-notis och webbläsarnotis visas när ett jobb är klart.

### CreatorTable

Paginerad tabell med stöd för:
- Sortering på Kreatör, Plattform, Ämne, Status och Score (klicka på kolumnrubriken)
- Kryssrutor för att markera rader
- Kopiera e-postadress med ett klick
- Score-badge med färgkodning (grön 7+, gul 4–6, grå under 4)
- Inline statusändring per rad

### AIInsightPanel

Visas som sidopanel på desktop (1280px+) och som ett slide-up sheet på mobil. Kör AI-analys via GPT-4o på begäran och visar sammanfattning, outreach-vinkel, kategori och nästa steg. Anteckningsfält sparas direkt i localStorage.

### ExportButton

Exporterar till Excel-kompatibel CSV med BOM-markering för korrekt teckenkodning. Om rader är markerade exporteras bara de markerade, annars exporteras allt.

---

## State och lagring

All state hanteras i `Index.tsx` och sparas i `localStorage` under nyckeln `kursportal-creators`. Data laddas automatiskt vid sidstart och skrivs vid varje förändring.

---

## Tech

| Paket | Användning |
|---|---|
| `framer-motion` | Animationer och transitions |
| `sonner` | Toast-notiser |
| `lucide-react` | Ikoner |
| `tailwindcss` | Styling |
