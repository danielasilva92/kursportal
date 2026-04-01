import axios from "axios";
import { normalizeUrl, isPlatformCreatorUrl } from "../utils/Platform.js";

const PLATFORM_PATTERNS = [
  "*.teachable.com",
  "*.thinkific.com",
  "*.mykajabi.com",
  "*.podia.com",
  "*.learnworlds.com",
];

const IGNORED_SUBDOMAINS = [
  "www", "app", "cdn", "assets", "api", "blog", "support",
  "help", "community", "affiliates", "partners", "press",
  "marketing", "mail", "smtp", "cpanel", "admin",
];

function extractSubdomainBase(url = "") {
  try {
    const { hostname } = new URL(url);
    const parts = hostname.split(".");
    if (parts.length < 3) return null;
    const sub = parts[0].toLowerCase();
    if (IGNORED_SUBDOMAINS.includes(sub)) return null;
    if (sub.length < 3) return null;
    return `https://${hostname}`;
  } catch {
    return null;
  }
}

async function fetchCdxUrls(pattern) {
  const apiUrl =
    `https://web.archive.org/cdx/search/cdx` +
    `?url=${encodeURIComponent(pattern)}` +
    `&output=json` +
    `&fl=original` +
    `&collapse=urlkey` +
    `&from=20230101` +
    `&limit=500`;

  const response = await axios.get(apiUrl, { timeout: 180000 });
  const rows = response.data;

  if (!Array.isArray(rows) || rows.length < 2) {
    return [];
  }

  const seen = new Set();
  const bases = [];

  for (let i = 1; i < rows.length; i++) {
    const raw = rows[i][0];
    const base = extractSubdomainBase(raw);
    if (base && !seen.has(base)) {
      seen.add(base);
      bases.push(normalizeUrl(base));
      continue;
    }
    const normalized = normalizeUrl(raw);
    if (isPlatformCreatorUrl(normalized) && !seen.has(normalized)) {
      seen.add(normalized);
      bases.push(normalized);
    }
  }

  return bases;
}

export async function discoverViaWayback() {
  const found = new Set();

  await Promise.allSettled(
    PLATFORM_PATTERNS.map(async (pattern) => {
      try {
        const urls = await fetchCdxUrls(pattern);
        urls.forEach((u) => found.add(u));
      } catch {
        // fortsätter med nästa mönster vid fel
      }
    })
  );

  return [...found];
}
