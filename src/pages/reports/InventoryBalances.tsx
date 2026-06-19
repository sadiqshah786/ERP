import { useEffect, useMemo, useState } from "react";
import { Download, Printer, Boxes, AlertTriangle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { computeLedger, itemStockRows, ItemStockRow } from "@/lib/ledger";
import { getCostMethod, COST_METHOD_LABEL } from "@/lib/costing";
import { exportToCsv } from "@/lib/export";
import { printTable } from "@/lib/print";
import { formatCurrency } from "@/lib/utils";

export default function InventoryBalances({ lowStockOnly = false }: { lowStockOnly?: boolean }) {
  const [rows, setRows] = useState<ItemStockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    computeLedger().then((d) => setRows(itemStockRows(d))).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let r = rows;
    if (lowStockOnly) r = r.filter((x) => x.balance <= x.reorder);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((x) => x.name.toLowerCase().includes(q) || x.code.toLowerCase().includes(q));
    }
    return r;
  }, [rows, search, lowStockOnly]);

  const totalValue = filtered.reduce((s, r) => s + r.value, 0);
  const totalQty = filtered.reduce((s, r) => s + r.balance, 0);
  const title = lowStockOnly ? "Low Stock Alert" : "Inventory Balances";

  const exportCsv = () => exportToCsv(title.replace(/\s+/g, "-").toLowerCase(),
    filtered.map((r) => ({ Code: r.code, Item: r.name, Unit: r.unit, Opening: r.opening, In: r.in, Out: r.out, Balance: r.balance, Rate: r.rate, Value: r.value })));
  const print = () => printTable(title,
    [{ key: "code", label: "Code" }, { key: "name", label: "Item" }, { key: "balance", label: "Balance" }, { key: "value", label: "Value" }],
    filtered as any);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{title}</h2>
            {!lowStockOnly && <Badge variant="secondary">{COST_METHOD_LABEL[getCostMethod()]}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {lowStockOnly ? "Items at or below their reorder level — computed live from stock movements." : "Live stock per item, valued by the selected costing method (Settings → Inventory Movement)."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="w-full pl-8" placeholder="Search item…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" onClick={print} disabled={!filtered.length}><Printer className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}><Download className="h-4 w-4" /> Export</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Items" value={String(filtered.length)} />
        <Stat label="Total Quantity" value={totalQty.toLocaleString()} />
        <Stat label="Stock Value" value={formatCurrency(totalValue)} />
      </div>

      <div className="rounded-2xl border bg-card card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead><TableHead>Item</TableHead><TableHead>Unit</TableHead>
              <TableHead className="text-right">Opening</TableHead>
              <TableHead className="text-right">In</TableHead>
              <TableHead className="text-right">Out</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9}>
                <div className="grid place-items-center gap-2 py-12 text-muted-foreground">
                  <Boxes className="h-8 w-8" />
                  <p className="text-sm">{lowStockOnly ? "No items below reorder level. 🎉" : "No items yet. Add items in Maintain → Items/Products."}</p>
                </div>
              </TableCell></TableRow>
            ) : filtered.map((r) => {
              const low = r.balance <= r.reorder;
              return (
                <TableRow key={r.code + r.name}>
                  <TableCell className="font-mono text-xs">{r.code || "—"}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.unit || "—"}</TableCell>
                  <TableCell className="text-right">{r.opening}</TableCell>
                  <TableCell className="text-right text-success">{r.in}</TableCell>
                  <TableCell className="text-right text-destructive">{r.out}</TableCell>
                  <TableCell className="text-right font-bold">
                    <span className="inline-flex items-center gap-1">
                      {low && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                      {r.balance}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatCurrency(r.rate)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(r.value)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 card-shadow">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
    </div>
  );
}
