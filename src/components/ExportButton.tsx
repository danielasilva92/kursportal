import { Download } from "lucide-react";
import type { Creator } from "@/types/creator";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  creators: Creator[];
  selectedIds?: Set<string>;
}

const ExportButton = ({ creators, selectedIds }: ExportButtonProps) => {
  const hasSelection = selectedIds && selectedIds.size > 0;
  const toExport = hasSelection ? creators.filter((c) => selectedIds.has(c.id)) : creators;

  const exportCSV = () => {
    const escape = (v: string | number) =>
      `"${String(v).replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;

    const headers = [
      "Namn", "Företag", "Plattform", "URL", "Ämne", "Antal kurser",
      "Prissättning", "E-post", "Webb", "Sociala medier", "Räckvidd",
      "Källa", "Status", "Score", "Anteckningar", "Tillagd",
    ];
    const rows = toExport.map((c) => [
      c.name, c.company ?? "", c.platform, c.url, c.subject,
      c.courseCount ?? "", c.pricing ?? "", c.email ?? "", c.website ?? "",
      c.socialMedia ?? "", c.estimatedReach ?? "", c.source, c.status,
      c.leadScore ?? "", c.notes ?? "", c.addedAt,
    ]);
    const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\r\n");
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
      {hasSelection ? `Exportera urval (${selectedIds.size})` : "Exportera CSV"}
    </Button>
  );
};

export default ExportButton;
