import { Parser } from "json2csv";

function flatten(creator) {
  return {
    creatorName: creator.creatorName || "",
    platform: creator.platform || "",
    courseUrl: creator.courseUrl || "",
    subject: creator.subject || "",
    courseCount: creator.courseCount ?? "",
    pricing: Array.isArray(creator.pricing) ? creator.pricing.join(" | ") : (creator.pricing || ""),
    website: creator.contact?.website || "",
    emails: (creator.contact?.emails || []).join(" | "),
    socials: (creator.contact?.socials || []).join(" | "),
    estimatedReach: creator.estimatedReach || "",
    dataSource: creator.dataSource || "",
    language: creator.language || "",
    title: creator.title || "",
    description: creator.description || "",
    likelySwedish: creator.likelySwedish ?? "",
    leadScore: creator.leadScore ?? "",
  };
}

const FIELDS = [
  "creatorName", "platform", "courseUrl", "subject", "courseCount",
  "pricing", "website", "emails", "socials", "estimatedReach",
  "dataSource", "language", "title", "description", "likelySwedish", "leadScore",
];

export function convertCreatorsToCsv(creators) {
  const parser = new Parser({ fields: FIELDS });
  return parser.parse(creators.map(flatten));
}