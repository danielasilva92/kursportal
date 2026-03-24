export function extractEmails(text = "") {
  const matches = text.match(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/gi);
  return matches ? [...new Set(matches)] : [];
}

export function extractPrices(text = "") {
  const matches = text.match(/\b(?:\d{2,3}(?:[ .]?\d{3})*|\d{2,6})\s?(?:kr|sek)\b|\b(?:kr|sek)\s?(?:\d{2,3}(?:[ .]?\d{3})*|\d{2,6})\b/gi);
  return matches ? [...new Set(matches)] : [];
}

export function extractSocials(text = "") {
  const urls = text.match(/https?:\/\/[^\s)"<\]]+/gi) || [];
  return [
    ...new Set(
      urls.filter((url) => {
        const lower = url.toLowerCase();
        return (
          lower.includes("instagram.com/") ||
          lower.includes("facebook.com/") ||
          lower.includes("linkedin.com/in/") ||
          lower.includes("linkedin.com/company/") ||
          lower.includes("youtube.com/") ||
          lower.includes("tiktok.com/@")
        );
      })
    ),
  ];
}

export function extractCourseCount(text = "") {
  const patterns = [
    /(\d+)\s*(online)?kurser/i,
    /(\d+)\s*(online)?courses/i,
    /(\d+)\s*program/i,
    /(\d+)\s*utbildningar/i,
    /(\d+)\s*moduler/i,
    /erbjuder\s+(\d+)/i,
    /contains\s+(\d+)\s+course/i,
    /(\d+)\s+course[s]?\s+available/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > 0 && n < 500) return n;
    }
  }
  return null;
}

export function extractFollowerCount(text = "") {
  const patterns = [
    /(\d[\d\s,.]*)\s*följare/i,
    /(\d[\d\s,.]*)\s*subscribers/i,
    /(\d[\d\s,.]*)\s*prenumeranter/i,
    /(\d[\d\s,.]*)\s*fans/i,
    /(\d[\d\s,.]*[kK])\s*(followers|följare|subscribers)/i,
    /followers[:\s]+(\d[\d\s,.]*[kK]?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let raw = match[1].replace(/\s/g, "").replace(",", ".");
      if (raw.toLowerCase().endsWith("k")) {
        return Math.round(parseFloat(raw) * 1000);
      }
      const n = parseInt(raw.replace(/[^0-9]/g, ""), 10);
      if (n > 0 && n < 100_000_000) return n;
    }
  }
  return null;
}