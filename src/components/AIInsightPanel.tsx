import { useEffect, useState } from "react";
import type { Creator } from "@/types/creator";
import type { CreatorAIAnalysis } from "@/types/ai";
import { analyzeCreator } from "@/lib/api";
import { Sparkles, Loader2, Brain, Target, Database, ArrowRight } from "lucide-react";

interface AIInsightPanelProps {
  creator: Creator | null;
  onNotesChange?: (id: string, notes: string) => void;
}

const badgeClasses: Record<"Låg" | "Medel" | "Hög", string> = {
  Låg: "bg-neutral-100 text-neutral-700 border border-neutral-200",
  Medel: "bg-amber-50 text-amber-700 border border-amber-200",
  Hög: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

export default function AIInsightPanel({ creator, onNotesChange }: AIInsightPanelProps) {
  const [analysis, setAnalysis] = useState<CreatorAIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAnalysis(null);
    setError("");
  }, [creator]);

  async function handleAnalyze() {
    if (!creator) return;

    setLoading(true);
    setError("");

    try {
      const result = await analyzeCreator(creator);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setLoading(false);
    }
  }

  if (!creator) {
    return (
      <aside className="glass-card rounded-2xl p-6 sticky top-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-mauve" />
          <h3 className="font-display text-lg font-semibold">AI-insikter</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Välj en kreatör i tabellen för att få en riktig AI-analys.
        </p>
      </aside>
    );
  }

  return (
    <aside className="glass-card rounded-2xl p-6 sticky top-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-mauve" />
          <h3 className="font-display text-lg font-semibold">AI-insikter</h3>
        </div>

        <div className="rounded-xl border border-border bg-background/70 p-4">
          <p className="font-semibold text-base">{creator.name}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {creator.platform} • {creator.subject}
          </p>
          <p className="text-xs text-muted-foreground mt-2 break-all">
            {creator.url}
          </p>
        </div>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full rounded-full bg-mauve text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-mauve/90 transition disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyserar...
          </>
        ) : (
          <>
            <Brain className="w-4 h-4" />
            Analysera med AI
          </>
        )}
      </button>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-background/70 p-3">
              <p className="text-xs text-muted-foreground">Svensk marknad</p>
              <p className="text-lg font-semibold">
                {analysis.swedishMarketScore}%
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 p-3">
              <p className="text-xs text-muted-foreground">Confidence</p>
              <p className="text-lg font-semibold">{analysis.confidence}%</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${badgeClasses[analysis.leadPotential]}`}
            >
              Lead: {analysis.leadPotential}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${badgeClasses[analysis.dataQuality]}`}
            >
              Datakvalitet: {analysis.dataQuality}
            </span>
          </div>

          <section className="rounded-xl border border-border bg-background/70 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-mauve" />
              <p className="font-medium">Sammanfattning</p>
            </div>
            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
          </section>

          <section className="rounded-xl border border-border bg-background/70 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-mauve" />
              <p className="font-medium">Outreach-vinkel</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {analysis.outreachAngle}
            </p>
          </section>

          <section className="rounded-xl border border-border bg-background/70 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-mauve" />
              <p className="font-medium">Kategori</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {analysis.suggestedCategory}
            </p>
          </section>

          <section className="rounded-xl border border-border bg-background/70 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight className="w-4 h-4 text-mauve" />
              <p className="font-medium">Nästa steg</p>
            </div>
            <p className="text-sm text-muted-foreground">{analysis.nextStep}</p>
          </section>

          <section className="rounded-xl border border-border bg-background/70 p-4">
            <p className="font-medium mb-2">Saknade datapunkter</p>
            {analysis.missingData.length > 0 ? (
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                {analysis.missingData.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Inga tydliga luckor identifierades.
              </p>
            )}
          </section>

          {analysis.reasoningBrief && (
            <section className="rounded-xl border border-border bg-background/70 p-4">
              <p className="font-medium mb-2">Kort motivering</p>
              <p className="text-sm text-muted-foreground">
                {analysis.reasoningBrief}
              </p>
            </section>
          )}
        </div>
      )}

      <section className="rounded-xl border border-border bg-background/70 p-4">
        <p className="font-medium mb-2 text-sm">Anteckningar</p>
        <textarea
          className="w-full text-sm bg-transparent resize-none focus:outline-none text-muted-foreground placeholder:text-muted-foreground/40 leading-relaxed"
          rows={3}
          placeholder="Lägg till anteckningar..."
          value={creator.notes ?? ""}
          onChange={(e) => onNotesChange?.(creator.id, e.target.value)}
        />
      </section>
    </aside>
  );
}