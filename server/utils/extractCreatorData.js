import { extractEmails, extractPrices, extractSocials } from "../Extractors.js";
import { detectPlatform } from "./Platform.js";
import { isSwedish } from "./Swedish.js";

const AGGREGATOR_TITLE_PATTERNS = [
  /^(distansutbildningar|onlinekurser|kurser online|utbildningar online|alla kurser|kurskatalog|sök kurs|hitta kurs)/i,
  /^(kurser\.se|utbildning\.se)/i,
];

const JUNK_NAME_PATTERNS = [
  /^(hem|home|start|index|kurs|kurser|utbildning|utbildningar|om oss|kontakt|page \d+)$/i,
  /^(online courses?|all courses?|course catalog|browse courses?)$/i,
  /^-?\s*den kompletta guiden$/i,
  /^(hem|home)$/i,
  /^(kursen)$/i,
  /^(webbkurs|onlinekurs|kurs)$/i,
  /^(kursen)$/i,
  /^(webbkurs|onlinekurs|kurs)$/i,
];

function isAggregatorPage(title = "", url = "") {
  const lower = url.toLowerCase();
  if (lower.includes("kurser.se/kurser") || lower.includes("utbildning.se/kurser")) return true;
  if (lower.match(/\/(distans|online|kurser|utbildningar)\/?$/)) return true;
  return AGGREGATOR_TITLE_PATTERNS.some((p) => p.test(title.trim()));
}

function isJunkName(name = "") {
  return (
    JUNK_NAME_PATTERNS.some((p) => p.test(name.trim())) || name.length < 3 || name.length > 100
  );
}

function extractCreatorNameFromUrl(url = "") {
  try {
    const { hostname } = new URL(url);
    const parts = hostname.replace("www.", "").split(".");

    if (parts.length >= 3) {
      const subdomain = parts[0];
      if (
        subdomain.length > 2 &&
        subdomain !== "app" &&
        subdomain !== "cdn" &&
        subdomain !== "assets"
      ) {
        return subdomain.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }

    return parts[0].replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return null;
  }
}

function extractCreatorNameFromMarkdown(markdown = "") {
  const patterns = [
    /^#\s+(.+)$/m,
    /^##\s+(.+)$/m,
    /välkommen till\s+([A-ZÅÄÖ][^\n.!?]{2,40})/i,
    /skapad av\s+([A-ZÅÄÖ][^\n.!?]{2,40})/i,
    /av\s+([A-ZÅÄÖ][a-zåäö]+\s+[A-ZÅÄÖ][a-zåäö]+)/,
    /instruktör[:\s]+([A-ZÅÄÖ][^\n.!?]{2,40})/i,
    /lärare[:\s]+([A-ZÅÄÖ][^\n.!?]{2,40})/i,
  ];

  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    if (match && match[1] && !isJunkName(match[1].trim())) {
      return match[1].trim();
    }
  }

  return null;
}

function getBestCreatorName(metadata = {}, markdown = "", url = "") {
  const title = (metadata.title || "").trim();
  const { right } = splitTitleParts(title);

  if (right && !isJunkName(right) && right.length > 2) {
    return right;
  }

  const fromMarkdown = extractCreatorNameFromMarkdown(markdown);
  if (fromMarkdown) return fromMarkdown;

  const fromUrl = extractCreatorNameFromUrl(url);
  if (fromUrl) return fromUrl;

  return "Okänd kreatör";
}

function extractCourseCount(markdown = "") {
  const patterns = [
    /(\d+)\s*kurser/i,
    /(\d+)\s*courses?/i,
    /(\d+)\s*program/i,
    /(\d+)\s*utbildningar/i,
    /(\d+)\s*moduler/i,
  ];

  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > 0 && n < 500) return n;
    }
  }

  const headingMatches = markdown.match(/^#{1,3}\s+.+$/gm) || [];
  const courseHeadings = headingMatches.filter((h) => /(kurs|course|program|utbildning)/i.test(h));
  if (courseHeadings.length > 1) return courseHeadings.length;

  return null;
}

