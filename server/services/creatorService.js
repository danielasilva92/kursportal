import { scrapePage } from "./Scraper.js";
import { buildCreator } from "../utils/Builder.js";
import {
  isPlatformCreatorUrl,
  isAggregatorCreatorUrl,
  isIgnored,
  scoreUrl,
  normalizeUrl,
  detectPlatform,
} from "../utils/Platform.js";

const AGGREGATOR_SEEDS = [
  "https://www.kurser.se/kurser/distans",
  "https://www.kurser.se/kurser/online",
  "https://www.utbildning.se/kurser/distansutbildningar",
];

const GOOGLE_SERP_QUERIES = [
  "https://www.google.com/search?q=site:teachable.com+svenska+kurser&num=30",
  "https://www.google.com/search?q=site:thinkific.com+kurs+svenska&num=30",
  "https://www.google.com/search?q=site:kajabi.com+kurser+svenska&num=30",
  "https://www.google.com/search?q=site:podia.com+kurs+svenska&num=30",
  "https://www.google.com/search?q=teachable.com+onlinekurs+swedish&num=30",
  "https://www.google.com/search?q=kajabi+utbildning+svenska+kurser&num=30",
];

const KNOWN_CREATOR_SEEDS = [
  "https://manusdiagnos.teachable.com",
  "https://coaching-motivation.teachable.com",
  "https://careerclarity.teachable.com",
  "https://sensera.teachable.com",
  "https://wsf-academy.thinkific.com",
  "https://cirkular-ekonomi.teachable.com",
  "https://beautyathome.thinkific.com",
  "https://skrivakademin.teachable.com",
  "https://fotografiskolan.teachable.com",
  "https://ledarskapsgruppen.teachable.com",
  "https://yogaflow.thinkific.com",
  "https://kodkurser.teachable.com",
  "https://digitalmarknadsföring.teachable.com",
  "https://halsokurser.teachable.com",
  "https://musikskolan.teachable.com",
];

const AGGREGATOR_BLOCKED_HOSTS = [
  "press.kurser.se",
  "press.utbildning.se",
  "kursarrangorer.kurser.se",
  "utbildningsforetag.utbildning.se",
];

function extractUrls(markdown = "") {
  const raw = markdown.match(/https?:\/\/[^\s)"<\]\\']+/gi) || [];
  return [...new Set(raw.map(normalizeUrl).filter((u) => u.length > 10))];
}

function isCreatorPage(url) {
  return !isIgnored(url) && (isPlatformCreatorUrl(url) || isAggregatorCreatorUrl(url));
}

export async function discoverCreatorUrls() {
  const found = new Set(
    KNOWN_CREATOR_SEEDS.map(normalizeUrl).filter((u) => !isAggregatorOwnPage(u))
  );

  for (const seed of AGGREGATOR_SEEDS) {
    try {
      const page = await scrapePage(seed);
      extractUrls(page.markdown)
        .filter((u) => isCreatorPage(u) && !isAggregatorOwnPage(u))
        .forEach((u) => found.add(u));
    } catch {
      continue;
    }
  }

  for (const serpUrl of GOOGLE_SERP_QUERIES) {
    try {
      const page = await scrapePage(serpUrl);
      extractUrls(page.markdown)
        .filter((u) => !isIgnored(u) && isPlatformCreatorUrl(u))
        .forEach((u) => found.add(u));
    } catch {
      continue;
    }
  }

  return [...found].sort((a, b) => scoreUrl(b) - scoreUrl(a)).slice(0, 80);
}

export async function scrapeAndBuildCreator(url) {
  const page = await scrapePage(url);
  return buildCreator(url, page.markdown || "", page.metadata || {});
}

function is404(creator) {
  const t = (creator.title || "").toLowerCase();
  return (
    t.includes("404") ||
    t.includes("page not found") ||
    t.includes("doesn't exist") ||
    t.includes("not found")
  );
}

function isAggregatorOwnPage(url = "") {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return AGGREGATOR_BLOCKED_HOSTS.includes(host);
  } catch {
    return false;
  }
}

export async function findCreatorsFromUrls(urls) {
  const results = [];
  const seen = new Set();

  for (const rawUrl of urls) {
    const url = normalizeUrl(rawUrl);
    if (seen.has(url)) continue;
    seen.add(url);

    if (isAggregatorOwnPage(url)) continue;

    try {
      const creator = await scrapeAndBuildCreator(url);
      if (!is404(creator)) results.push(creator);
    } catch (error) {
      results.push({
        creatorName: "Okänd kreatör",
        platform: detectPlatform(url),
        courseUrl: url,
        subject: "Övrigt",
        courseCount: null,
        pricing: [],
        contact: { website: url, emails: [], socials: [] },
        estimatedReach: null,
        dataSource: detectPlatform(url),
        language: null,
        title: "",
        description: "",
        likelySwedish: false,
        leadScore: 0,
        error: error?.message || "Skrapning misslyckades",
      });
    }
  }

  return results.sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0));
}

export async function runDiscoveryPipeline(limit = 20) {
  const allUrls = await discoverCreatorUrls();
  const selectedUrls = allUrls.slice(0, limit);
  const creators = await findCreatorsFromUrls(selectedUrls);

  return {
    discoveredCount: allUrls.length,
    selectedCount: selectedUrls.length,
    creatorsCount: creators.length,
    creators,
  };
}