import { Calendar, Download, Filter, Printer, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportToCsv } from "@/lib/export";
import { printTable } from "@/lib/print";

const REPORT_COLUMNS = [
  { key: "date", label: "Date" }, { key: "reference", label: "Reference" },
  { key: "description", label: "Description" }, { key: "debit", label: "Debit" },
  { key: "credit", label: "Credit" }, { key: "balance", label: "Balance" },
];

export function ReportPage({ title }: { title: string }) {
  const exportCsv = () => exportToCsv(title.replace(/\s+/g, "-").toLowerCase(), [], REPORT_COLUMNS);
  const print = () => printTable(title, REPORT_COLUMNS, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">Filter, preview and export your {title.toLowerCase()}.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={print}><Printer className="h-4 w-4" /> Print</Button>
          <Button size="sm" onClick={exportCsv}><Download className="h-4 w-4" /> Export</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 card-shadow">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">From</label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="date" className="w-44 pl-8" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="date" className="w-44 pl-8" />
          </div>
        </div>
        <Button variant="secondary"><Filter className="h-4 w-4" /> Apply Filters</Button>
      </div>

      <div className="rounded-xl border bg-card card-shadow">
        <div className="border-b px-5 py-3 text-sm font-semibold">{title}</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6}>
                <div className="grid place-items-center gap-2 py-16 text-muted-foreground">
                  <BarChart3 className="h-9 w-9" />
                  <p className="text-sm">No data for the selected period.</p>
                  <p className="text-xs">Post some transactions, then apply filters to populate this report.</p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
