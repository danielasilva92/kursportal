export function isSwedish(text = "", url = "") {
  const lower = text.toLowerCase();
  const lowerUrl = url.toLowerCase();
  let score = 0;

  if (lowerUrl.includes(".se/") || lowerUrl.endsWith(".se")) score += 3;
  if (lowerUrl.includes(".se.")) score += 1;

  const strongMarkers = [
    "onlinekurs", "distanskurs", "anmäl dig", "välkommen till kursen",
    "lär dig", "svenska kr", " sek", "swish", "bankid", "fortnox",
    "momsregistrerad", "org.nr", "faktura",
  ];
  for (const m of strongMarkers) {
    if (lower.includes(m)) score += 2;
  }

  const normalMarkers = [
    "kurs", "kurser", "utbildning", "utbildningar", "svenska",
    "lektion", "modul", "innehåll", "börja", "gratis", "köp",
    "pris", "inkluderar", "lär", "träning", "certifikat","distans", 
    "svensk", "svenska", "certifiering", "anmälan"
  ];
  for (const m of normalMarkers) {
    if (lower.includes(m)) score += 1;
  }

  return score >= 2;
}