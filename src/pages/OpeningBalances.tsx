import { useCallback, useEffect, useMemo, useState } from "react";
import { DollarSign, Boxes, CheckCircle2, AlertTriangle, Save, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Doc, listDocs, createDoc, updateDocById, deleteDocById } from "@/lib/store";
import { flattenAccounts, FlatAccount } from "@/lib/coa";
import { cn, formatCurrency } from "@/lib/utils";

const natureBadge: Record<string, string> = {
  Asset: "bg-green-100 text-green-700", Liability: "bg-amber-100 text-amber-700",
  Equity: "bg-blue-100 text-blue-700", Revenue: "bg-emerald-100 text-emerald-700", Expense: "bg-rose-100 text-rose-700",
};

export default function OpeningBalances() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"accounts" | "inventory">("accounts");
  const [years, setYears] = useState<Doc[]>([]);
  const [fy, setFy] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // accounts
  const [accounts, setAccounts] = useState<FlatAccount[]>([]);
  const [acctVals, setAcctVals] = useState<Record<string, { debit: number; credit: number }>>({});
  // inventory
  const [items, setItems] = useState<Doc[]>([]);
  const [invVals, setInvVals] = useState<Record<string, { qty: number; cost: number }>>({});

  const load = useCallback(async () => {
    const [fys, customers, vendors, banks, ob, its] = await Promise.all([
      listDocs("financial_years"), listDocs("customers"), listDocs("vendors"),
      listDocs("banks"), listDocs("opening_balances"), listDocs("items"),
    ]);
    setYears(fys);
    setFy((cur) => cur || fys.find((y) => y.status === "Active")?.name || fys[0]?.name || "");
    const flat = flattenAccounts(customers, vendors, banks);
    setAccounts(flat);
    const av: Record<string, { debit: number; credit: number }> = {};
    flat.forEach((a) => {
      const found = ob.find((o) => o.code === a.code || o.account === a.name);
      av[a.code] = { debit: Number(found?.debit || 0), credit: Number(found?.credit || 0) };
    });
    setAcctVals(av);
    setItems(its);
    const iv: Record<string, { qty: number; cost: number }> = {};
    its.forEach((i) => (iv[i.id] = { qty: Number(i.openingStock || 0), cost: Number(i.purchasePrice || 0) }));
    setInvVals(iv);
  }, []);
  useEffect(() => { load().catch(() => {}); }, [load]);

  const totals = useMemo(() => {
    let d = 0, c = 0;
    Object.values(acctVals).forEach((v) => { d += v.debit || 0; c += v.credit || 0; });
    return { d, c, diff: d - c };
  }, [acctVals]);

  const filteredAccounts = useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.toLowerCase();
    return accounts.filter((a) => a.name.toLowerCase().includes(q) || a.code.includes(q));
  }, [accounts, search]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) => (i.name || "").toLowerCase().includes(q) || (i.code || "").toLowerCase().includes(q));
  }, [items, search]);

  const invTotal = useMemo(() => items.reduce((s, i) => { const v = invVals[i.id]; return s + (v ? v.qty * v.cost : 0); }, 0), [items, invVals]);

  const saveAccounts = async () => {
    setSaving(true);
    try {
      const existing = await listDocs("opening_balances");
      await Promise.all(existing.map((e) => deleteDocById("opening_balances", e.id)));
      const rows = accounts
        .map((a) => ({ a, v: acctVals[a.code] }))
        .filter(({ v }) => v && (v.debit || v.credit));
      await Promise.all(rows.map(({ a, v }) => createDoc("opening_balances", { code: a.code, account: a.name, nature: a.nature, debit: v.debit || 0, credit: v.credit || 0, fy })));
      toast({ title: "Opening balances saved", description: "Reflected in Trial Balance & Chart of Accounts.", type: "success" });
    } catch (e: any) { toast({ title: "Save failed", description: e?.message, type: "error" }); }
    finally { setSaving(false); }
  };

  const saveInventory = async () => {
    setSaving(true);
    try {
      await Promise.all(items.map((i) => {
        const v = invVals[i.id];
        if (!v) return Promise.resolve();
        return updateDocById("items", i.id, { openingStock: v.qty, purchasePrice: v.cost });
      }));
      toast({ title: "Opening inventory saved", type: "success" });
    } catch (e: any) { toast({ title: "Save failed", description: e?.message, type: "error" }); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Opening Balances</h2>
        <p className="text-xs text-muted-foreground">Master Data / Opening Balances</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 card-shadow">
        <span className="text-sm font-semibold">📅 Financial Year:</span>
        <select value={fy} onChange={(e) => setFy(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
          {years.length === 0 && <option>—</option>}
          {years.map((y) => <option key={y.id} value={y.name}>{y.name}{y.status === "Active" ? " (Active)" : ""}</option>)}
        </select>
        <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">OB Transaction: OB-2025-00001</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border bg-card p-1 card-shadow">
          <TabBtn active={tab === "accounts"} onClick={() => setTab("accounts")} icon={<DollarSign className="h-4 w-4" />}>Accounts</TabBtn>
          <TabBtn active={tab === "inventory"} onClick={() => setTab("inventory")} icon={<Boxes className="h-4 w-4" />}>Inventory</TabBtn>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="w-full pl-8" placeholder={`Search ${tab}…`} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {tab === "accounts" ? (
        <>
          <div className="flex flex-wrap items-center gap-6 rounded-2xl border bg-card p-4 card-shadow">
            <Metric label="Total Accounts" value={String(accounts.length)} />
            <Metric label="Total Debits" value={formatCurrency(totals.d).replace("Rs.", "PKR ")} />
            <Metric label="Total Credits" value={formatCurrency(totals.c).replace("Rs.", "PKR ")} />
            <div>
              <div className="text-xs text-muted-foreground">Difference</div>
              <div className={cn("flex items-center gap-1 font-bold", Math.abs(totals.diff) < 0.01 ? "text-success" : "text-destructive")}>
                {Math.abs(totals.diff) < 0.01 ? <><CheckCircle2 className="h-4 w-4" /> Balanced</> : <><AlertTriangle className="h-4 w-4" /> {formatCurrency(Math.abs(totals.diff))}</>}
              </div>
            </div>
            <Button className="ml-auto" onClick={saveAccounts} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Accounts</Button>
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300">
            All Chart of Accounts including Customers, Vendors, and Banks are shown below. Enter opening balances as Debit or Credit based on the account's normal balance.
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card card-shadow">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="p-3 text-left">Code</th><th className="p-3 text-left">Account Name</th><th className="p-3 text-left">Type</th><th className="p-3 text-right w-40">Debit (DR)</th><th className="p-3 text-right w-40">Credit (CR)</th></tr>
              </thead>
              <tbody>
                {filteredAccounts.map((a) => (
                  <tr key={a.code} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs text-primary">{a.code}</td>
                    <td className="p-3 font-medium">{a.name}</td>
                    <td className="p-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        a.kind === "customer" ? "bg-pink-100 text-pink-700" : a.kind === "vendor" ? "bg-violet-100 text-violet-700" : natureBadge[a.nature])}>
                        {a.kind === "customer" ? "Customer" : a.kind === "vendor" ? "Vendor" : a.nature}
                      </span>
                    </td>
                    <td className="p-2"><Input type="number" className="h-9 text-right" value={acctVals[a.code]?.debit || 0} onChange={(e) => setAcctVals((s) => ({ ...s, [a.code]: { debit: Number(e.target.value), credit: 0 } }))} /></td>
                    <td className="p-2"><Input type="number" className="h-9 text-right" value={acctVals[a.code]?.credit || 0} onChange={(e) => setAcctVals((s) => ({ ...s, [a.code]: { debit: 0, credit: Number(e.target.value) } }))} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-6 rounded-2xl border bg-card p-4 card-shadow">
            <Metric label="Total Items" value={String(items.length)} />
            <Metric label="Total Inventory Value" value={formatCurrency(invTotal).replace("Rs.", "PKR ")} />
            <Button className="ml-auto" onClick={saveInventory} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Inventory</Button>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300">
            All inventory items from Chart of Inventory are shown below. Enter opening quantity and unit cost to set the starting inventory value.
          </div>
          <div className="overflow-hidden rounded-2xl border bg-card card-shadow">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="p-3 text-left">Item Code</th><th className="p-3 text-left">Item Name</th><th className="p-3 text-left">Unit</th><th className="p-3 text-right w-36">Opening Qty</th><th className="p-3 text-right w-36">Unit Cost</th><th className="p-3 text-right">Total Value</th></tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">No items. Add items in Maintain → Items/Products.</td></tr>
                ) : filteredItems.map((i) => {
                  const v = invVals[i.id] || { qty: 0, cost: 0 };
                  return (
                    <tr key={i.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-mono text-xs text-primary">{i.code || "—"}</td>
                      <td className="p-3 font-medium">{i.name}</td>
                      <td className="p-3 text-muted-foreground">{i.unit || "—"}</td>
                      <td className="p-2"><Input type="number" className="h-9 text-right" value={v.qty} onChange={(e) => setInvVals((s) => ({ ...s, [i.id]: { ...v, qty: Number(e.target.value) } }))} /></td>
                      <td className="p-2"><Input type="number" className="h-9 text-right" value={v.cost} onChange={(e) => setInvVals((s) => ({ ...s, [i.id]: { ...v, cost: Number(e.target.value) } }))} /></td>
                      <td className="p-3 text-right font-semibold">{formatCurrency(v.qty * v.cost)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors", active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{icon}{children}</button>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (<div><div className="text-xs text-muted-foreground">{label}</div><div className="text-xl font-extrabold">{value}</div></div>);
}
