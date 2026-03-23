import { useState, useCallback } from "react";
import type { BatchJob, Creator } from "@/types/creator";
import { Play, Loader2, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const batchTemplates: Omit<
BatchJob,
 "id" | "status" | "progress" | "foundItems" | "startedAt" | "completedAt"
 >[]
  = [
  { type: "google_serp", label: "Google SERP — Svenska nyckelord + Teachable/Kajabi", totalItems: 50 },
  { type: "dns_lookup", label: "DNS/CNAME Lookup — Svenska domäner → LMS-plattformar", totalItems: 30 },
  { type: "aggregator_scrape", label: "Scrapa kurser.se & utbildning.se", totalItems: 40 },
];

interface BatchPanelProps {
  onCreatorsFound: (creators: Creator[]) => void;
}

const generateFakeCreators = (count: number): Creator[] => {
  const names = ["Karin Ek", "Oskar Blom", "Frida Häll", "Jonas Vik", "Elin Dahl", "Nils Fors", "Sara Lid", "Axel Gran"];
  const subjects = ["UX Design", "SEO", "Fotografering", "Copywriting", "Ledarskap", "Excel", "AI & Automation", "Hälsa"];
  const platforms: Creator["platform"][] = ["Teachable", "Kajabi", "Thinkific", "Podia"];
  return Array.from({ length: count }, (_, i) => ({
    id: `batch-${Date.now()}-${i}`,
    name: names[i % names.length],
    platform: platforms[i % platforms.length],
    url: `https://example-${i}.teachable.com`,
    subject: subjects[i % subjects.length],
    courseCount: Math.floor(Math.random() * 10) + 1,
    pricing: `${Math.floor(Math.random() * 3000) + 299} kr`,
    source: "Batch import",
    status: "ny" as const,
    addedAt: new Date().toISOString().slice(0, 10),
  }));
};

const BatchPanel = ({ onCreatorsFound }: BatchPanelProps) => {
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [isRunningAll, setIsRunningAll] = useState(false);

  const startJob = useCallback((template: typeof batchTemplates[number]) => {
    const job: BatchJob = {
      ...template,
      id: `job-${Date.now()}`,
      status: "running",
      progress: 0,
      foundItems: 0,
      startedAt: new Date().toISOString(),
    };
    setJobs((prev) => [...prev, job]);
    const interval = setInterval(() => {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== job.id) return j;
          const newProgress = Math.min(j.progress + Math.random() * 18 + 5, 100);
          const done = newProgress >= 100;
          const found = done ? Math.floor(Math.random() * 8) + 2 : Math.floor((newProgress / 100) * (Math.random() * 8 + 2));
          if (done) {
            clearInterval(interval);
            onCreatorsFound(generateFakeCreators(found));
          }
          return { ...j, progress: done ? 100 : newProgress, foundItems: found, status: done ? "completed" : "running", completedAt: done ? new Date().toISOString() : undefined };
        })
      );
    }, 600);
  }, [onCreatorsFound]);

  const runAll = () => {
    setIsRunningAll(true);
    batchTemplates.forEach((t, i) => { setTimeout(() => startJob(t), i * 1200); });
    setTimeout(() => setIsRunningAll(false), batchTemplates.length * 1200 + 4000);
  };

  const statusIcon = (status: BatchJob["status"]) => {
    switch (status) {
      case "running": return <Loader2 className="w-4 h-4 text-mauve animate-spin" />;
      case "completed": return <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}><CheckCircle2 className="w-4 h-4 text-mauve" /></motion.div>;
      case "failed": return <AlertCircle className="w-4 h-4 text-destructive" />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card rounded-lg p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <motion.div
            className="w-8 h-8 rounded-md bg-mauve/15 flex items-center justify-center"
            whileHover={{ rotate: 15 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Zap className="w-4 h-4 text-mauve" />
          </motion.div>
          <div>
            <h2 className="font-display font-semibold text-lg">Batch-sökning</h2>
            <p className="text-xs text-muted-foreground">Kör flera datakällor parallellt</p>
          </div>
        </div>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            onClick={runAll}
            disabled={isRunningAll}
            className="bg-mauve text-primary-foreground hover:bg-mauve/90 rounded-full px-5"
          >
            {isRunningAll ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Kör batch…</> : <><Play className="w-4 h-4 mr-2" /> Kör alla</>}
          </Button>
        </motion.div>
      </div>

      <div className="space-y-3">
        {batchTemplates.map((template, i) => {
          const activeJob = jobs.filter((j) => j.type === template.type).slice(-1)[0];
          return (
            <motion.div
              key={template.type}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3 p-3 rounded-md bg-background/50 group"
            >
              {activeJob ? statusIcon(activeJob.status) : (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => startJob(template)}
                  className="w-7 h-7 rounded-md bg-mauve/10 flex items-center justify-center hover:bg-mauve/20 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-mauve" />
                </motion.button>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{template.label}</p>
                <AnimatePresence>
                  {activeJob && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-1.5 flex items-center gap-3 overflow-hidden"
                    >
                      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-mauve"
                          initial={{ width: 0 }}
                          animate={{ width: `${activeJob.progress}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                      <motion.span
                        className="text-xs text-muted-foreground tabular-nums whitespace-nowrap"
                        key={activeJob.foundItems}
                        initial={{ scale: 1.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                      >
                        {activeJob.foundItems} hittade
                      </motion.span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default BatchPanel;
