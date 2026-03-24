import { detectPlatform } from "../utils/detectPlatform.js";
import { extractCreatorData } from "../utils/extractCreatorData.js";
import { scrapePage } from "./scrapeService.js";
import { addToQueue, getNextUrl, markVisited, hasMoreUrls } from "./queue.js";

const AGGREGATOR_SEED_URLS = [
  "https://www.kurser.se/kurser/distans",
  "https://www.kurser.se/kurser/online",
  "https://www.utbildning.se/kurser/distansutbildningar",
];

const KNOWN_PLATFORM_SEED_URLS = [
  "https://manusdiagnos.teachable.com/p/skrivgladje",
  "https://coaching-motivation.teachable.com/p/mi-webbkurs",
  "https://careerclarity.teachable.com/p/cv-kurs",
  "https://sensera.teachable.com/p/rapid-development-pa-svenska",
  "https://beautyathome.thinkific.com",
  "https://wsf-academy.thinkific.com/courses/swedish-safeshred-e-learning-course",
  "https://cirkular-ekonomi.teachable.com",
  "https://digitalentreprenher.mykajabi.com",
  "https://digitalentreprenher.mykajabi.com/products",
];

const PLATFORM_DOMAINS = [
  "teachable.com",
  "kajabi.com",
  "thinkific.com",
  "podia.com",
  "learnworlds.com",
];

function normalizeUrl(url = "") {
  return url
    .trim()
    .replace(/[),.>\]"']+$/, "")
    .replace(/\/+$/, "");
}

function isPlatformCreatorUrl(url = "") {
  const lower = url.toLowerCase();

  const hasPlatform = PLATFORM_DOMAINS.some((d) => lower.includes(d));
  if (!hasPlatform) return false;

  const isRootOrMarketing = PLATFORM_DOMAINS.some((d) => {
    return lower === `https://${d}` || lower === `https://www.${d}`;
  });
  if (isRootOrMarketing) return false;

  const isMarketingPath = [
    "/features", "/pricing", "/blog", "/about", "/contact",
    "/login", "/signup", "/register", "/support", "/legal",
    "/terms", "/privacy", "/careers", "/press", "/partners",
    "/browse", "/courses", "/creators", "/examples", "/templates",
  ].some((p) => lower.includes(p));

  const isSubdomain = PLATFORM_DOMAINS.some((d) => {
    const escapedDomain = d.replace(".", "\\.");
    const regex = new RegExp(`https?://[a-z0-9\\-]+\\.${escapedDomain}`, "i");
    const isMatch = regex.test(url);
    const isWww = lower.startsWith(`https://www.${d}`) || lower.startsWith(`https://${d}`);
    return isMatch && !isWww;
  });

  if (isSubdomain) return true;

  const isKajabiPage =
    lower.includes("kajabi.com") &&
    !lower.includes("/podcasts/") &&
    !lower.includes("/feed") &&
    !lower.includes("/blog") &&
    !lower.includes("/pricing") &&
    !lower.includes("/about") &&
    !lower.includes("/contact") &&
    !lower.includes("/login") &&
    !lower.includes("/signup");

  if (isKajabiPage) return true;

  const isCoursePath = /\/(courses?|c\/|p\/|l\/|enroll|products?)\/[a-z0-9\-]+/i.test(url);
  return isCoursePath && !isMarketingPath;
}

function isAggregatorCreatorUrl(url = "") {
  const lower = url.toLowerCase();
  const isAggregator = lower.includes("kurser.se") || lower.includes("utbildning.se");
  if (!isAggregator) return false;

  const isBroadPage = [
    "/kurser/distans",
    "/kurser/online",
    "/kurser/distansutbildningar",
    "/sök",
    "/search",
    "/kategori/",
    "/category/",
  ].some((p) => lower.includes(p));

  const isRoot = lower === "https://www.kurser.se" || lower === "https://www.utbildning.se";

  return !isBroadPage && !isRoot;
}

function isIgnored(url = "") {
  const lower = url.toLowerCase();
  return (
    lower.includes("facebook.com") ||
    lower.includes("instagram.com") ||
    lower.includes("linkedin.com") ||
    lower.includes("youtube.com") ||
    lower.includes("tiktok.com") ||
    lower.includes("twitter.com") ||
    lower.includes("mailto:") ||
    lower.includes("cloudinary.com") ||
    lower.includes("translate.google.com") ||
    lower.includes("cdn.") ||
    lower.includes("/podcasts/") ||
    lower.includes("/feed") ||
    /\.(jpg|jpeg|png|webp|gif|svg|pdf|zip)(\?|$)/i.test(lower)
  );
}

