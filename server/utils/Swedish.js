const STRONG_MARKERS = [
  "onlinekurs", "distanskurs", "anmäl dig", "välkommen till kursen",
  "lär dig", "swish", "bankid", "fortnox", "momsregistrerad",
  "org.nr", "faktura", "kursinnehåll", "lektionstillfälle",
];

const NORMAL_MARKERS = [
  "kurs", "kurser", "utbildning", "utbildningar", "svenska",
  "lektion", "modul", "innehåll", "börja", "gratis", "köp",
  "pris", "inkluderar", "träning", "certifikat", "distans",
  "certifiering", "anmälan", "lektioner", "övningar",
];

export function isSwedish(text = "", url = "") {
  const lower = text.toLowerCase();
  const lowerUrl = url.toLowerCase();
  let score = 0;

  if (lowerUrl.includes(".se/") || lowerUrl.endsWith(".se")) score += 3;

  for (const m of STRONG_MARKERS) {
    if (lower.includes(m)) score += 2;
  }
  for (const m of NORMAL_MARKERS) {
    if (lower.includes(m)) score += 1;
  }

  const priceMatch = lower.match(/\b\d{2,5}\s?(kr|sek)\b/i);
  if (priceMatch) score += 2;

  return score >= 3;
}