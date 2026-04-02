const FIELDS = [
  "creatorName",
  "platform",
  "courseUrl",
  "subject",
  "courseCount",
  "pricing",
  "website",
  "emails",
  "socials",
  "estimatedReach",
  "dataSource",
  "language",
  "title",
  "description",
  "likelySwedish",
  "leadScore",
];

function escapeCsvField(value) {
  const str = String(value ?? "");
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function flatten(creator) {
  return {
    creatorName: creator.creatorName || "",
    platform: creator.platform || "",
    courseUrl: creator.courseUrl || "",
    subject: creator.subject || "",
    courseCount: creator.courseCount ?? "",
    pricing: Array.isArray(creator.pricing) ? creator.pricing.join(" | ") : creator.pricing || "",
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

export function convertCreatorsToCsv(creators) {
  const header = FIELDS.map(escapeCsvField).join(",");
  const rows = creators.map((c) => {
    const flat = flatten(c);
    return FIELDS.map((f) => escapeCsvField(flat[f])).join(",");
  });
  return [header, ...rows].join("\n");
}