function scoreUrl(url = "") {
  const lower = url.toLowerCase();
  let score = 0;

  const isSubdomain = PLATFORM_DOMAINS.some((d) => {
    const escapedDomain = d.replace(".", "\\.");
    const regex = new RegExp(`https?://[a-z0-9\\-]+\\.${escapedDomain}`, "i");
    return regex.test(url) && !lower.startsWith(`https://www.${d}`);
  });
  if (isSubdomain) score += 6;

  if (PLATFORM_DOMAINS.some((d) => lower.includes(d))) score += 3;
  if (/\/(courses?|c\/|p\/|products?)/.test(lower)) score += 2;
  if (lower.includes(".se")) score += 1;
  if (lower.includes("kurs") || lower.includes("utbildning")) score += 1;

  return score;
}

function extractAllUrls(markdown = "") {
  const raw = markdown.match(/https?:\/\/[^\s)"<\]\\']+/gi) || [];
  return raw.map(normalizeUrl).filter((u) => u.length > 10);
}

export async function discoverCreatorUrls() {
  const allUrls = new Set();

  for (const seedUrl of AGGREGATOR_SEED_URLS) {
    try {
      const scraped = await scrapePage(seedUrl);
      const found = extractAllUrls(scraped.markdown || "");

      found
        .filter((u) => !isIgnored(u) && (isPlatformCreatorUrl(u) || isAggregatorCreatorUrl(u)))
        .forEach((u) => allUrls.add(u));
    } catch (error) {
      console.error("Aggregator discovery failed:", seedUrl, error.message);
      continue;
    }
  }

  for (const url of KNOWN_PLATFORM_SEED_URLS) {
    if (!isIgnored(url) && isPlatformCreatorUrl(url)) {
      allUrls.add(normalizeUrl(url));
    }
  }

  const sorted = [...allUrls].sort((a, b) => scoreUrl(b) - scoreUrl(a));
  return sorted.slice(0, 60);
}

export async function findCreatorsFromUrls(urls) {
  const results = [];

  for (const url of urls) {
    try {
      console.log("Scraping:", url);
      const scraped = await scrapePage(url);
      const markdown = scraped.markdown || "";
      const metadata = scraped.metadata || {};
      const creator = extractCreatorData({ url, markdown, metadata });
      if (creator) results.push(creator);
    } catch (error) {
      results.push({
        url,
        platform: detectPlatform(url),
        dataSource: detectPlatform(url),
        error: error?.message || "Failed to scrape",
        likelySwedish: false,
        leadScore: 0,
      });
    }
  }

  results.sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0));

  const seen = new Set();

  const uniqueResults = results.filter((creator) => {
    const key = creator.courseUrl || creator.url;
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return uniqueResults;
}

export async function runCrawler() {
  const results = [];

  AGGREGATOR_SEED_URLS.forEach(addToQueue);
  KNOWN_PLATFORM_SEED_URLS.forEach(addToQueue);

  let iterations = 0;
  const MAX_ITERATIONS = 50;

  while (hasMoreUrls() && iterations < MAX_ITERATIONS) {
    const url = getNextUrl();
    if (!url) break;

    try {
      console.log("Crawling:", url);

      const scraped = await scrapePage(url);
      const markdown = scraped.markdown || "";

      const creator = extractCreatorData({
        url,
        markdown,
        metadata: scraped.metadata,
      });

      if (creator) {
        results.push(creator);
      }

      const foundUrls = extractAllUrls(markdown);

      foundUrls
        .filter((u) => !isIgnored(u))
        .filter((u) => isPlatformCreatorUrl(u) || isAggregatorCreatorUrl(u))
        .forEach(addToQueue);

      markVisited(url);
      iterations++;

    } catch (err) {
      console.error("Crawl error:", url, err.message);
    }
  }

  return results;
}

export async function runDiscoveryPipeline(limit = 20) {
  const discoveredUrls = await discoverCreatorUrls();
  const selectedUrls = discoveredUrls.slice(0, limit);

  const creators = await findCreatorsFromUrls(selectedUrls);

  return {
    discoveredCount: discoveredUrls.length,
    selectedCount: selectedUrls.length,
    creatorsCount: creators.length,
    creators,
  };
}