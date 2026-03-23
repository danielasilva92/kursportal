import { Download } from "lucide-react";
import type { Creator } from "@/types/creator";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  creators: Creator[];
}

const ExportButton = ({ creators }: ExportButtonProps) => {
  const exportCSV = () => {
    const headers = ["Namn", "Företag", "Plattform", "URL", "Ämne", "Antal kurser", "Prissättning", "E-post", "Webb", "Sociala medier", "Räckvidd", "Källa", "Status", "Tillagd"];
    const rows = creators.map((c) => [
      c.name, c.company ?? "", c.platform, c.url, c.subject, c.courseCount ?? "", c.pricing ?? "",
      c.email ?? "", c.website ?? "", c.socialMedia ?? "", c.estimatedReach ?? "", c.source, c.status, c.addedAt,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kursportal-prospektering-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      onClick={exportCSV}
      variant="outline"
      className="rounded-full border-border hover:bg-card active:scale-[0.97] transition-all duration-150"
    >
      <Download className="w-4 h-4 mr-2" />
      Exportera CSV
    </Button>
  );
};

export default ExportButton;
