import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";

function cleanText(text = "") {
  return text.replace(/\s+/g, " ").trim();
}

function buildResult(url, html) {
  const $ = cheerio.load(html);

  const title = cleanText($("title").first().text() || "");
  const description = cleanText(
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    ""
  );


const links = [];

$("a").each((i, el) => {
  const href = $(el).attr("href");
  if (href && href.startsWith("http")) {
    links.push(href);
  }
});
  const bodyText = cleanText($("body").text() || "");

return {
  html,
  markdown: bodyText + "\n" + links.join("\n"),
    metadata: {
      title,
      description,
      sourceURL: url,
    language: $("html").attr("lang") || null,
    },
  };
}

async function scrapeStaticPage(url) {
  const response = await axios.get(url, {
    timeout: 30000,
    maxRedirects: 5,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
    },
  });

  return buildResult(url, response.data);
}

async function scrapeDynamicPage(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    );

    await page.setExtraHTTPHeaders({
      "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
    });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    const html = await page.content();
    return buildResult(url, html);
  } finally {
    await browser.close();
  }
}

function looksTooThin(result) {
  const textLength = (result?.markdown || "").length;
  const titleLength = (result?.metadata?.title || "").length;

  return textLength < 300 && titleLength < 5;
}

export async function scrapePage(url) {
  try {
    const staticResult = await scrapeStaticPage(url);

    if (!looksTooThin(staticResult)) {
      console.log("Static scrape OK:", url);
      return staticResult;
    }

    console.log("Static scrape thin, trying puppeteer:", url);
    return await scrapeDynamicPage(url);
  } catch (error) {
    console.log("Static scrape failed, trying puppeteer:", url, error.message);
    return await scrapeDynamicPage(url);
  }
}