const JUNK_NAMES = [
  /^(hem|home|start|index|kurs|kurser|utbildning|utbildningar|om oss|kontakt)$/i,
  /^(online courses?|all courses?|course catalog|browse courses?)$/i,
  /^(welcome|välkommen)$/i,
];

function isJunkName(name = "") {
  if (name.length < 3 || name.length > 100) return true;
  return JUNK_NAMES.some((p) => p.test(name.trim()));
}

const PLATFORM_SUFFIXES = [
  " | Teachable",
  " - Teachable",
  " | Kajabi",
  " - Kajabi",
  " | Thinkific",
  " - Thinkific",
  " | Podia",
  " - Podia",
  " | LearnWorlds",
  " - LearnWorlds",
  " | Online Courses",
  " | Courses",
  " - Online Course",
];

function cleanTitle(title = "") {
  let t = title;
  for (const s of PLATFORM_SUFFIXES) {
    if (t.includes(s)) t = t.slice(0, t.indexOf(s)).trim();
  }
  return t.trim();
}

export function extractCreatorName(metadata = {}, markdown = "", url = "") {
  const rawTitle = metadata.title || "";
  const cleaned = cleanTitle(rawTitle);

  if (cleaned.includes("|")) {
    const parts = cleaned.split("|").map((p) => p.trim());
    const candidate = parts[parts.length - 1];
    if (candidate && !isJunkName(candidate)) return candidate;
  }

  if (cleaned && !isJunkName(cleaned)) {
    if (cleaned.split(" ").length <= 6) return cleaned;
  }

  const patterns = [
    /välkommen till\s+([A-ZÅÄÖ][^\n.!?]{2,40})/i,
    /skapad av\s+([A-ZÅÄÖ][^\n.!?]{2,40})/i,
    /av\s+([A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ][a-zåäö]+)+)/,
    /instruktör[:\s]+([A-ZÅÄÖ][^\n.!?]{2,40})/i,
    /lärare[:\s]+([A-ZÅÄÖ][^\n.!?]{2,40})/i,
    /^##?\s+(.+)$/m,
  ];

  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    if (match && match[1] && !isJunkName(match[1].trim())) {
      return match[1].trim();
    }
  }

  try {
    const { hostname } = new URL(url);
    const sub = hostname.replace("www.", "").split(".")[0];
    if (sub && sub.length > 2 && sub !== "app" && sub !== "cdn") {
      return sub.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
  } catch {}

  return "Okänd kreatör";
}

export function extractEmails(text = "") {
  const matches = text.match(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/gi);
  return matches ? [...new Set(matches.filter((e) => !e.includes("example.com")))] : [];
}

export function extractPrices(text = "") {
  const matches =
    text.match(
      /\b(?:\d{2,3}(?:[ .]?\d{3})*|\d{2,6})\s?(?:kr|sek)\b|\b(?:kr|sek)\s?(?:\d{2,3}(?:[ .]?\d{3})*|\d{2,6})\b/gi
    ) || [];

  return [
    ...new Set(
      matches.filter((price) => {
        const digits = price.replace(/[^0-9]/g, "");
        return digits && parseInt(digits, 10) >= 50;
      })
    ),
  ];
}

export function extractSocials(text = "") {
  const urls = text.match(/https?:\/\/[^\s)"<\]]+/gi) || [];
  return [
    ...new Set(
      urls.filter((url) => {
        const lower = url.toLowerCase();
        const isShare =
          lower.includes("sharer") ||
          lower.includes("share?u=") ||
          lower.includes("translate.google");
        const isValid =
          lower.includes("instagram.com/") ||
          (lower.includes("facebook.com/") && !lower.includes("/share")) ||
          lower.includes("linkedin.com/in/") ||
          lower.includes("linkedin.com/company/") ||
          lower.includes("youtube.com/channel/") ||
          lower.includes("youtube.com/@") ||
          lower.includes("tiktok.com/@");
        return isValid && !isShare;
      })
    ),
  ];
}

export function extractCourseCount(text = "") {
  const patterns = [
    /(\d+)\s*(online)?kurser/i,
    /(\d+)\s*(online)?courses/i,
    /(\d+)\s*program/i,
    /(\d+)\s*utbildningar/i,
    /contains\s+(\d+)\s+course/i,
    /(\d+)\s+courses?\s+available/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > 0 && n < 1000) return n;
    }
  }

  const headings = text.match(/^#{1,3}\s+.+$/gm) || [];
  const courseHeadings = headings.filter((h) => /(kurs|course|program|utbildning)/i.test(h));
  if (courseHeadings.length > 1) return courseHeadings.length;

  return null;
}

