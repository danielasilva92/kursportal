import {
  findCreatorsFromUrls,
  discoverCreatorUrls,
  runDiscoveryPipeline,
  scrapeAndBuildCreator,
} from "../services/creatorService.js";

import { convertCreatorsToCsv } from "../services/exportService.js";
import { analyzeCreatorWithAI } from "../services/aiAnalysisService.js";
import { discoverViaWayback } from "../services/WaybackDiscoveryService.js";
import { discoverViaAggregatorFollow } from "../services/AggregatorFollowService.js";

const BLOCKED_HOSTS = [
  "localhost",
  "127.",
  "0.0.0.0",
  "::1",
  "169.254.",
  "10.",
  "192.168.",
  "172.16.",
  "172.17.",
  "172.18.",
  "172.19.",
  "172.20.",
  "172.21.",
  "172.22.",
  "172.23.",
  "172.24.",
  "172.25.",
  "172.26.",
  "172.27.",
  "172.28.",
  "172.29.",
  "172.30.",
  "172.31.",
];

function validateUrl(raw) {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, message: "Ogiltig URL" };
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { ok: false, message: "Endast http och https är tillåtna" };
  }
  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.some((b) => host === b || host.startsWith(b))) {
    return { ok: false, message: "URL pekar på en intern adress" };
  }
  return { ok: true };
}

export async function scrapeUrl(req, res) {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL saknas" });

    const check = validateUrl(url);
    if (!check.ok) return res.status(400).json({ error: check.message });

    const creator = await scrapeAndBuildCreator(url);
    res.json({ success: true, creator });
  } catch (error) {
    res.status(500).json({ error: "Skrapning misslyckades", details: error?.message });
  }
}

export async function findCreators(req, res) {
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: "urls måste vara en array med minst ett värde" });
    }
    if (urls.length > 200) {
      return res.status(400).json({ error: "Max 200 URL:er per anrop" });
    }

    for (const url of urls) {
      const check = validateUrl(url);
      if (!check.ok) return res.status(400).json({ error: `Ogiltig URL "${url}": ${check.message}` });
    }

    const results = await findCreatorsFromUrls(urls);

    res.json({
      success: true,
      totalCount: results.length,
      swedishCount: results.filter((c) => c.likelySwedish).length,
      creators: results,
    });
  } catch (error) {
    res.status(500).json({ error: "find-creators misslyckades", details: error?.message });
  }
}

export async function discoverCreators(_req, res) {
  try {
    const urls = await discoverCreatorUrls();
    res.json({ success: true, count: urls.length, urls });
  } catch (error) {
    res.status(500).json({ error: "Discovery misslyckades", details: error?.message });
  }
}

export async function exportCsv(req, res) {
  try {
    const { creators } = req.body;
    if (!creators || !Array.isArray(creators) || creators.length === 0) {
      return res.status(400).json({ error: "creators måste vara en array med minst ett värde" });
    }

    const csv = convertCreatorsToCsv(creators);
    res.header("Content-Type", "text/csv; charset=utf-8");
    res.attachment("kreatorer.csv");
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: "CSV-export misslyckades", details: error?.message });
  }
}

export async function runPipeline(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit) || 40, 40);
    const result = await runDiscoveryPipeline(limit);

    res.json({
      success: true,
      discoveredCount: result.discoveredCount,
      selectedCount: result.selectedCount,
      creatorsCount: result.creatorsCount,
      swedishCount: result.creators.filter((c) => c.likelySwedish).length,
      creators: result.creators,
    });
  } catch (error) {
    res.status(500).json({ error: "Pipeline misslyckades", details: error?.message });
  }
}

export async function runDeepScan(_req, res) {
  try {
    const [waybackUrls, aggregatorUrls] = await Promise.all([
      discoverViaWayback().catch(() => []),
      discoverViaAggregatorFollow().catch(() => []),
    ]);
    const allUrls = [...new Set([...waybackUrls, ...aggregatorUrls])];
    const sample = allUrls.sort(() => Math.random() - 0.5).slice(0, 15);
    const creators = await findCreatorsFromUrls(sample);
    const swedish = creators.filter((c) => c.likelySwedish === true);

    res.json({
      success: true,
      discoveredCount: allUrls.length,
      creatorsCount: swedish.length,
      creators: swedish,
    });
  } catch (error) {
    res.status(500).json({ error: "Djupskanning misslyckades", details: error?.message });
  }
}

export async function analyzeCreator(req, res) {
  try {
    const { creator } = req.body;

    if (!creator || typeof creator !== "object") {
      return res.status(400).json({ error: "creator måste skickas med i request body" });
    }

    const analysis = await analyzeCreatorWithAI(creator);

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    res.status(500).json({
      error: "AI-analys misslyckades",
      details: error?.message || "Okänt fel",
    });
  }
}