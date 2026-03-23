import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import FirecrawlApp from "@mendable/firecrawl-js";
import { Parser } from "json2csv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function detectPlatform(url = "") {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes("teachable")) return "Teachable";
  if (lowerUrl.includes("kajabi")) return "Kajabi";
  if (lowerUrl.includes("thinkific")) return "Thinkific";
  if (lowerUrl.includes("podia")) return "Podia";
  if (lowerUrl.includes("learnworlds")) return "LearnWorlds";
  if (lowerUrl.includes("kurser.se")) return "kurser.se";
  if (lowerUrl.includes("utbildning.se")) return "utbildning.se";

  return "Unknown";
}

function extractEmails(text = "") {
  const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  return matches ? [...new Set(matches)] : [];
}

function extractPrices(text = "") {
  const matches = text.match(/\b\d{2,6}\s?(kr|sek)\b/gi);
  return matches ? [...new Set(matches)] : [];
}

function extractSocials(text = "") {
  const urls = text.match(/https?:\/\/[^\s)]+/gi) || [];

  return urls.filter((url) => {
    const lower = url.toLowerCase();
    return (
      lower.includes("instagram.com") ||
      lower.includes("facebook.com") ||
      lower.includes("linkedin.com") ||
      lower.includes("youtube.com") ||
      lower.includes("tiktok.com")
    );
  });
}

function detectLikelyCategory(text = "") {
  const lower = text.toLowerCase();

  if (lower.includes("ux") || lower.includes("design")) return "Design";
  if (lower.includes("seo") || lower.includes("marknadsföring")) return "Marknadsföring";
  if (lower.includes("foto") || lower.includes("fotografer")) return "Fotografi";
  if (lower.includes("ledarskap")) return "Ledarskap";
  if (lower.includes("excel") || lower.includes("office")) return "Produktivitet";
  if (lower.includes("programmering") || lower.includes("kod")) return "Tech";
  if (lower.includes("hälsa") || lower.includes("träning")) return "Hälsa";

  return "Okänd";
}

function extractCreatorData({ url, markdown, metadata }) {
  const title = metadata.title || "";
  const description = metadata.description || "";
  const combinedText = `${title}\n${description}\n${markdown}`.trim();

  if (!isSwedish(combinedText)) {
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

function isSwedish(text = "") {
  const lower = text.toLowerCase();

  return (
    lower.includes("kurs") ||
    lower.includes("kurser") ||
    lower.includes("utbildning") ||
    lower.includes("svenska") ||
    lower.includes("distanskurs") ||
    lower.includes("onlinekurs") ||
    lower.includes("kr") ||
    lower.includes("sek")
  );
}
function flattenCreatorForCsv(creator) {
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
  };
}


const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

app.get("/", (req, res) => {
  res.json({ message: "Backend is running " });
});

app.post("/api/scrape", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const result = await firecrawl.scrape(url, {
      formats: ["markdown"],
    });

   res.json({
  title: result.metadata?.title,
  description: result.metadata?.description,
  content: result.markdown,
    });
  } catch (error) {
    console.error("Firecrawl error:", error);
    res.status(500).json({
      error: "Scraping failed",
      details: error?.message || "Unknown error",
    });
  }
});


app.post("/api/find-creators", async (req, res) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: "urls must be a non-empty array" });
    }

    const results = [];

    for (const url of urls) {
  try {
    const scraped = await firecrawl.scrape(url, {
      formats: ["markdown"],
    });

    const markdown = scraped.markdown || "";
    const metadata = scraped.metadata || {};

    const creator = extractCreatorData({
      url,
      markdown,
      metadata,
    });

    if (creator) {
      results.push(creator);
    }
  } catch (error) {
    results.push({
      url,
      platform: detectPlatform(url),
      dataSource: detectPlatform(url),
      error: error?.message || "Failed to scrape",
    });
  }
}

    res.json({
      success: true,
      count: results.length,
      creators: results,
    });
  } catch (error) {
    console.error("find-creators error:", error);
    res.status(500).json({
      error: "Finding creators failed",
      details: error?.message || "Unknown error",
    });
  }
});

app.get("/api/discover-creators", async (req, res) => {
  try {
    const seedUrls = [
      "https://www.kurser.se",
      "https://www.utbildning.se"
    ];

    const discovered = [];

    for (const url of seedUrls) {
      const scraped = await firecrawl.scrape(url, {
        formats: ["markdown"],
      });

      const text = scraped.markdown || "";

      const urls = text.match(/https?:\/\/[^\s)]+/gi) || [];

      const filtered = urls.filter((u) => {
  const lower = u.toLowerCase();
  return (
    lower.includes("teachable") ||
    lower.includes("kajabi") ||
    lower.includes("thinkific")
  );
});

      discovered.push(...filtered);
    }

    const unique = [...new Set(discovered)];

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
});

app.post("/api/export-csv", async (req, res) => {
  try {
    const { creators } = req.body;

    if (!creators || !Array.isArray(creators) || creators.length === 0) {
      return res.status(400).json({ error: "creators must be a non-empty array" });
    }

    const flattened = creators.map(flattenCreatorForCsv);

    const fields = [
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
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(flattened);

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
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});