import { useEffect, useMemo, useState } from "react";
import { Download, Printer, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { computeLedger, Bal } from "@/lib/ledger";
import { exportToCsv } from "@/lib/export";
import { printTable } from "@/lib/print";
import { formatCurrency } from "@/lib/utils";

interface Row { account: string; debit: number; credit: number }

export default function TrialBalance() {
  const [balances, setBalances] = useState<Map<string, Bal>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    computeLedger().then((d) => setBalances(d.balances)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    balances.forEach((b, account) => {
      const net = b.debit - b.credit;
      if (Math.abs(net) < 0.005) return;
      out.push({ account, debit: net > 0 ? net : 0, credit: net < 0 ? -net : 0 });
    });
    return out.sort((a, b) => a.account.localeCompare(b.account));
  }, [balances]);

  const totalDr = rows.reduce((s, r) => s + r.debit, 0);
  const totalCr = rows.reduce((s, r) => s + r.credit, 0);
  const balanced = Math.abs(totalDr - totalCr) < 0.01;

  const exportCsv = () => exportToCsv("trial-balance", rows.map((r) => ({ Account: r.account, Debit: r.debit, Credit: r.credit })));
  const print = () => printTable("Trial Balance",
    [{ key: "account", label: "Account" }, { key: "debit", label: "Debit" }, { key: "credit", label: "Credit" }],
    rows.map((r) => ({ ...r, debit: formatCurrency(r.debit), credit: formatCurrency(r.credit) })) as any);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Trial Balance</h2>
          <p className="text-sm text-muted-foreground">Live account balances derived from all posted transactions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={balanced ? "success" : "destructive"}>{balanced ? "Balanced ✓" : "Out of balance"}</Badge>
          <Button variant="outline" size="sm" onClick={print} disabled={!rows.length}><Printer className="h-4 w-4" /> Print</Button>
          <Button size="sm" onClick={exportCsv} disabled={!rows.length}><Download className="h-4 w-4" /> Export</Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={3}>
                <div className="grid place-items-center gap-2 py-12 text-muted-foreground">
                  <Scale className="h-8 w-8" />
                  <p className="text-sm">No posted transactions yet. Create invoices, receipts or payments to populate the trial balance.</p>
                </div>
              </TableCell></TableRow>
            ) : (
              <>
                {rows.map((r) => (
                  <TableRow key={r.account}>
                    <TableCell className="font-medium">{r.account}</TableCell>
                    <TableCell className="text-right">{r.debit ? formatCurrency(r.debit) : "—"}</TableCell>
                    <TableCell className="text-right">{r.credit ? formatCurrency(r.credit) : "—"}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 font-extrabold">
                  <TableCell>Total</TableCell>
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
