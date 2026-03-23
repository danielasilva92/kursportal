import { scrapePage } from "./fireCrawlService.js";
import { detectPlatform } from "../utils/detectPlatform.js";
import { extractCreatorData } from "../utils/extractCreatorData.js";

export async function findCreatorsFromUrls(urls) {
  const results = [];

  for (const url of urls) {
    try {
      const scraped = await scrapePage(url);

      const markdown = scraped.markdown || "";
      const metadata = scraped.metadata || {};

      const creator = extractCreatorData({
        url,
        markdown,
        metadata,
      });

      console.log("URL:", url);
      console.log("Creator:", creator);

      if (creator) {
        results.push(creator);
      }
    } catch (error) {
      results.push({
        url,
        platform: detectPlatform(url),
        dataSource: detectPlatform(url),
        error: error?.message || "Failed to scrape",
      });
    }
  }

  results.sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0));

  return results;
}

function normalizeUrl(url = "") {
  return url
    .trim()
    .replace(/[),.]+$/, "")
    .replace(/\/+$/, "");
}

function isRelevantDiscoveryUrl(url = "") {
  const lower = url.toLowerCase();


  const platformMatch =
    lower.includes("teachable") ||
    lower.includes("kajabi") ||
    lower.includes("thinkific") ||
    lower.includes("podia") ||
    lower.includes("learnworlds");

  const courseMatch =
    lower.includes("kurs") ||
    lower.includes("kurser") ||
    lower.includes("utbildning") ||
    lower.includes("onlinekurs") ||
    lower.includes("distanskurs") ||
    lower.includes("course") ||
    lower.includes("courses") ||
    lower.includes("academy") ||
    lower.includes("program");

  const ignoreMatch =
    lower.includes("facebook.com") ||
    lower.includes("instagram.com") ||
    lower.includes("linkedin.com") ||
    lower.includes("youtube.com") ||
    lower.includes("tiktok.com") ||
    lower.includes("mailto:") ||
    lower.includes(".pdf") ||
    lower.includes("/kontakt") ||
    lower.includes("/contact");
     lower.includes("res.cloudinary.com") ||
    lower.includes("cloudinary.com") ||
    lower.includes("cdn.") ||
    lower.includes("/image/upload") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".svg");

    const aggregatorMatch =
  lower.includes("kurser.se") ||
  lower.includes("utbildning.se");

 return !ignoreMatch  && (platformMatch || courseMatch);

 
}

function getDiscoveryScore(url = "") {
  const lower = url.toLowerCase();
  let score = 0;

  if (
    lower.includes("teachable") ||
    lower.includes("kajabi") ||
    lower.includes("thinkific") ||
    lower.includes("podia") ||
    lower.includes("learnworlds")
  ) score += 3;

  if (
    lower.includes("kurs") ||
    lower.includes("kurser") ||
    lower.includes("utbildning") ||
    lower.includes("course") ||
    lower.includes("courses")
  ) score += 2;

  if (
    lower.includes("academy") ||
    lower.includes("program") ||
    lower.includes("onlinekurs") ||
    lower.includes("distanskurs")
  ) score += 1;

  return score;
}

export async function discoverCreatorUrls() {
  const seedUrls = [
    "https://www.kurser.se",
    "https://www.utbildning.se",
  ];

  const discovered = [];

  for (const url of seedUrls) {
    try {
      const scraped = await scrapePage(url);
      const text = scraped.markdown || "";

      const urls = text.match(/https?:\/\/[^\s)]+/gi) || [];
      const cleaned = urls.map(normalizeUrl);

      const filtered = cleaned
        .filter(isRelevantDiscoveryUrl)
        .sort((a, b) => getDiscoveryScore(b) - getDiscoveryScore(a));

      console.log("Seed URL:", url);
      console.log("Found raw URLs:", urls.length);
      console.log("Filtered relevant URLs:", filtered.length);

      discovered.push(...filtered);
    } catch (error) {
      console.error(`Discovery failed for ${url}:`, error.message);
    }
  }

  const unique = [...new Set(discovered)];
return unique.slice(0, 50);
}

export async function runDiscoveryPipeline(limit = 20) {
  const discoveredUrls = await discoverCreatorUrls();
  const selectedUrls = discoveredUrls.slice(0, limit);

  console.log("Discovered URLs:", discoveredUrls.length);
  console.log("Selected URLs for analysis:", selectedUrls.length);

  const creators = await findCreatorsFromUrls(selectedUrls);

  return {
    discoveredCount: discoveredUrls.length,
    selectedCount: selectedUrls.length,
    creatorsCount: creators.length,
    creators,
  };
}