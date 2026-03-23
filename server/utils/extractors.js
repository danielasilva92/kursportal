export function extractEmails(text = "") {
  const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  return matches ? [...new Set(matches)] : [];
}

export function extractPrices(text = "") {
  const matches = text.match(/\b\d{2,6}\s?(kr|sek)\b/gi);
  return matches ? [...new Set(matches)] : [];
}

export function extractSocials(text = "") {
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