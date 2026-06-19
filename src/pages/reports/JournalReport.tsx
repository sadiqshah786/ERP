import { useEffect, useMemo, useState } from "react";
import { Download, Printer, BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { computeJournal, JournalLine } from "@/lib/ledger";
import { exportToCsv } from "@/lib/export";
import { printTable } from "@/lib/print";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function JournalReport() {
  const [lines, setLines] = useState<JournalLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    computeJournal().then(setLines).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let r = lines;
    if (from) r = r.filter((l) => !l.date || l.date >= from);
    if (to) r = r.filter((l) => !l.date || l.date <= to);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((l) => l.account.toLowerCase().includes(q) || l.ref.toLowerCase().includes(q) || l.type.toLowerCase().includes(q));
    }
    return r;
  }, [lines, search, from, to]);

  const totalDr = filtered.reduce((s, l) => s + l.debit, 0);
  const totalCr = filtered.reduce((s, l) => s + l.credit, 0);

  const exportCsv = () => exportToCsv("journal-report", filtered.map((l) => ({
    Date: l.date, Reference: l.ref, Type: l.type, Account: l.account, Debit: l.debit, Credit: l.credit,
  })));
  const print = () => printTable("Journal Report",
    [{ key: "date", label: "Date" }, { key: "ref", label: "Ref" }, { key: "type", label: "Type" }, { key: "account", label: "Account" }, { key: "debit", label: "Debit" }, { key: "credit", label: "Credit" }],
    filtered.map((l) => ({ ...l, debit: l.debit ? formatCurrency(l.debit) : "", credit: l.credit ? formatCurrency(l.credit) : "" })) as any);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Journal Report</h2>
          <p className="text-sm text-muted-foreground">Every posting line from all transactions — the day book.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={print} disabled={!filtered.length}><Printer className="h-4 w-4" /> Print</Button>
          <Button size="sm" onClick={exportCsv} disabled={!filtered.length}><Download className="h-4 w-4" /> Export</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4 card-shadow">
        <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">From</label><Input type="date" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">To</label><Input type="date" className="w-40" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="w-full pl-8" placeholder="Search account, ref, type…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="rounded-2xl border bg-card card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead><TableHead>Ref</TableHead><TableHead>Type</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6}>
                <div className="grid place-items-center gap-2 py-14 text-muted-foreground">
                  <BookOpen className="h-9 w-9" />
                  <p className="text-sm">No journal entries yet.</p>
                  <p className="text-xs">Post invoices, receipts, payments or opening balances to populate the day book.</p>
                </div>
              </TableCell></TableRow>
            ) : (
              <>
                {filtered.map((l, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap text-sm">{l.date ? formatDate(l.date) : "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{l.ref || "—"}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{l.type}</Badge></TableCell>
                    <TableCell className="font-medium">{l.account}</TableCell>
                    <TableCell className="text-right">{l.debit ? formatCurrency(l.debit) : "—"}</TableCell>
                    <TableCell className="text-right">{l.credit ? formatCurrency(l.credit) : "—"}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 font-extrabold">
                  <TableCell colSpan={4}>Total</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalDr)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalCr)}</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
