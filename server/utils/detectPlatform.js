export function detectPlatform(url = "") {
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