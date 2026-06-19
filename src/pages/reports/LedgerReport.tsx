import { useEffect, useMemo, useState } from "react";
import { Download, Printer, BookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { computeJournal, JournalLine } from "@/lib/ledger";
import { listDocs } from "@/lib/store";
import { flattenAccounts, FlatAccount, Nature } from "@/lib/coa";
import { exportToCsv } from "@/lib/export";
import { printTable } from "@/lib/print";
import { formatCurrency, formatDate } from "@/lib/utils";

const delta = (nature: Nature, debit: number, credit: number) =>
  nature === "Asset" || nature === "Expense" ? debit - credit : credit - debit;

export default function LedgerReport() {
  const [lines, setLines] = useState<JournalLine[]>([]);
  const [accounts, setAccounts] = useState<FlatAccount[]>([]);
  const [account, setAccount] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [j, customers, vendors, banks] = await Promise.all([
        computeJournal(), listDocs("customers"), listDocs("vendors"), listDocs("banks"),
      ]);
      setLines(j);
      // accounts that actually appear in postings + all flattened COA accounts
      const flat = flattenAccounts(customers, vendors, banks);
      const known = new Map(flat.map((a) => [a.name, a]));
      // include any posting account not in the chart (e.g. system accounts)
      j.forEach((l) => { if (!known.has(l.account)) known.set(l.account, { code: "", name: l.account, nature: guessNature(l.account) }); });
      setAccounts(Array.from(known.values()));
    })().catch(() => {}).finally(() => setLoading(false));
  }, []);

  const selected = accounts.find((a) => a.name === account);
  const nature = selected?.nature ?? "Asset";

  const { rows, opening } = useMemo(() => {
    if (!account) return { rows: [] as (JournalLine & { balance: number; narration: string })[], opening: 0 };
    const all = lines.filter((l) => l.account === account);
    let op = 0;
    if (from) all.forEach((l) => { if (l.date && l.date < from) op += delta(nature, l.debit, l.credit); });
    const period = all.filter((l) => (!from || !l.date || l.date >= from) && (!to || !l.date || l.date <= to));
    let bal = op;
    const r = period.map((l) => {
      bal += delta(nature, l.debit, l.credit);
      return { ...l, balance: bal, narration: `${l.type}${l.ref ? " · " + l.ref : ""}` };
    });
    return { rows: r, opening: op };
  }, [lines, account, from, to, nature]);

  const totalDr = rows.reduce((s, r) => s + r.debit, 0);
  const totalCr = rows.reduce((s, r) => s + r.credit, 0);
  const closing = rows.length ? rows[rows.length - 1].balance : opening;
  const fmtBal = (n: number) => `${formatCurrency(Math.abs(n))} ${n >= 0 ? "Dr" : "Cr"}`;

  const exportCsv = () => exportToCsv(`ledger-${account || "report"}`, [
    { Date: "", Narration: "Opening Balance", Debit: "", Credit: "", Balance: fmtBal(opening) },
    ...rows.map((r) => ({ Date: r.date, Narration: r.narration, Debit: r.debit || "", Credit: r.credit || "", Balance: fmtBal(r.balance) })),
  ]);
  const print = () => printTable(`Ledger — ${account}`,
    [{ key: "date", label: "Date" }, { key: "narration", label: "Narration" }, { key: "debit", label: "Debit" }, { key: "credit", label: "Credit" }, { key: "balance", label: "Balance" }],
    [
      { date: "", narration: "Opening Balance", debit: "", credit: "", balance: fmtBal(opening) },
      ...rows.map((r) => ({ date: r.date ? formatDate(r.date) : "", narration: r.narration, debit: r.debit ? formatCurrency(r.debit) : "", credit: r.credit ? formatCurrency(r.credit) : "", balance: fmtBal(r.balance) })),
    ] as any);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Ledger Report</h2>
          <p className="text-sm text-muted-foreground">Account ledger with running balance — filter any Chart-of-Accounts account.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={print} disabled={!rows.length}><Printer className="h-4 w-4" /> Print</Button>
          <Button size="sm" onClick={exportCsv} disabled={!rows.length}><Download className="h-4 w-4" /> Export</Button>
        </div>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4 card-shadow">
        <div className="min-w-[16rem] flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Account</label>
          <select value={account} onChange={(e) => setAccount(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
            <option value="">— Select account —</option>
            {accounts.map((a) => <option key={a.name} value={a.name}>{a.code ? `${a.code} · ` : ""}{a.name}</option>)}
          </select>
        </div>
        <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">From</label><Input type="date" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">To</label><Input type="date" className="w-40" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </div>

      {account && (
        <div className="flex flex-wrap items-center gap-6 rounded-2xl border bg-card p-4 card-shadow">
          <div><div className="text-xs text-muted-foreground">Account</div><div className="font-bold">{account} <Badge variant="outline" className="ml-1 text-[10px]">{nature}</Badge></div></div>
          <div><div className="text-xs text-muted-foreground">Total Debit</div><div className="font-bold">{formatCurrency(totalDr)}</div></div>
          <div><div className="text-xs text-muted-foreground">Total Credit</div><div className="font-bold">{formatCurrency(totalCr)}</div></div>
          <div className="ml-auto text-right"><div className="text-xs text-muted-foreground">Closing Balance</div><div className="text-lg font-extrabold text-primary">{formatCurrency(Math.abs(closing))} {closing >= 0 ? "Dr" : "Cr"}</div></div>
        </div>
      )}

      <div className="rounded-2xl border bg-card card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead><TableHead>Narration</TableHead>
              <TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead><TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : !account ? (
              <TableRow><TableCell colSpan={5}>
                <div className="grid place-items-center gap-2 py-14 text-muted-foreground">
                  <BookText className="h-9 w-9" /><p className="text-sm">Select an account above to view its ledger.</p>
                </div>
              </TableCell></TableRow>
            ) : (
              <>
                <TableRow className="bg-muted/40">
                  <TableCell className="text-sm">{from ? formatDate(from) : "—"}</TableCell>
                  <TableCell className="font-semibold italic">Opening Balance</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right font-semibold">{fmtBal(opening)}</TableCell>
                </TableRow>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap text-sm">{r.date ? formatDate(r.date) : "—"}</TableCell>
                    <TableCell><span className="font-medium">{r.type}</span>{r.ref && <span className="ml-1 font-mono text-xs text-muted-foreground">· {r.ref}</span>}</TableCell>
                    <TableCell className="text-right">{r.debit ? formatCurrency(r.debit) : "—"}</TableCell>
                    <TableCell className="text-right">{r.credit ? formatCurrency(r.credit) : "—"}</TableCell>
                    <TableCell className="text-right font-semibold">{fmtBal(r.balance)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 font-extrabold">
                  <TableCell colSpan={2}>Closing Balance</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalDr)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalCr)}</TableCell>
                  <TableCell className="text-right text-primary">{fmtBal(closing)}</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function guessNature(name: string): Nature {
  if (/sales revenue|other income|revenue/i.test(name)) return "Revenue";
  if (/cost of goods|expense|cogs/i.test(name)) return "Expense";
  if (/vendor:|payable/i.test(name)) return "Liability";
  return "Asset";
}
