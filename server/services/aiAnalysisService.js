import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY saknas i miljövariablerna");
  }

  return new OpenAI({ apiKey });
}

function safeNumber(value, fallback = null) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function sanitizeCreator(creator = {}) {
  return {
    name: creator.name ?? creator.creatorName ?? "Okänd kreatör",
    company: creator.company ?? "",
    platform: creator.platform ?? "Annat",
    url: creator.url ?? creator.courseUrl ?? "",
    subject: creator.subject ?? "Övrigt",
    courseCount: safeNumber(creator.courseCount),
    pricing: creator.pricing ?? "",
    email: creator.email ?? creator.contact?.emails?.[0] ?? "",
    website: creator.website ?? creator.contact?.website ?? "",
    socialMedia:
      creator.socialMedia ?? creator.contact?.socials?.join(", ") ?? "",
    estimatedReach: creator.estimatedReach ?? "",
    source: creator.source ?? creator.dataSource ?? "Okänd källa",
    description: creator.description ?? "",
    title: creator.title ?? "",
    likelySwedish:
      typeof creator.likelySwedish === "boolean" ? creator.likelySwedish : null,
  };
}

export async function analyzeCreatorWithAI(inputCreator) {
  const client = getClient();
  const creator = sanitizeCreator(inputCreator);

  const prompt = `
Du analyserar en potentiell svensk kurskreatör för Kursportal.se.

Mål:
1. Avgör om kreatören sannolikt riktar sig till svensk marknad
2. Bedöm lead-potential för Kursportal
3. Sammanfatta kreatören kort och konkret
4. Föreslå en outreach-vinkel
5. Bedöm datakvalitet
6. Lista saknade datapunkter
7. Ge ett tydligt nästa steg

Svara endast som JSON enligt detta schema.

Regler:
- Var försiktig med antaganden
- Om data saknas, skriv det tydligt
- Basera bedömningen på den information som finns
- SwedishMarketScore och confidence ska vara heltal 0 till 100
- leadPotential måste vara exakt en av: "Låg", "Medel", "Hög"
- dataQuality måste vara exakt en av: "Låg", "Medel", "Hög"

Data om kreatören:
${JSON.stringify(creator, null, 2)}
`;

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    input: prompt,
    text: {
      format: {
        type: "json_schema",
        name: "creator_analysis",
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            swedishMarketScore: { type: "number" },
            leadPotential: {
              type: "string",
              enum: ["Låg", "Medel", "Hög"],
            },
            suggestedCategory: { type: "string" },
            outreachAngle: { type: "string" },
            dataQuality: {
              type: "string",
              enum: ["Låg", "Medel", "Hög"],
            },
            missingData: {
              type: "array",
              items: { type: "string" },
            },
            nextStep: { type: "string" },
            confidence: { type: "number" },
            reasoningBrief: { type: "string" },
          },
          required: [
            "summary",
            "swedishMarketScore",
            "leadPotential",
            "suggestedCategory",
            "outreachAngle",
            "dataQuality",
            "missingData",
            "nextStep",
            "confidence",
            "reasoningBrief",
          ],
          additionalProperties: false,
        },
        strict: true,
      },
    },
  });

  if (!response.output_text) {
    throw new Error("AI returnerade inget svar");
  }

  let parsed;
  try {
    parsed = JSON.parse(response.output_text);
  } catch {
    throw new Error("AI-svaret gick inte att tolka som JSON");
  }

  return {
    summary: parsed.summary ?? "Ingen sammanfattning tillgänglig.",
    swedishMarketScore: Math.max(
      0,
      Math.min(100, Number(parsed.swedishMarketScore ?? 0))
    ),
    leadPotential: ["Låg", "Medel", "Hög"].includes(parsed.leadPotential)
      ? parsed.leadPotential
      : "Medel",
    suggestedCategory: parsed.suggestedCategory ?? "Övrigt",
    outreachAngle: parsed.outreachAngle ?? "Ingen rekommendation tillgänglig.",
    dataQuality: ["Låg", "Medel", "Hög"].includes(parsed.dataQuality)
      ? parsed.dataQuality
      : "Medel",
    missingData: Array.isArray(parsed.missingData) ? parsed.missingData : [],
    nextStep: parsed.nextStep ?? "Gör en manuell kontroll av kreatören.",
    confidence: Math.max(0, Math.min(100, Number(parsed.confidence ?? 0))),
    reasoningBrief: parsed.reasoningBrief ?? "",
  };
}