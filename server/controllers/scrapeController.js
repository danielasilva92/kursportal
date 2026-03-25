import {
  findCreatorsFromUrls,
  discoverCreatorUrls,
  runDiscoveryPipeline,
  scrapeAndBuildCreator,
} from "../services/CreatorService.js";

import { convertCreatorsToCsv } from "../services/ExportService.js";
import { analyzeCreatorWithAI } from "../services/aiAnalysisService.js";

export async function scrapeUrl(req, res) {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL saknas" });

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

export async function discoverCreators(req, res) {
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
    const limit = Math.min(Number(req.query.limit) || 20, 60);
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