import dns from "dns/promises";
import axios from "axios";
import * as cheerio from "cheerio";
import { normalizeUrl } from "../utils/Platform.js";

const PLATFORM_CNAME_PATTERNS = [
  "ssl-proxy.teachable.com",
  "teachable.com",
  "custom.kajabi-cdn.com",
  "kajabi-cdn.com",
  "custom.thinkific.com",
  "thinkific.com",
  "custom.podia.com",
  "podia.com",
  "learnworlds.com",
];

const DDG_QUERIES = [
  "teachable kurs utbildning",
  "kajabi kurs utbildning",
  "thinkific kurs utbildning",
  "podia onlinekurs",
  "teachable onlinekurs lär dig",
];

function decodeDdgUrl(href = "") {
  try {
    if (href.includes("duckduckgo.com/l/")) {
      const uddg = new URL(href).searchParams.get("uddg");
      if (uddg) return decodeURIComponent(uddg);
    }
  } catch {}
  return href;
}

async function searchSwedishDomains() {
  const hosts = new Set();

  for (const q of DDG_QUERIES) {
    try {
      const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(q)}&kl=se-se`;
      const res = await axios.get(url, {
        timeout: 15000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
        },
      });

      const $ = cheerio.load(res.data);
      $("a[href]").each((_, el) => {
        const raw = $(el).attr("href") || "";
        const href = decodeDdgUrl(raw);
        try {
          const { hostname } = new URL(href);
          if (
            hostname.endsWith(".se") &&
            !hostname.includes("duckduckgo") &&
            !hostname.includes("google") &&
            !hostname.includes("facebook") &&
            !hostname.includes("instagram") &&
            !hostname.includes("linkedin")
          ) {
            hosts.add(hostname);
          }
        } catch {}
      });

      console.log(`[dns] DDG "${q}" → ${hosts.size} .se-domäner hittills`);
    } catch (err) {
      console.log(`[dns] DDG "${q}" → FEL: ${err.message}`);
    }
  }

  return [...hosts];
}

async function cnamePoinsToPlatform(hostname) {
  try {
    const cnames = await dns.resolveCname(hostname);
    return cnames.some((cname) =>
      PLATFORM_CNAME_PATTERNS.some((pattern) =>
        cname.toLowerCase().includes(pattern)
      )
    );
  } catch {
    return false;
  }
}

export async function discoverViaDns() {
  const candidateHosts = await searchSwedishDomains();
  console.log(`[dns] kontrollerar CNAME för ${candidateHosts.length} .se-domäner`);

  const found = [];
  for (const hostname of candidateHosts) {
    const usesPlatform = await cnamePoinsToPlatform(hostname);
    if (usesPlatform) {
      found.push(normalizeUrl(`https://${hostname}`));
      console.log(`[dns] hittad: ${hostname}`);
    }
  }

  console.log(`[dns] totalt: ${found.length} svenska plattforms-domäner`);
  return found;
}
