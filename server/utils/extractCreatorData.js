import { extractEmails, extractPrices, extractSocials } from "./extractors.js";
import { detectLikelyCategory } from "./detectLikelyCategory.js";
import { detectPlatform } from "./detectPlatform.js";
import { isSwedish } from "./isSwedish.js";

export function extractCreatorData({ url, markdown, metadata }) {
  const title = metadata.title || "";
  const description = metadata.description || "";
  const combinedText = `${title}\n${description}\n${markdown}`.trim();

  if (!isSwedish(combinedText, url)) {
    return null;
  }

  const emails = extractEmails(combinedText);
  const prices = extractPrices(combinedText);
  const socials = extractSocials(combinedText);

  return {
    creatorName: title || "Unknown creator",
    platform: detectPlatform(url),
    courseUrl: url,
    subject: detectLikelyCategory(combinedText),
    courseCount: null,
    pricing: prices.length > 0 ? prices : [],
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
  };
}