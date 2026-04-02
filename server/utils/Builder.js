import { detectPlatform } from "./Platform.js";
import { isSwedish } from "./Swedish.js";
import {
  extractCreatorName,
  extractEmails,
  extractPrices,
  extractSocials,
  extractCourseCount,
  extractFollowerCount,
  detectCategory,
  estimateReach,
} from "./extractors.js";

export function buildCreator(url, markdown, metadata) {
  const title = metadata.title || "";
  const description = metadata.description || "";
  const combined = `${title}\n${description}\n${markdown}`.trim();

  const platform = detectPlatform(url);
  const likelySwedish = isSwedish(combined, url);

  const emails = extractEmails(combined);
  const prices = extractPrices(combined);
  const socials = extractSocials(combined);
  const courseCount = extractCourseCount(combined);
  const followerCount = extractFollowerCount(combined);
  const creatorName = extractCreatorName(metadata, markdown, url);

  let leadScore = 0;
  if (likelySwedish) leadScore += 3;
  if (emails.length > 0) leadScore += 2;
  if (prices.length > 0) leadScore += 2;
  if (courseCount !== null) leadScore += 1;
  if (socials.length > 0) leadScore += 1;
  if (followerCount !== null && followerCount >= 1000) leadScore += 2;
  if (platform !== "Annat" && platform !== "kurser.se" && platform !== "utbildning.se")
    leadScore += 1;

  return {
    creatorName,
    platform,
    courseUrl: url,
    subject: detectCategory(combined),
    courseCount,
    pricing: prices,
    contact: {
      website: metadata.sourceURL || url,
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
  };
}
