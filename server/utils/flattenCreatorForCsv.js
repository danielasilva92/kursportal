export function flattenCreatorForCsv(creator) {
  return {
    creatorName: creator.creatorName || "",
    platform: creator.platform || "",
    courseUrl: creator.courseUrl || "",
    subject: creator.subject || "",
    courseCount: creator.courseCount ?? "",
    pricing: Array.isArray(creator.pricing) ? creator.pricing.join(" | ") : "",
    website: creator.contact?.website || "",
    emails: Array.isArray(creator.contact?.emails) ? creator.contact.emails.join(" | ") : "",
    socials: Array.isArray(creator.contact?.socials) ? creator.contact.socials.join(" | ") : "",
    estimatedReach: creator.estimatedReach ?? "",
    dataSource: creator.dataSource || "",
    language: creator.language || "",
    title: creator.title || "",
    description: creator.description || "",
    likelySwedish: creator.likelySwedish ?? "",
    leadScore: creator.leadScore ?? "",
    courseName: creator.courseName || "",
  };
}