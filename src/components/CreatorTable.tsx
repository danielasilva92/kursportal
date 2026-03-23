import type { Creator } from "@/types/creator";
import { ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CreatorTableProps {
  creators: Creator[];
  onStatusChange: (id: string, status: Creator["status"]) => void;
}

const statusColors: Record<Creator["status"], string> = {
  ny: "bg-cream text-dark-earth",
  kontaktad: "bg-secondary/40 text-secondary-foreground",
  intresserad: "bg-mauve/20 text-mauve",
  ej_intresserad: "bg-muted text-muted-foreground",
};

const statusLabels: Record<Creator["status"], string> = {
  ny: "Ny",
  kontaktad: "Kontaktad",
  intresserad: "Intresserad",
  ej_intresserad: "Ej intresserad",
};

const platformColors: Record<string, string> = {
  Teachable: "bg-mauve/15 text-mauve",
  Kajabi: "bg-secondary/50 text-secondary-foreground",
  Thinkific: "bg-cream text-dark-earth",
  Podia: "bg-warm text-dark-earth",
  LearnWorlds: "bg-muted text-muted-foreground",
  Annat: "bg-muted text-muted-foreground",
};

const CreatorTable = ({ creators, onStatusChange }: CreatorTableProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card rounded-lg overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60">
              {["Kreatör", "Plattform", "Ämne", "Kurser", "Prissättning", "Källa", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-display font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <AnimatePresence mode="popLayout">
            <motion.tbody
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
              }}
            >
              {creators.map((creator) => (
                <motion.tr
                  key={creator.id}
                  layout
                  variants={{
                    hidden: { opacity: 0, x: -20, filter: "blur(4px)" },
                    visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
                  }}
                  exit={{ opacity: 0, x: 16, transition: { duration: 0.2 } }}
                  whileHover={{ backgroundColor: "rgba(var(--card), 0.5)" }}
                  className="border-b border-border/30 transition-colors duration-200 group"
                >
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium">{creator.name}</span>
                      {creator.company && (
                        <span className="block text-xs text-muted-foreground">{creator.company}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <motion.span
                      whileHover={{ scale: 1.08 }}
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${platformColors[creator.platform] || platformColors.Annat}`}
                    >
                      {creator.platform}
                    </motion.span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{creator.subject}</td>
                  <td className="px-4 py-3 tabular-nums">{creator.courseCount ?? "—"}</td>
                  <td className="px-4 py-3 text-xs tabular-nums">{creator.pricing ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{creator.source}</span>
                      <a href={creator.url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-3 h-3 text-mauve" />
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={creator.status}
                      onChange={(e) => onStatusChange(creator.id, e.target.value as Creator["status"])}
                      className={`text-xs rounded-full px-2.5 py-1 border-none outline-none cursor-pointer ${statusColors[creator.status]}`}
                    >
                      {Object.entries(statusLabels).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </AnimatePresence>
        </table>
      </div>
    </motion.div>
  );
};

export default CreatorTable;
