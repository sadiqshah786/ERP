import { listDocs, Doc } from "./store";
import type { Nature } from "./coa";
import { Movement, ItemCosting, costInventory, getCostMethod, CostMethod } from "./costing";

// ─────────────────────────────────────────────────────────────
// Posting / ledger engine. Derives account balances, inventory stock
// and costing (FIFO/LIFO/Weighted-Avg) from posted documents.
// COGS and closing inventory value follow the chosen costing method.
// ─────────────────────────────────────────────────────────────

export interface Bal { debit: number; credit: number }
export interface StockMove { in: number; out: number }

export interface LedgerData {
  balances: Map<string, Bal>;
  items: Doc[];
  costing: Map<string, ItemCosting>;
  method: CostMethod;
}

export function naturalBalance(b: Bal | undefined, nature: Nature): number {
  const d = b?.debit || 0, c = b?.credit || 0;
  return nature === "Asset" || nature === "Expense" ? d - c : c - d;
}

interface AllDocs {
  items: Doc[]; si: Doc[]; pi: Doc[]; pos: Doc[]; cr: Doc[]; cp: Doc[];
  sr: Doc[]; pr: Doc[]; add: Doc[]; red: Doc[]; ob: Doc[];
}

async function loadAll(): Promise<AllDocs> {
  const [items, si, pi, pos, cr, cp, sr, pr, add, red, ob] = await Promise.all([
    listDocs("items"), listDocs("sale_invoices"), listDocs("purchase_invoices"),
    listDocs("pos_sales"), listDocs("cash_receipts"), listDocs("cash_payments"),
    listDocs("sale_returns"), listDocs("purchase_returns"),
    listDocs("stock_additions"), listDocs("stock_reductions"), listDocs("opening_balances"),
  ]);
  return { items, si, pi, pos, cr, cp, sr, pr, add, red, ob };
}

const tsOf = (d: Doc) => (typeof d.createdAtMs === "number" ? d.createdAtMs : (d.date ? Date.parse(d.date) : 0)) || 0;

function buildMovements(d: AllDocs): Map<string, Movement[]> {
  const cost = new Map(d.items.map((i) => [i.name, Number(i.purchasePrice || 0)]));
  const map = new Map<string, Movement[]>();
  const push = (m: Movement) => { if (!m.item) return; const a = map.get(m.item) || []; a.push(m); map.set(m.item, a); };

  // opening stock (earliest)
  d.items.forEach((i) => {
    const q = Number(i.openingStock || 0);
    if (q) push({ item: i.name, dir: "in", qty: q, cost: Number(i.purchasePrice || 0), ts: -1, ref: "Opening", type: "Opening", date: "" });
  });
  d.pi.forEach((doc) => (doc.lines || []).forEach((l: any) => push({ item: l.item, dir: "in", qty: Number(l.qty) || 0, cost: Number(l.rate) || cost.get(l.item) || 0, ts: tsOf(doc), ref: doc.number, type: "Purchase Invoice", date: doc.date })));
  d.add.forEach((doc) => (doc.lines || []).forEach((l: any) => push({ item: l.item, dir: "in", qty: Number(l.qty) || 0, cost: Number(l.rate) || cost.get(l.item) || 0, ts: tsOf(doc), ref: doc.number, type: "Add Stock", date: doc.date })));
  d.sr.forEach((doc) => (doc.lines || []).forEach((l: any) => push({ item: l.item, dir: "in", qty: Number(l.qty) || 0, cost: cost.get(l.item) || 0, ts: tsOf(doc), ref: doc.number, type: "Sale Return", date: doc.date })));
  d.si.forEach((doc) => (doc.lines || []).forEach((l: any) => push({ item: l.item, dir: "out", qty: Number(l.qty) || 0, ts: tsOf(doc), ref: doc.number, type: "Sale Invoice", date: doc.date })));
  d.pos.forEach((doc) => (doc.lines || []).forEach((l: any) => push({ item: l.item, dir: "out", qty: Number(l.qty) || 0, ts: tsOf(doc), ref: doc.number, type: "POS Sale", date: doc.date })));
  d.red.forEach((doc) => (doc.lines || []).forEach((l: any) => push({ item: l.item, dir: "out", qty: Number(l.qty) || 0, ts: tsOf(doc), ref: doc.number, type: "Reduce Stock", date: doc.date })));
  d.pr.forEach((doc) => (doc.lines || []).forEach((l: any) => push({ item: l.item, dir: "out", qty: Number(l.qty) || 0, ts: tsOf(doc), ref: doc.number, type: "Purchase Return", date: doc.date })));
  return map;
}

const num = (d: Doc) => Number(d.total ?? d.amount ?? 0);

