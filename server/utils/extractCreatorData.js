import { extractEmails, extractPrices, extractSocials } from "./extractors.js";
import { detectLikelyCategory } from "./detectLikelyCategory.js";
import { detectPlatform } from "./detectPlatform.js";
import { isSwedish } from "./isSwedish.js";

function getBestCreatorName(metadata = {}, markdown = "", url = "") {
  if (metadata.title && metadata.title.trim().length > 2) {
    return metadata.title.trim();
  }

  const firstHeadingMatch = markdown.match(/^#\s+(.+)$/m);
  if (firstHeadingMatch) {
    return firstHeadingMatch[1].trim();
  }

  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return hostname;
  } catch {
    return "Unknown creator";
  }
}

function calculateLeadScore({ emails, prices, socials, likelySwedish }) {
  let score = 0;

  if (likelySwedish) score += 3;
  if (emails.length > 0) score += 2;
  if (prices.length > 0) score += 1;
  if (socials.length > 0) score += 1;

  return score;
}

export function extractCreatorData({ url, markdown, metadata }) {
  const title = metadata.title || "";
  const description = metadata.description || "";
  const combinedText = `${title}\n${description}\n${markdown}`.trim();

  const emails = extractEmails(combinedText);
  const prices = extractPrices(combinedText);
  const socials = extractSocials(combinedText);
  const creatorName = getBestCreatorName(metadata, markdown, url);
  const likelySwedish = isSwedish(combinedText, url);

  const leadScore = calculateLeadScore({
    emails,
    prices,
    socials,
    likelySwedish,
  });

  return {
    creatorName,
    platform: detectPlatform(url),
    courseUrl: url,
    subject: detectLikelyCategory(combinedText),
    courseCount: null,
    pricing: prices,
    contact: {
      website: metadata.sourceURL || url,
      emails,
      socials,
    },
    estimatedReach: null,
    dataSource: detectPlatform(url),
    language: metadata.language || null,
    title,
    description,
    likelySwedish,
    leadScore,
  };
}