const CATEGORIES = [
  { label: "Design & UX", keywords: ["ux", "ui design", "grafisk design", "figma", "photoshop", "illustrator", "webbdesign", "graphic design"] },
  { label: "Marknadsföring", keywords: ["seo", "marknadsföring", "content marketing", "sociala medier", "google ads", "facebook ads", "e-postmarknadsföring", "digital marketing"] },
  { label: "Fotografi", keywords: ["fotografi", "fotografering", "foto ", "lightroom", "kamera", "photography", "portrait"] },
  { label: "Ledarskap", keywords: ["ledarskap", "ledare", "chef", "management", "teamledning", "hr ", "human resources"] },
  { label: "Programmering", keywords: ["programmering", "kod", "python", "javascript", "react", "webbutveckling", "developer", "coding", "software"] },
  { label: "Hälsa & Träning", keywords: ["hälsa", "träning", "yoga", "fitness", "kost", "nutrition", "mindfulness", "meditation", "pilates"] },
  { label: "Ekonomi", keywords: ["ekonomi", "bokföring", "redovisning", "aktier", "sparande", "privatekonomi", "investeringar", "budget"] },
  { label: "Musik", keywords: ["musik", "gitarr", "piano", "sång", "musikproduktion", "dj", "låtskrivning", "music"] },
  { label: "Språk", keywords: ["engelska", "spanska", "franska", "tyska", "arabiska", "kinesiska", "språkkurs", "language"] },
  { label: "Business", keywords: ["business", "entreprenör", "företagande", "startup", "försäljning", "ehandel", "e-commerce", "affärsutveckling"] },
  { label: "Coaching", keywords: ["coaching", "coach", "livscoach", "personlig utveckling", "självledarskap", "mindset"] },
  { label: "Mat & Bakning", keywords: ["bakning", "matlagning", "kock", "konditori", "recept", "cooking", "baking"] },
  { label: "Produktivitet", keywords: ["excel", "office", "produktivitet", "tidshantering", "notion", "projektledning"] },
  { label: "Offentlig upphandling", keywords: ["upphandling", "lou", "offentlig upphandlare"] },
{ label: "Personlig utveckling", keywords: ["personlig utveckling", "självledarskap", "mindset", "livscoach"] },
];

export function detectLikelyCategory(text = "") {
  const lower = text.toLowerCase();
  let bestLabel = "Övrigt";
  let bestScore = 0;

  for (const category of CATEGORIES) {
    let score = 0;
    for (const keyword of category.keywords) {
      if (lower.includes(keyword)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestLabel = category.label;
    }
  }

  return bestLabel;
}