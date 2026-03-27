import { useState, useMemo, useEffect, useRef } from "react";
import type { Creator } from "@/types/creator";
import { mockCreators } from "@/data/mockCreators";
import StatsCards from "@/components/StatsCards";
import BatchPanel from "@/components/BatchPanel";
import CreatorTable from "@/components/CreatorTable";
import ExportButton from "@/components/ExportButton";
import { Search, Filter, X } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import AIInsightPanel from "@/components/AIInsightPanel";

const PAGE_SIZE = 10;
const STORAGE_KEY = "kursportal-creators";

function loadFromStorage(): Creator[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : mockCreators;
  } catch {
    return mockCreators;
  }
}

const Index = () => {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 400], [0, 120]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);
  const orbScale = useTransform(scrollY, [0, 400], [1, 1.4]);
  const textY = useTransform(scrollY, [0, 400], [0, -40]);

  const [creators, setCreators] = useState<Creator[]>(loadFromStorage);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [minLeadScore, setMinLeadScore] = useState(0);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(creators));
    } catch {}
  }, [creators]);

  const filteredCreators = useMemo(() => {
    return creators.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.platform.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlatform = platformFilter === "all" || c.platform === platformFilter;
      const matchesScore = minLeadScore === 0 || (c.leadScore ?? 0) >= minLeadScore;
      return matchesSearch && matchesPlatform && matchesScore;
    });
  }, [creators, searchQuery, platformFilter, minLeadScore]);

  const platforms = useMemo(() => [...new Set(creators.map((c) => c.platform))], [creators]);
  const platformBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    creators.forEach((c) => { map[c.platform] = (map[c.platform] || 0) + 1; });
    return map;
  }, [creators]);

  const handleStatusChange = (id: string, status: Creator["status"]) => {
    setCreators((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  const handleNotesChange = (id: string, notes: string) => {
    setCreators((prev) => prev.map((c) => (c.id === id ? { ...c, notes } : c)));
    setSelectedCreator((prev) => (prev?.id === id ? { ...prev, notes } : prev));
  };

  const handleNewCreators = (newCreators: Creator[]) => {
    setCreators((prev) => {
      const existingUrls = new Set(prev.map((c) => c.url));
      const unique = newCreators.filter((c) => c.url && !existingUrls.has(c.url));
      return [...prev, ...unique];
    });
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <motion.header
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="gradient-hero px-6 pt-10 pb-14 md:pt-14 md:pb-20 relative overflow-hidden"
      >
        <motion.div
          className="absolute top-8 right-[15%] w-32 h-32 rounded-full bg-mauve/10 blur-2xl"
          style={{ scale: orbScale }}
          animate={{ y: [-8, 8, -8], x: [-4, 4, -4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-4 left-[10%] w-24 h-24 rounded-full bg-secondary/15 blur-2xl"
          style={{ scale: orbScale }}
          animate={{ y: [6, -6, 6] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary-foreground/5 blur-3xl"
          style={{ scale: orbScale }}
        />

        <motion.div style={{ y: textY }} className="container max-w-6xl relative z-10">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-primary-foreground/60 text-sm font-display uppercase tracking-widest mb-2"
          >
            Kursportal.se
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl md:text-5xl font-display font-bold text-primary-foreground leading-tight tracking-tight mb-3"
            style={{ lineHeight: "1.1" }}
          >
            Prospekteringsverktyg
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-primary-foreground/70 max-w-lg text-balance"
          >
            Hitta svenska kurskreatörer på internationella plattformar och konvertera dem till Kursportal-kunder.
          </motion.p>
        </motion.div>
      </motion.header>

      <main className="max-w-[1400px] mx-auto px-6 -mt-8 pb-16">
        <div className="flex items-start gap-8">
          <div className="w-full max-w-6xl min-w-0 space-y-6">
            <StatsCards
              totalCreators={creators.length}
              platformBreakdown={platformBreakdown}
              contacted={creators.filter((c) => c.status === "kontaktad").length}
              interested={creators.filter((c) => c.status === "intresserad").length}
            />

            <BatchPanel onCreatorsFound={handleNewCreators} />

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap"
            >
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Sök kreatör, ämne, plattform..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-full bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="bg-card border border-border rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 cursor-pointer"
                >
                  <option value="all">Alla plattformar</option>
                  {platforms.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                <select
                  value={minLeadScore}
                  onChange={(e) => setMinLeadScore(Number(e.target.value))}
                  className="bg-card border border-border rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 cursor-pointer"
                >
                  <option value={0}>Alla scores</option>
                  <option value={3}>Score 3+</option>
                  <option value={5}>Score 5+</option>
                  <option value={7}>Score 7+</option>
                  <option value={9}>Score 9+</option>
                </select>
              </div>

              <div className="sm:ml-auto">
                <ExportButton creators={filteredCreators} selectedIds={selectedIds} />
              </div>
            </motion.div>

            <CreatorTable
              creators={filteredCreators}
              onStatusChange={handleStatusChange}
              onSelectCreator={setSelectedCreator}
              selectedCreatorId={selectedCreator?.id ?? null}
              pageSize={PAGE_SIZE}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          </div>

          <div className="hidden xl:block w-[340px] shrink-0 pt-[120px]">
            <AIInsightPanel creator={selectedCreator} onNotesChange={handleNotesChange} />
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedCreator && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 xl:hidden"
              onClick={() => setSelectedCreator(null)}
            />
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 xl:hidden bg-background rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-background/90 backdrop-blur-sm flex items-center justify-between px-5 py-3 border-b border-border">
                <div className="w-10 h-1 rounded-full bg-border mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
                <span className="font-display font-semibold text-sm">AI-insikter</span>
                <button
                  onClick={() => setSelectedCreator(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <AIInsightPanel creator={selectedCreator} onNotesChange={handleNotesChange} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
