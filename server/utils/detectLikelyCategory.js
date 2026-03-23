export function detectLikelyCategory(text = "") {
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