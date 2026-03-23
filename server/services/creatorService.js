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

export async function discoverCreatorUrls() {
  const seedUrls = [
    "https://www.kurser.se",
    "https://www.utbildning.se",
  ];

  const discovered = [];

  for (const url of seedUrls) {
    const scraped = await scrapePage(url);
    const text = scraped.markdown || "";

    const urls = text.match(/https?:\/\/[^\s)]+/gi) || [];

    const filtered = urls.filter((u) => {
      const lower = u.toLowerCase();
      return (
        lower.includes("teachable") ||
        lower.includes("kajabi") ||
        lower.includes("thinkific")
      );
    });

    discovered.push(...filtered);
  }

  return [...new Set(discovered)];
}