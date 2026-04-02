import { Users, Search, CheckCircle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardsProps {
  totalCreators: number;
  platformBreakdown: Record<string, number>;
  contacted: number;
  interested: number;
}

const StatsCards = ({
  totalCreators,
  platformBreakdown,
  contacted,
  interested,
}: StatsCardsProps) => {
  const stats = [
    { label: "Hittade kreatörer", value: totalCreators, icon: Users },
    { label: "Plattformar", value: Object.keys(platformBreakdown).length, icon: Search },
    { label: "Kontaktade", value: contacted, icon: CheckCircle },
    { label: "Intresserade", value: interested, icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -4, boxShadow: "0 12px 30px -8px rgba(0,0,0,0.12)" }}
          className="glass-card rounded-lg p-5 cursor-default"
        >
          <div className="flex items-center justify-between mb-3">
            <motion.div
              whileHover={{ rotate: 12, scale: 1.15 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <stat.icon className="w-5 h-5 text-mauve" />
            </motion.div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
          <motion.p
            className="text-3xl font-display font-bold tracking-tight"
            key={stat.value}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {stat.value}
          </motion.p>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;
