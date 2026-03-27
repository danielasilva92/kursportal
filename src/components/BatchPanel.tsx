import { useState, useCallback, useEffect, useRef } from "react";
import type { BatchJob, Creator } from "@/types/creator";
import { Play, Loader2, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { runPipeline, discoverUrls, findCreators, deepScan } from "../lib/api";

const batchTemplates: Omit<
  BatchJob,
  "id" | "status" | "progress" | "foundItems" | "startedAt" | "completedAt"
>[] = [
  { type: "google_serp", label: "Google SERP och aggregatorsidor", totalItems: 60 },
  { type: "aggregator_scrape", label: "Kurser.se och utbildning.se", totalItems: 40 },
  { type: "dns_lookup", label: "Djupskanning (Teachable, Kajabi, Thinkific...)", totalItems: 20 },
  { type: "manual_import", label: "Manuell URL-import", totalItems: 0 },
];

interface BatchPanelProps {
  onCreatorsFound: (creators: Creator[]) => void;
}

const BatchPanel = ({ onCreatorsFound }: BatchPanelProps) => {
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [manualUrls, setManualUrls] = useState("");
  const [showManual, setShowManual] = useState(false);

  const prevJobsRef = useRef<BatchJob[]>([]);

  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    for (const job of jobs) {
      const prev = prevJobsRef.current.find((j) => j.id === job.id);
      if (prev?.status === "running" && job.status === "completed") {
        const msg = `${job.label}: ${job.foundItems} kreatörer hittade`;
        toast.success(msg);
        if (Notification.permission === "granted") {
          new Notification("Sökning klar", { body: msg, icon: "/favicon.ico" });
        }
      } else if (prev?.status === "running" && job.status === "failed") {
        toast.error(`${job.label} misslyckades`);
      }
    }
    prevJobsRef.current = jobs;
  }, [jobs]);

  const updateJob = useCallback((id: string, patch: Partial<BatchJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const createJob = (template: (typeof batchTemplates)[number]): BatchJob => ({
    ...template,
    id: `job-${Date.now()}-${Math.random()}`,
    status: "running",
    progress: 0,
    foundItems: 0,
    startedAt: new Date().toISOString(),
  });

  const runGoogleSerp = useCallback(
    async (jobId: string) => {
      try {
        updateJob(jobId, { progress: 15 });
        const found = await runPipeline(100);
        updateJob(jobId, {
          status: "completed",
          progress: 100,
          foundItems: found.length,
          completedAt: new Date().toISOString(),
        });
        if (found.length > 0) onCreatorsFound(found);
      } catch {
        updateJob(jobId, { status: "failed", progress: 0 });
      }
    },
    [onCreatorsFound, updateJob]
  );

  const runAggregator = useCallback(
    async (jobId: string) => {
      try {
        updateJob(jobId, { progress: 20 });
        const urls = await discoverUrls();
        updateJob(jobId, { progress: 55 });

        if (urls.length === 0) {
          updateJob(jobId, {
            status: "completed",
            progress: 100,
            foundItems: 0,
            completedAt: new Date().toISOString(),
          });
          return;
        }

        const found = await findCreators(urls.slice(0, 20));
        updateJob(jobId, {
          status: "completed",
          progress: 100,
          foundItems: found.length,
          completedAt: new Date().toISOString(),
        });
        if (found.length > 0) onCreatorsFound(found);
      } catch {
        updateJob(jobId, { status: "failed", progress: 0 });
      }
    },
    [onCreatorsFound, updateJob]
  );

  const runDeepScan = useCallback(
    async (jobId: string) => {
      try {
        toast("Djupskanning startad", {
          description: "Detta kan ta flera minuter. Hämta gärna en kopp kaffe under tiden.",
          duration: 8000,
        });
        updateJob(jobId, { progress: 20 });
        const found = await deepScan(20);
        updateJob(jobId, {
          status: "completed",
          progress: 100,
          foundItems: found.length,
          completedAt: new Date().toISOString(),
        });
        if (found.length > 0) onCreatorsFound(found);
      } catch {
        updateJob(jobId, { status: "failed", progress: 0 });
      }
    },
    [onCreatorsFound, updateJob]
  );

  const runManualImport = useCallback(
    async (jobId: string) => {
      const urls = manualUrls
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.startsWith("http"));

      if (urls.length === 0) {
        updateJob(jobId, { status: "failed", progress: 0 });
        return;
      }

      try {
        updateJob(jobId, { status: "running", progress: 20, totalItems: urls.length });
        const found = await findCreators(urls);
        updateJob(jobId, {
          status: "completed",
          progress: 100,
          foundItems: found.length,
          completedAt: new Date().toISOString(),
        });
        if (found.length > 0) onCreatorsFound(found);
      } catch {
        updateJob(jobId, { status: "failed", progress: 0 });
      }
    },
    [onCreatorsFound, updateJob, manualUrls]
  );

  const startJob = useCallback(
    (template: (typeof batchTemplates)[number]) => {
      const job = createJob(template);
      setJobs((prev) => [...prev, job]);

      if (template.type === "google_serp") runGoogleSerp(job.id);
      else if (template.type === "aggregator_scrape") runAggregator(job.id);
      else if (template.type === "dns_lookup") runDeepScan(job.id);
      else if (template.type === "manual_import") runManualImport(job.id);
    },
    [runGoogleSerp, runAggregator, runManualImport]
  );

  const runAll = () => {
    setIsRunningAll(true);
    const autoTemplates = batchTemplates.filter((t) => t.type !== "manual_import" && t.type !== "dns_lookup");
    autoTemplates.forEach((t, i) => {
      setTimeout(() => startJob(t), i * 800);
    });
    setTimeout(() => setIsRunningAll(false), autoTemplates.length * 800 + 60000);
  };

  const statusIcon = (status: BatchJob["status"]) => {
    switch (status) {
      case "running":
        return <Loader2 className="w-4 h-4 text-mauve animate-spin" />;
      case "completed":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <CheckCircle2 className="w-4 h-4 text-mauve" />
          </motion.div>
        );
      case "failed":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
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
            {isRunningAll ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Söker...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" /> Kör alla
              </>
            )}
          </Button>
        </motion.div>
      </div>

      <div className="space-y-3">
        {batchTemplates.map((template, i) => {
          const activeJob = jobs.filter((j) => j.type === template.type).slice(-1)[0];
          const isManual = template.type === "manual_import";

          return (
            <motion.div
              key={template.type}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-start gap-3 p-3 rounded-md bg-background/50 group"
            >
              <div className="mt-0.5 shrink-0">
                {activeJob ? (
                  statusIcon(activeJob.status)
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (isManual) setShowManual((v) => !v);
                      else startJob(template);
                    }}
                    className="w-7 h-7 rounded-md bg-mauve/10 flex items-center justify-center hover:bg-mauve/20 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-mauve" />
                  </motion.button>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{template.label}</p>

                <AnimatePresence>
                  {isManual && showManual && !activeJob && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 overflow-hidden"
                    >
                      <textarea
                        className="w-full text-xs rounded-md border border-border bg-background p-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring/30"
                        rows={4}
                        placeholder={"En URL per rad\nhttps://kreativ.teachable.com\nhttps://marknadsfor.kajabi.com"}
                        value={manualUrls}
                        onChange={(e) => setManualUrls(e.target.value)}
                      />
                      <Button
                        size="sm"
                        className="mt-2 bg-mauve text-primary-foreground hover:bg-mauve/90 rounded-full text-xs px-4"
                        onClick={() => startJob(template)}
                      >
                        Starta import
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

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
                        {activeJob.status === "failed"
                          ? "Misslyckades"
                          : activeJob.status === "running"
                          ? "Hämtar..."
                          : `${activeJob.foundItems} hittade`}
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