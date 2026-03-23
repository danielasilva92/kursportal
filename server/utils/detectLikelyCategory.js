export function detectLikelyCategory(text = "") {
  const lower = text.toLowerCase();

  if (lower.includes("ux") || lower.includes("design")) return "Design";
  if (lower.includes("seo") || lower.includes("marknadsföring")) return "Marknadsföring";
  if (lower.includes("foto") || lower.includes("fotografer")) return "Fotografi";
  if (lower.includes("ledarskap")) return "Ledarskap";
  if (lower.includes("excel") || lower.includes("office")) return "Produktivitet";
  if (lower.includes("programmering") || lower.includes("kod")) return "Tech";
  if (lower.includes("hälsa") || lower.includes("träning")) return "Hälsa";
  if (lower.includes("business")) return "Business";
  if (lower.includes("coaching")) return "Coaching";
  if (lower.includes("yoga")) return "Hälsa";
  if (lower.includes("coach")) return "Coaching";
if (lower.includes("developer")) return "Tech";
if (lower.includes("entreprenör")) return "Business";
if (lower.includes("företagande")) return "Business";

  return "Okänd";
}