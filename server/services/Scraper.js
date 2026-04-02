import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
  Accept: "text/html,application/xhtml+xml,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

function parseHtml(url, html) {
  const $ = cheerio.load(html);

  $("script, style, noscript, iframe, svg").remove();

  const title =
    $("title").first().text().trim() || $('meta[property="og:title"]').attr("content") || "";

  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";

  const language =
    $("html").attr("lang") || $('meta[http-equiv="content-language"]').attr("content") || "";

  const blocks = [];
  $("h1, h2, h3, p, li, td, th, span, div").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length > 15) blocks.push(text);
  });

  const links = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    if (href.startsWith("http")) {
      links.push(href);
    } else if (href.startsWith("/")) {
      try {
        const base = new URL(url);
        links.push(`${base.origin}${href}`);
      } catch {}
    }
  });

  const markdown = [...new Set(blocks)].join("\n") + "\n" + [...new Set(links)].join("\n");

  return {
    markdown,
    metadata: { title, description, sourceURL: url, language },
  };
}

function isThinResult(result) {
  return (result.markdown || "").length < 400;
}

async function scrapeStatic(url) {
  const response = await axios.get(url, {
    timeout: 25000,
    maxRedirects: 5,
    headers: BROWSER_HEADERS,
  });
  return parseHtml(url, response.data);
}

async function scrapeDynamic(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-default-apps",
      "--no-first-run",
      "--single-process",
    ],
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(BROWSER_HEADERS["User-Agent"]);
    await page.setExtraHTTPHeaders({ "Accept-Language": BROWSER_HEADERS["Accept-Language"] });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 55000 });
    const html = await page.content();
    return parseHtml(url, html);
  } finally {
    await browser.close();
  }
}

export async function scrapePage(url) {
  try {
    const result = await scrapeStatic(url);
    if (!isThinResult(result)) return result;
    return await scrapeDynamic(url);
  } catch {
    return await scrapeDynamic(url);
  }
}