export async function computeLedger(): Promise<LedgerData> {
  const d = await loadAll();
  const method = getCostMethod();
  const costing = costInventory(buildMovements(d), method);

  const balances = new Map<string, Bal>();
  const dr = (a: string, v: number) => { if (!v) return; const e = balances.get(a) || { debit: 0, credit: 0 }; e.debit += v; balances.set(a, e); };
  const cc = (a: string, v: number) => { if (!v) return; const e = balances.get(a) || { debit: 0, credit: 0 }; e.credit += v; balances.set(a, e); };

  d.si.forEach((x) => { const t = num(x); if (x.party) dr(`Customer: ${x.party}`, t); cc("Sales Revenue", t); });
  d.pos.forEach((x) => { const t = num(x); dr("Cash in Hand", t); cc("Sales Revenue", t); });
  d.pi.forEach((x) => { const t = num(x); dr("Inventory Control", t); if (x.party) cc(`Vendor: ${x.party}`, t); });
  d.cr.forEach((x) => { const t = num(x); dr("Cash in Hand", t); if (x.party) cc(`Customer: ${x.party}`, t); });
  d.cp.forEach((x) => { const t = num(x); if (x.party) dr(`Vendor: ${x.party}`, t); cc("Cash in Hand", t); });
  d.sr.forEach((x) => { const t = num(x); if (x.party) cc(`Customer: ${x.party}`, t); dr("Sales Revenue", t); });
  d.pr.forEach((x) => { const t = num(x); if (x.party) dr(`Vendor: ${x.party}`, t); cc("Inventory Control", t); });

  // COGS from costing (method-based), one aggregate pair
  let totalCogs = 0;
  costing.forEach((c) => (totalCogs += c.cogs));
  dr("Cost of Goods Sold", totalCogs); cc("Inventory Control", totalCogs);

  d.ob.forEach((o) => { dr(o.account, Number(o.debit || 0)); cc(o.account, Number(o.credit || 0)); });

  return { balances, items: d.items, costing, method };
}

export interface JournalLine { date: string; ref: string; type: string; account: string; debit: number; credit: number }

export async function computeJournal(): Promise<JournalLine[]> {
  const d = await loadAll();
  const method = getCostMethod();
  const costing = costInventory(buildMovements(d), method);
  const cogsByRef = new Map<string, number>();
  costing.forEach((c) => c.outCogs.forEach((o) => cogsByRef.set(o.ref, (cogsByRef.get(o.ref) || 0) + o.cost)));

  const out: JournalLine[] = [];
  const push = (date: string, ref: string, type: string, account: string, debit: number, credit: number) => {
    if (!debit && !credit) return; out.push({ date: date || "", ref: ref || "", type, account, debit, credit });
  };

  d.si.forEach((x) => { const t = num(x), c = cogsByRef.get(x.number) || 0;
    push(x.date, x.number, "Sale Invoice", `Customer: ${x.party}`, t, 0);
    push(x.date, x.number, "Sale Invoice", "Sales Revenue", 0, t);
    push(x.date, x.number, "Sale Invoice", "Cost of Goods Sold", c, 0);
    push(x.date, x.number, "Sale Invoice", "Inventory Control", 0, c);
  });
  d.pos.forEach((x) => { const t = num(x), c = cogsByRef.get(x.number) || 0;
    push(x.date, x.number, "POS Sale", "Cash in Hand", t, 0);
    push(x.date, x.number, "POS Sale", "Sales Revenue", 0, t);
    push(x.date, x.number, "POS Sale", "Cost of Goods Sold", c, 0);
    push(x.date, x.number, "POS Sale", "Inventory Control", 0, c);
  });
  d.pi.forEach((x) => { const t = num(x);
    push(x.date, x.number, "Purchase Invoice", "Inventory Control", t, 0);
    push(x.date, x.number, "Purchase Invoice", `Vendor: ${x.party}`, 0, t);
  });
  d.cr.forEach((x) => { const t = num(x);
    push(x.date, x.number, "Cash Receipt", "Cash in Hand", t, 0);
    push(x.date, x.number, "Cash Receipt", `Customer: ${x.party}`, 0, t);
  });
  d.cp.forEach((x) => { const t = num(x);
    push(x.date, x.number, "Cash Payment", `Vendor: ${x.party}`, t, 0);
    push(x.date, x.number, "Cash Payment", "Cash in Hand", 0, t);
  });
  d.sr.forEach((x) => { const t = num(x);
    push(x.date, x.number, "Sale Return", "Sales Revenue", t, 0);
    push(x.date, x.number, "Sale Return", `Customer: ${x.party}`, 0, t);
  });
  d.pr.forEach((x) => { const t = num(x);
    push(x.date, x.number, "Purchase Return", `Vendor: ${x.party}`, t, 0);
    push(x.date, x.number, "Purchase Return", "Inventory Control", 0, t);
  });
  d.ob.forEach((o) => push("", "OB", "Opening Balance", o.account, Number(o.debit || 0), Number(o.credit || 0)));

  return out.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}

export interface ItemStockRow {
  code: string; name: string; unit: string; category: string;
  opening: number; in: number; out: number; balance: number;
  rate: number; value: number; reorder: number; cogs: number;
}

export function itemStockRows(data: LedgerData): ItemStockRow[] {
  return data.items.map((i) => {
    const c = data.costing.get(i.name);
    const opening = Number(i.openingStock || 0);
    const inQty = c ? Math.max(0, c.qtyIn - opening) : 0;
    const out = c ? c.qtyOut : 0;
    const balance = c ? c.closingQty : opening;
    const rate = c ? c.avgCost : Number(i.purchasePrice || 0);
    const value = c ? c.closingValue : balance * rate;
    return {
      code: i.code || "", name: i.name, unit: i.unit || "", category: i.category || "",
      opening, in: inQty, out, balance, rate, value, reorder: Number(i.reorderLevel || 0), cogs: c?.cogs || 0,
    };
  });
}
