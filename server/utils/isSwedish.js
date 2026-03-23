export function isSwedish(text = "", url = "") {
  const lower = text.toLowerCase();
  const lowerUrl = url.toLowerCase();

  let score = 0;

  if (lowerUrl.includes(".se")) score += 2;

  if (lower.includes("kurs")) score += 1;
  if (lower.includes("kurser")) score += 1;
  if (lower.includes("utbildning")) score += 1;
  if (lower.includes("svenska")) score += 1;
  if (lower.includes("distanskurs")) score += 1;
  if (lower.includes("onlinekurs")) score += 1;
  if (lower.includes("anmäl")) score += 1;
  if (lower.includes("företag")) score += 1;
  if (lower.includes("kr")) score += 1;
  if (lower.includes("sek")) score += 1;

  return score >= 2;
}