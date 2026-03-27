import axios from "axios";
import { isPlatformCreatorUrl, isIgnored, normalizeUrl } from "../utils/Platform.js";

const BING_ENDPOINT = "https://api.bing.microsoft.com/v7.0/search";

const QUERIES = [
  "site:mykajabi.com kurs utbildning",
  "site:mykajabi.com onlinekurs lär dig",
  "site:teachable.com kurs utbildning",
  "site:teachable.com onlinekurs lär dig",
  "site:thinkific.com kurs utbildning",
  "site:podia.com kurs utbildning",
  "site:learnworlds.com kurs utbildning",
];

async function bingSearch(query, apiKey) {
  const res = await axios.get(BING_ENDPOINT, {
    timeout: 15000,
    headers: {
      "Ocp-Apim-Subscription-Key": apiKey,
    },
    params: {
      q: query,
      mkt: "sv-SE",
      count: 50,
      setLang: "sv",
    },
  });

  const webPages = res.data?.webPages?.value ?? [];
  return webPages
    .map((p) => {
      try {
        return normalizeUrl(p.url);
      } catch {
        return null;
      }
    })
    .filter((u) => u && isPlatformCreatorUrl(u) && !isIgnored(u));
}

export async function discoverViaBing() {
  const apiKey = process.env.BING_API_KEY;
  if (!apiKey) {
    console.log("[bing] BING_API_KEY saknas, hoppar över Bing-sökning.");
    return [];
  }

  const found = new Set();

  for (const query of QUERIES) {
    try {
      const urls = await bingSearch(query, apiKey);
      urls.forEach((u) => found.add(u));
      console.log(`[bing] "${query}" → ${urls.length} URLs`);
    } catch (err) {
      console.log(`[bing] "${query}" → FEL: ${err.message}`);
    }
  }

  console.log(`[bing] totalt: ${found.size} plattforms-URLs hittade`);
  return [...found];
}
