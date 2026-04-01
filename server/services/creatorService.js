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
import { discoverViaFacebookAds } from "./FacebookAdsService.js";

const AGGREGATOR_SEEDS = [
  "https://www.kurser.se/kurser/distans",
  "https://www.kurser.se/kurser/online",
  "https://www.utbildning.se/kurser/distansutbildningar",
];


const KNOWN_CREATOR_SEEDS = [];

const AGGREGATOR_BLOCKED_HOSTS = [
  "press.kurser.se",
  "press.utbildning.se",
  "kursarrangorer.kurser.se",
  "utbildningsforetag.utbildning.se",
];

function decodeDuckDuckGoUrl(url) {
  try {
    if (url.includes("duckduckgo.com/l/")) {
      const uddg = new URL(url).searchParams.get("uddg");
      if (uddg) return decodeURIComponent(uddg);
    }
  } catch {}
  return url;
}

function extractUrls(markdown = "") {
  const raw = markdown.match(/https?:\/\/[^\s)"<\]\\']+/gi) || [];
  return [
    ...new Set(
      raw
        .map(decodeDuckDuckGoUrl)
        .map(normalizeUrl)
        .filter((u) => u.length > 10)
    ),
  ];
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
      const extracted = extractUrls(page.markdown).filter(
        (u) => isCreatorPage(u) && !isAggregatorOwnPage(u)
      );
      extracted.forEach((u) => found.add(u));
    } catch {
      // fortsätter med nästa seed vid fel
    }
  }

  const facebookUrls = await discoverViaFacebookAds().catch(() => []);
  facebookUrls.filter((u) => !isIgnored(u)).forEach((u) => found.add(u));
  const arr = [...found];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.sort((a, b) => scoreUrl(b) - scoreUrl(a)).slice(0, 80);
}

export async function scrapeAndBuildCreator(url) {
  const page = await scrapePage(url);
  return buildCreator(url, page.markdown || "", page.metadata || {});
}

function isJunkPage(creator) {
  const t = (creator.title || "").toLowerCase();
  const junkTitles = [
    "404", "page not found", "doesn't exist", "not found",
    "inloggning", "logga in", "sign in", "log in", "login",
    "access denied", "forbidden", "unauthorized", "403",
    "coming soon", "under construction", "maintenance",
    "error", "oops", "något gick fel",
  ];
  return junkTitles.some((s) => t.includes(s));
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
  const CONCURRENCY = 3;

  const dedupedUrls = [...new Set(
    urls.map(normalizeUrl).filter((u) => u && !isAggregatorOwnPage(u))
  )];

  for (let i = 0; i < dedupedUrls.length; i += CONCURRENCY) {
    const batch = dedupedUrls.slice(i, i + CONCURRENCY).filter((u) => !seen.has(u));
    batch.forEach((u) => seen.add(u));

    const settled = await Promise.allSettled(batch.map((url) => scrapeAndBuildCreator(url)));

    for (let j = 0; j < settled.length; j++) {
      const outcome = settled[j];
      const url = batch[j];
      if (outcome.status === "fulfilled") {
        if (!isJunkPage(outcome.value)) results.push(outcome.value);
      } else {
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
          error: outcome.reason?.message || "Skrapning misslyckades",
        });
      }
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