export function extractFollowerCount(text = "") {
  const patterns = [
    /(\d[\d\s,.]*[kK]?)\s*(följare|followers)/i,
    /(\d[\d\s,.]*[kK]?)\s*(prenumeranter|subscribers)/i,
    /(\d[\d\s,.]*[kK]?)\s*(lyssnare|listeners)/i,
    /(\d[\d\s,.]*[kK]?)\s*(members|medlemmar)/i,
    /followers[:\s]+(\d[\d\s,.]*[kK]?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const raw = match[1].replace(/\s/g, "").replace(",", ".");
      if (raw.toLowerCase().endsWith("k")) {
        return Math.round(parseFloat(raw) * 1000);
      }
      const n = parseInt(raw.replace(/[^0-9]/g, ""), 10);
      if (n > 0 && n < 100_000_000) return n;
    }
  }
  return null;
}

const CATEGORIES = [
  {
    label: "Design & UX",
    keywords: [
      "ux",
      "ui design",
      "grafisk design",
      "figma",
      "photoshop",
      "webbdesign",
      "graphic design",
    ],
  },
  {
    label: "Marknadsföring",
    keywords: [
      "seo",
      "marknadsföring",
      "content marketing",
      "sociala medier",
      "google ads",
      "digital marketing",
    ],
  },
  {
    label: "Fotografi",
    keywords: ["fotografi", "fotografering", "lightroom", "kamera", "photography"],
  },
  {
    label: "Ledarskap",
    keywords: ["ledarskap", "ledare", "chef", "management", "teamledning", "human resources"],
  },
  {
    label: "Programmering",
    keywords: [
      "programmering",
      "kod",
      "python",
      "javascript",
      "react",
      "webbutveckling",
      "coding",
      "software",
    ],
  },
  {
    label: "Hälsa & Träning",
    keywords: [
      "hälsa",
      "träning",
      "yoga",
      "fitness",
      "kost",
      "nutrition",
      "mindfulness",
      "meditation",
      "pilates",
    ],
  },
  {
    label: "Ekonomi",
    keywords: [
      "ekonomi",
      "bokföring",
      "redovisning",
      "aktier",
      "sparande",
      "investeringar",
      "budget",
    ],
  },
  {
    label: "Musik",
    keywords: ["musik", "gitarr", "piano", "sång", "musikproduktion", "låtskrivning"],
  },
  {
    label: "Språk",
    keywords: [
      "engelska",
      "spanska",
      "franska",
      "tyska",
      "arabiska",
      "kinesiska",
      "språkkurs",
      "language",
    ],
  },
  {
    label: "Business",
    keywords: [
      "business",
      "entreprenör",
      "företagande",
      "startup",
      "försäljning",
      "ehandel",
      "affärsutveckling",
    ],
  },
  {
    label: "Coaching",
    keywords: [
      "coaching",
      "coach",
      "livscoach",
      "personlig utveckling",
      "självledarskap",
      "mindset",
    ],
  },
  {
    label: "Mat & Bakning",
    keywords: ["bakning", "matlagning", "kock", "konditori", "cooking", "baking"],
  },
  {
    label: "Produktivitet",
    keywords: ["excel", "office", "produktivitet", "tidshantering", "notion", "projektledning"],
  },
];

export function detectCategory(text = "") {
  const lower = text.toLowerCase();
  let best = "Övrigt";
  let bestScore = 0;

  for (const cat of CATEGORIES) {
    const score = cat.keywords.filter((k) => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = cat.label;
    }
  }
  return best;
}

export function estimateReach(followerCount, socials = []) {
  if (followerCount !== null) {
    if (followerCount >= 10000) return "Stor (10k+)";
    if (followerCount >= 2000) return `Medel (${Math.round(followerCount / 1000)}k)`;
    return `Liten (${followerCount})`;
  }
  if (socials.length >= 3) return "Medel";
  if (socials.length >= 1) return "Liten";
  return null;
}
