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