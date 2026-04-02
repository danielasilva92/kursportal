export interface CreatorAIAnalysis {
  summary: string;
  swedishMarketScore: number;
  leadPotential: "Låg" | "Medel" | "Hög";
  suggestedCategory: string;
  outreachAngle: string;
  dataQuality: "Låg" | "Medel" | "Hög";
  missingData: string[];
  nextStep: string;
  confidence: number;
  reasoningBrief: string;
}
