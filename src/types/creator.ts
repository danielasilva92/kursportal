export interface Creator {
  id: string;
  name: string;
  company?: string;
  platform: "Teachable" | "Kajabi" | "Thinkific" | "Podia" | "LearnWorlds" | "Annat";
  url: string;
  subject: string;
  courseCount?: number;
  pricing?: string;
  email?: string;
  website?: string;
  socialMedia?: string;
  estimatedReach?: string;
  source: string;
  status: "ny" | "kontaktad" | "intresserad" | "ej_intresserad";
  addedAt: string;
}

export interface BatchJob {
  id: string;
  type: "google_serp" | "dns_lookup" | "aggregator_scrape" | "manual_import";
  label: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  totalItems: number;
  foundItems: number;
  startedAt?: string;
  completedAt?: string;
}
