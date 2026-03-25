import { useState } from "react";
import type { Creator } from "@/types/creator";
import {
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Mail,
  Globe,
  Share2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CreatorTableProps {
  creators: Creator[];
  onStatusChange: (id: string, status: Creator["status"]) => void;
  onSelectCreator?: (creator: Creator) => void;
  selectedCreatorId?: string | null;
  pageSize?: number;
}

const statusConfig: Record<
  Creator["status"],
  { label: string; className: string }
> = {
  ny: {
    label: "Ny",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  kontaktad: {
    label: "Kontaktad",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  intresserad: {
    label: "Intresserad",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  ej_intresserad: {
    label: "Ej intresserad",
    className: "bg-neutral-100 text-neutral-500 border border-neutral-200",
  },
};

const platformConfig: Record<string, { dot: string; badge: string }> = {
  Teachable: {
    dot: "bg-violet-400",
    badge: "bg-violet-50 text-violet-700 border border-violet-200",
  },
  Kajabi: {
    dot: "bg-orange-400",
    badge: "bg-orange-50 text-orange-700 border border-orange-200",
  },
  Thinkific: {
    dot: "bg-sky-400",
    badge: "bg-sky-50 text-sky-700 border border-sky-200",
  },
  Podia: {
    dot: "bg-teal-400",
    badge: "bg-teal-50 text-teal-700 border border-teal-200",
  },
  LearnWorlds: {
    dot: "bg-rose-400",
    badge: "bg-rose-50 text-rose-700 border border-rose-200",
  },
  Annat: {
    dot: "bg-neutral-300",
    badge: "bg-neutral-50 text-neutral-600 border border-neutral-200",
  },
};

const reachConfig: Record<string, string> = {
  "Stor (10k+)": "text-emerald-600",
  Stor: "text-emerald-600",
  "Medel (2k–10k)": "text-amber-600",
  Medel: "text-amber-600",
  "Liten (<2k)": "text-neutral-400",
  Liten: "text-neutral-400",
};

function ContactIcons({ creator }: { creator: Creator }) {
  return (
    <div className="flex items-center gap-2">
      {creator.email && (
        <a
          href={`mailto:${creator.email}`}
          title={creator.email}
          className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-mauve/15 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Mail className="w-3 h-3 text-muted-foreground" />
        </a>
      )}
      {creator.website && (
        <a
          href={
            creator.website.startsWith("http")
              ? creator.website
              : `https://${creator.website}`
          }
          target="_blank"
          rel="noopener noreferrer"
          title={creator.website}
          className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-mauve/15 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Globe className="w-3 h-3 text-muted-foreground" />
        </a>
      )}
      {creator.socialMedia && (
        <span
          title={creator.socialMedia}
          className="w-6 h-6 rounded-full bg-muted flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Share2 className="w-3 h-3 text-muted-foreground" />
        </span>
      )}
    </div>
  );
}

const CreatorTable = ({
  creators,
  onStatusChange,
  onSelectCreator,
  selectedCreatorId,
  pageSize = 10,
}: CreatorTableProps) => {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(creators.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageCreators = creators.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const goTo = (p: number) => setPage(Math.max(1, Math.min(totalPages, p)));

  const pageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    pages.push(1);
    if (safePage > 3) pages.push("...");
    for (
      let i = Math.max(2, safePage - 1);
      i <= Math.min(totalPages - 1, safePage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (safePage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="space-y-3">
      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-xl overflow-hidden border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                {[
                  "Kreatör",
                  "Plattform",
                  "Ämne",
                  "Kurser",
                  "Prissättning",
                  "Kontakt",
                  "Räckvidd",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <AnimatePresence mode="wait">
              <motion.tbody
                key={safePage}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {pageCreators.map((creator, idx) => {
                  const platform =
                    platformConfig[creator.platform] ?? platformConfig.Annat;
                  const status = statusConfig[creator.status];

                  return (
                    <motion.tr
                      key={creator.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: idx * 0.03,
                        duration: 0.25,
                        ease: "easeOut",
                      }}
                      onClick={() => onSelectCreator?.(creator)}
                      className={`border-b border-border/30 hover:bg-muted/20 transition-colors duration-150 group cursor-pointer ${
                        selectedCreatorId === creator.id ? "bg-mauve/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground leading-tight">
                              {creator.name}
                            </span>
                            {creator.company && (
                              <span className="text-xs text-muted-foreground mt-0.5">
                                {creator.company}
                              </span>
                            )}
                          </div>
                          <a
                            href={creator.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-mauve" />
                          </a>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${platform.badge}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${platform.dot}`}
                          />
                          {creator.platform}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-muted-foreground text-sm">
                        {creator.subject}
                      </td>

                      <td className="px-4 py-3.5 tabular-nums text-center">
                        {creator.courseCount != null ? (
                          <span className="font-semibold text-foreground">
                            {creator.courseCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40 text-base">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-muted-foreground tabular-nums max-w-[160px]">
                        {creator.pricing ? (
                          <span className="font-medium text-foreground">
                            {creator.pricing}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40 text-base">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <ContactIcons creator={creator} />
                      </td>

                      <td className="px-4 py-3.5">
                        {creator.estimatedReach ? (
                          <span
                            className={`text-xs font-medium ${
                              reachConfig[creator.estimatedReach] ??
                              "text-muted-foreground"
                            }`}
                          >
                            {creator.estimatedReach}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40 text-base">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <select
                          value={creator.status}
                          onChange={(e) =>
                            onStatusChange(
                              creator.id,
                              e.target.value as Creator["status"]
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                          className={`text-xs rounded-full px-2.5 py-1 border outline-none cursor-pointer font-medium transition-colors ${status.className}`}
                        >
                          {Object.entries(statusConfig).map(([val, cfg]) => (
                            <option key={val} value={val}>
                              {cfg.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </motion.tr>
                  );
                })}

                {pageCreators.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-16 text-center text-muted-foreground text-sm"
                    >
                      Inga kreatörer matchar sökningen
                    </td>
                  </tr>
                )}
              </motion.tbody>
            </AnimatePresence>
          </table>
        </div>
      </motion.div>

      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-between px-1"
        >
          <p className="text-xs text-muted-foreground">
            Visar {(safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, creators.length)} av {creators.length}{" "}
            kreatörer
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => goTo(safePage - 1)}
              disabled={safePage === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {pageNumbers().map((p, i) =>
              p === "..." ? (
                <span
                  key={`ellipsis-${i}`}
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground text-xs"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goTo(p as number)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    safePage === p
                      ? "bg-mauve text-primary-foreground shadow-sm"
                      : "border border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => goTo(safePage + 1)}
              disabled={safePage === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CreatorTable;