function extractFollowerCount(text = "") {
  const patterns = [
    /(\d[\d\s,.]*[kK]?)\s*(följare|followers)/i,
    /(\d[\d\s,.]*[kK]?)\s*(prenumeranter|subscribers)/i,
    /(\d[\d\s,.]*[kK]?)\s*(lyssnare|listeners)/i,
    /(\d[\d\s,.]*[kK]?)\s*(members|medlemmar)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const raw = match[1].replace(/\s/g, "").replace(",", ".");
      const multiplier = raw.toLowerCase().endsWith("k") ? 1000 : 1;
      const n = parseFloat(raw.replace(/[kK]/, "")) * multiplier;
      if (n > 0) return Math.round(n);
    }
  }

  return null;
}

function estimateReach(followerCount, socials = []) {
  if (followerCount !== null) {
    if (followerCount >= 10000) return "Stor (10k+)";
    if (followerCount >= 2000) return `Medel (${Math.round(followerCount / 1000)}k)`;
    if (followerCount >= 200) return `Liten (${followerCount})`;
    return `Mycket liten (${followerCount})`;
  }

  if (socials.length >= 3) return "Troligen medel (flera kanaler)";
  if (socials.length >= 1) return "Troligen liten (1-2 kanaler)";
  return "Okänd";
}

function calculateLeadScore({
  emails,
  prices,
  socials,
  likelySwedish,
  courseCount,
  followerCount,
  platform,
  isAggregator,
}) {
  let score = 0;

  if (likelySwedish) score += 3;
  if (emails.length > 0) score += 2;
  if (prices.length > 0) score += 2;
  if (courseCount !== null) score += 1;
  if (socials.length > 0) score += 1;
  if (followerCount !== null && followerCount >= 1000) score += 2;
  if (platform !== "Unknown" && platform !== "kurser.se" && platform !== "utbildning.se")
    score += 1;
  if (isAggregator) score -= 2;

  return score;
}

function canonicalizeUrl(url = "") {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("translate.google.com")) {
      const original = parsed.searchParams.get("u");
      if (original) {
        return canonicalizeUrl(original);
      }
    }

    parsed.hash = "";

    const clean = `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, "");
    return clean;
  } catch {
    return url;
  }
}

function splitTitleParts(title = "") {
  if (!title || !title.includes("|")) {
    return {
      left: title.trim(),
      right: "",
    };
  }

  const parts = title
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    left: parts[0] || "",
    right: parts[1] || "",
  };
}

function getBestCourseName(metadata = {}, markdown = "") {
  const title = (metadata.title || "").trim();
  const { left } = splitTitleParts(title);

  if (left && !isJunkName(left) && left.length > 2) {
    return left;
  }

  const firstHeadingMatch = markdown.match(/^#\s+(.+)$/m);
  if (firstHeadingMatch && firstHeadingMatch[1]) {
    const heading = firstHeadingMatch[1].trim();
    if (!isJunkName(heading)) {
      return heading;
    }
  }

  return null;
}

export function extractCreatorData({ url, markdown, metadata }) {
  const title = metadata.title || "";
  const description = metadata.description || "";
  const combinedText = `${title}\n${description}\n${markdown}`.trim();

  const cleanUrl = canonicalizeUrl(url);
  const platform = detectPlatform(cleanUrl);
  const isAggregator = isAggregatorPage(title, cleanUrl);

  const emails = extractEmails(combinedText);
  const prices = extractPrices(combinedText);
  const socials = extractSocials(combinedText);
  const likelySwedish = isSwedish(combinedText, cleanUrl);
  const creatorName = getBestCreatorName(metadata, markdown, cleanUrl);
  const courseName = getBestCourseName(metadata, markdown);
  const courseCount = extractCourseCount(markdown);
  const followerCount = extractFollowerCount(combinedText);

  const leadScore = calculateLeadScore({
    emails,
    prices,
    socials,
    likelySwedish,
    courseCount,
    followerCount,
    platform,
    isAggregator,
  });

  return {
    creatorName,
    courseName,
    platform,
    courseUrl: cleanUrl,
    subject: detectLikelyCategory(combinedText),
    courseCount,
    pricing: prices,
    contact: {
      website: canonicalizeUrl(metadata.sourceURL || cleanUrl),
      emails,
      socials,
    },
    estimatedReach: estimateReach(followerCount, socials),
    dataSource: platform,
    language: metadata.language || null,
    title,
    description,
    likelySwedish,
    leadScore,
    isAggregator,
  };
}
