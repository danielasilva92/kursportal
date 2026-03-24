import type { Creator } from "@/types/creator";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

interface ApiCreator {
  creatorName?: string;
  platform?: string;
  courseUrl?: string;
  subject?: string;
  courseCount?: number | null;
  pricing?: string[];
  contact?: {
    website?: string;
    emails?: string[];
    socials?: string[];
  };
  estimatedReach?: string | null;
  dataSource?: string;
}

function mapToCreator(raw: ApiCreator, index: number): Creator {
  const validPlatforms = ["Teachable", "Kajabi", "Thinkific", "Podia", "LearnWorlds"] as const;
  const rawPlatform = raw.platform ?? "Annat";
  const platform = (validPlatforms as readonly string[]).includes(rawPlatform)
    ? (rawPlatform as Creator["platform"])
    : "Annat";

  return {
    id: `api-${Date.now()}-${index}`,
    name: raw.creatorName ?? "Okänd kreatör",
    platform,
    url: raw.courseUrl ?? "",
    subject: raw.subject ?? "Övrigt",
    courseCount: raw.courseCount ?? undefined,
    pricing: Array.isArray(raw.pricing) ? raw.pricing.join(" | ") : undefined,
    email: raw.contact?.emails?.[0] ?? undefined,
    website: raw.contact?.website ?? undefined,
    socialMedia: raw.contact?.socials?.[0] ?? undefined,
    estimatedReach: raw.estimatedReach ?? undefined,
    source: raw.dataSource ?? "API",
    status: "ny",
    addedAt: new Date().toISOString().slice(0, 10),
  };
}

export async function runPipeline(limit = 20): Promise<Creator[]> {
  const res = await fetch(`${BASE_URL}/api/run-pipeline?limit=${limit}`);
  if (!res.ok) throw new Error(`Pipeline misslyckades: ${res.status}`);
  const data = await res.json();
  return (data.creators ?? [])
    .filter((c: ApiCreator & { likelySwedish?: boolean }) => c.likelySwedish !== false)
    .map(mapToCreator);
}

export async function discoverUrls(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/api/discover-creators`);
  if (!res.ok) throw new Error(`Discovery misslyckades: ${res.status}`);
  const data = await res.json();
  return data.urls ?? [];
}

export async function findCreators(urls: string[]): Promise<Creator[]> {
  const res = await fetch(`${BASE_URL}/api/find-creators`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
  });
  if (!res.ok) throw new Error(`find-creators misslyckades: ${res.status}`);
  const data = await res.json();
  return (data.creators ?? [])
    .filter((c: ApiCreator & { likelySwedish?: boolean }) => c.likelySwedish !== false)
    .map(mapToCreator);
}