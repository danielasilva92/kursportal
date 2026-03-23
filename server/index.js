import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import FirecrawlApp from "@mendable/firecrawl-js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});