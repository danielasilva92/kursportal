
import {
  findCreatorsFromUrls,
  discoverCreatorUrls,
  runDiscoveryPipeline,
} from "../services/creatorService.js";
import { convertCreatorsToCsv } from "../services/exportService.js";

export async function scrapeUrl(req, res) {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const result = await scrapePage(url);

    res.json({
      title: result.metadata?.title,
      description: result.metadata?.description,
      content: result.markdown,
    });
  } catch (error) {
  
    res.status(500).json({
      error: "Scraping failed",
      details: error?.message || "Unknown error",
    });
  }
}

export async function findCreators(req, res) {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: "urls must be a non-empty array" });
    }

    const results = await findCreatorsFromUrls(urls);

    const swedish = results.filter((creator) => creator.likelySwedish);
    const nonSwedish = results.filter((creator) => !creator.likelySwedish);

    res.json({
      success: true,
      totalCount: results.length,
      swedishCount: swedish.length,
      nonSwedishCount: nonSwedish.length,
      creators: results,
    });
  } catch (error) {
    console.error("find-creators error:", error);
    res.status(500).json({
      error: "Finding creators failed",
      details: error?.message || "Unknown error",
    });
  }
}

export async function discoverCreators(req, res) {
  try {
    const unique = await discoverCreatorUrls();

    res.json({
      success: true,
      count: unique.length,
      urls: unique,
    });
  } catch (error) {
    console.error("discover-creators error:", error);
    res.status(500).json({
      error: "Discovery failed",
      details: error?.message || "Unknown error",
    });
  }
}

export async function exportCsv(req, res) {
  try {
    const { creators } = req.body;

    if (!creators || !Array.isArray(creators) || creators.length === 0) {
      return res.status(400).json({ error: "creators must be a non-empty array" });
    }

    const csv = convertCreatorsToCsv(creators);

    res.header("Content-Type", "text/csv; charset=utf-8");
    res.attachment("creators.csv");
    return res.send(csv);
  } catch (error) {
    console.error("export-csv error:", error);
    res.status(500).json({
      error: "CSV export failed",
      details: error?.message || "Unknown error",
    });
  }
}

export async function runPipeline(req, res) {
  try {
    const limit = Number(req.query.limit) || 20;

    const result = await runDiscoveryPipeline(limit);

    const swedish = result.creators.filter((creator) => creator.likelySwedish);
    const nonSwedish = result.creators.filter((creator) => !creator.likelySwedish);

    res.json({
      success: true,
      discoveredCount: result.discoveredCount,
      selectedCount: result.selectedCount,
      creatorsCount: result.creatorsCount,
      swedishCount: swedish.length,
      nonSwedishCount: nonSwedish.length,
      creators: result.creators,
    });
  } catch (error) {
    console.error("run-pipeline error:", error);
    res.status(500).json({
      error: "Pipeline failed",
      details: error?.message || "Unknown error",
    });
  }
}