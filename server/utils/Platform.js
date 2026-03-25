export const PLATFORM_DOMAINS = [
  "teachable.com",
  "kajabi.com",
  "mykajabi.com",
  "thinkific.com",
  "podia.com",
  "learnworlds.com",
];

const MARKETING_PATHS = [
  "/features", "/pricing", "/blog", "/about", "/contact",
  "/login", "/signup", "/register", "/support", "/legal",
  "/terms", "/privacy", "/careers", "/press", "/partners",
  "/browse", "/creators", "/examples", "/templates",
  "/podcasts/", "/feed", "/affiliate",
];

const IGNORED_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif|svg|pdf|zip|mp4|mp3)(\?|$)/i;

const IGNORED_DOMAINS = [
  "facebook.com", "instagram.com", "linkedin.com", "youtube.com",
  "tiktok.com", "twitter.com", "x.com", "cloudinary.com",
  "translate.google.com", "google.com/search",
];

export function detectPlatform(url = "") {
  const lower = url.toLowerCase();
  if (lower.includes("teachable")) return "Teachable";
  if (lower.includes("kajabi") || lower.includes("mykajabi")) return "Kajabi";
  if (lower.includes("thinkific")) return "Thinkific";
  if (lower.includes("podia")) return "Podia";
  if (lower.includes("learnworlds")) return "LearnWorlds";
  if (lower.includes("kurser.se")) return "kurser.se";
  if (lower.includes("utbildning.se")) return "utbildning.se";
  return "Annat";
}

export function isIgnored(url = "") {
  const lower = url.toLowerCase();
  if (!url.startsWith("http")) return true;
  if (IGNORED_EXTENSIONS.test(lower)) return true;
  if (lower.includes("mailto:")) return true;
  if (lower.includes("cdn.")) return true;
  return IGNORED_DOMAINS.some((d) => lower.includes(d));
}

function isCreatorSubdomain(url = "") {
  for (const domain of PLATFORM_DOMAINS) {
    const escaped = domain.replace(".", "\\.");
    const regex = new RegExp(`https?://([a-z0-9\\-]+)\\.${escaped}`, "i");
    const match = url.match(regex);
    if (match) {
      const sub = match[1].toLowerCase();
      if (sub !== "www" && sub !== "app" && sub !== "cdn" && sub !== "assets") {
        return true;
      }
    }
  }
  return false;
}

function isMarketingPath(url = "") {
  const lower = url.toLowerCase();
  return MARKETING_PATHS.some((p) => lower.includes(p));
}

function isRootDomain(url = "") {
  return PLATFORM_DOMAINS.some(
    (d) => url.toLowerCase() === `https://${d}` || url.toLowerCase() === `https://www.${d}`
  );
}

export function isPlatformCreatorUrl(url = "") {
  if (isIgnored(url)) return false;

  const lower = url.toLowerCase();
  const hasPlatform = PLATFORM_DOMAINS.some((d) => lower.includes(d));
  if (!hasPlatform) return false;
  if (isRootDomain(url)) return false;
  if (isMarketingPath(url)) return false;

  if (isCreatorSubdomain(url)) return true;

  const hasCoursePath = /\/(courses?|c\/|p\/|products?\/|enroll\/)[a-z0-9\-_]+/i.test(url);
  return hasCoursePath;
}

export function isAggregatorCreatorUrl(url = "") {
  const lower = url.toLowerCase();

  const isAgg =
    (lower.includes("kurser.se") || lower.includes("utbildning.se")) &&
    !lower.includes("press.kurser.se") &&
    !lower.includes("press.utbildning.se") &&
    !lower.includes("kursarrangorer.kurser.se") &&
    !lower.includes("utbildningsforetag.utbildning.se");

  if (!isAgg) return false;

  const BLOCKED = [
    "https://www.kurser.se",
    "https://www.utbildning.se",
  ];
  if (BLOCKED.includes(lower)) return false;

  const BLOCKED_PATHS = [
    "/distans", "/online", "/distansutbildningar",
    "/review/", "/top/", "/hr-guiden",
    "/annonsera", "/referencias", "/referencer",
    "/om-oss", "/kontakt", "/press", "/blog",
    "/logga-in", "/registrera",
  ];
  if (BLOCKED_PATHS.some((p) => lower.includes(p))) return false;

  const isCreatorPage =
    lower.includes("/kurs/") ||
    lower.includes("/utbildning/") ||
    lower.includes("/kurser/") ||
    lower.match(/\/[a-z0-9\-]{3,}\/[a-z0-9\-]{3,}/);

  return !!isCreatorPage;
}

export function scoreUrl(url = "") {
  let score = 0;
  if (isCreatorSubdomain(url)) score += 6;
  if (PLATFORM_DOMAINS.some((d) => url.toLowerCase().includes(d))) score += 3;
  if (/\/(courses?|p\/|products?\/)/.test(url)) score += 2;
  if (url.toLowerCase().includes(".se")) score += 1;
  return score;
}

export function normalizeUrl(url = "") {
  try {
    const parsed = new URL(url.trim().replace(/[),.>\]"']+$/, ""));
    parsed.hash = "";
    return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, "");
  } catch {
    return url.trim().replace(/[),.>\]"']+$/, "").replace(/\/+$/, "");
  }
}