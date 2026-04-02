import axios from "axios";
import * as cheerio from "cheerio";
import { isPlatformCreatorUrl, isIgnored, normalizeUrl } from "../utils/Platform.js";

const SERP_QUERIES = [
  "site:teachable.com kurs utbildning",
  "site:mykajabi.com kurs utbildning",
  "site:thinkific.com kurs utbildning",
  "site:teachable.com lär dig svenska",
  "site:mykajabi.com lär dig svenska",
  "teachable.com kurs kr sek",
  "mykajabi.com utbildning kr sek",
];

async function bingSearch(query) {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=20&setlang=sv`;
  try {
    const res = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
      },
    });

    const $ = cheerio.load(res.data);
    const found = [];

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (href.startsWith("http") && !href.includes("bing.com") && !href.includes("microsoft.com")) {
        try {
          found.push(normalizeUrl(href));
        } catch {
          
        }
      }
    });

    return found.filter((u) => isPlatformCreatorUrl(u) && !isIgnored(u));
  } catch {
    return [];
  }
}

export async function discoverViaAggregatorFollow() {
  const found = new Set();

  for (const query of SERP_QUERIES) {
    const urls = await bingSearch(query);
    urls.forEach((u) => found.add(u));
  }

  return [...found];
}
