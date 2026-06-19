import { listDocs, Doc } from "./store";
import type { Nature } from "./coa";

// ─────────────────────────────────────────────────────────────
// Posting / ledger engine.
// Derives account balances and inventory stock movements directly
// from the posted documents (single source of truth — no double
// writes). Simplified accrual model, no tax split.
//
// Posting rules:
//  Sale Invoice   Dr Customer            Cr Sales Revenue
//                 Dr COGS                Cr Inventory Control   + stock OUT
//  POS Sale       Dr Cash in Hand        Cr Sales Revenue
//                 Dr COGS                Cr Inventory Control   + stock OUT
//  Purchase Inv.  Dr Inventory Control   Cr Vendor             + stock IN
//  Cash Receipt   Dr Cash in Hand        Cr Customer
//  Cash Payment   Dr Vendor              Cr Cash in Hand
//  Sale Return    Dr Sales Revenue       Cr Customer           + stock IN
//  Purchase Ret.  Dr Vendor              Cr Inventory Control  + stock OUT
//  Add/Reduce Stock                                            stock IN / OUT
// ─────────────────────────────────────────────────────────────

export interface Bal { debit: number; credit: number }
export interface StockMove { in: number; out: number }

export interface LedgerData {
  balances: Map<string, Bal>;
  stock: Map<string, StockMove>;
  items: Doc[];
}

export function naturalBalance(b: Bal | undefined, nature: Nature): number {
  const d = b?.debit || 0;
  const c = b?.credit || 0;
  return nature === "Asset" || nature === "Expense" ? d - c : c - d;
}

export async function computeLedger(): Promise<LedgerData> {
  const [items, si, pi, pos, cr, cp, sr, pr, add, red, ob] = await Promise.all([
    listDocs("items"), listDocs("sale_invoices"), listDocs("purchase_invoices"),
    listDocs("pos_sales"), listDocs("cash_receipts"), listDocs("cash_payments"),
    listDocs("sale_returns"), listDocs("purchase_returns"),
    listDocs("stock_additions"), listDocs("stock_reductions"),
    listDocs("opening_balances"),
  ]);

  const cost = new Map(items.map((i) => [i.name, Number(i.purchasePrice || 0)]));
  const balances = new Map<string, Bal>();
  const stock = new Map<string, StockMove>();

  const dr = (a: string, v: number) => { const e = balances.get(a) || { debit: 0, credit: 0 }; e.debit += v; balances.set(a, e); };
  const ccr = (a: string, v: number) => { const e = balances.get(a) || { debit: 0, credit: 0 }; e.credit += v; balances.set(a, e); };
  const stIn = (item: string, q: number) => { if (!item) return; const e = stock.get(item) || { in: 0, out: 0 }; e.in += q; stock.set(item, e); };
  const stOut = (item: string, q: number) => { if (!item) return; const e = stock.get(item) || { in: 0, out: 0 }; e.out += q; stock.set(item, e); };
  const lineCost = (lines: any[] = []) => lines.reduce((s, l) => s + (Number(l.qty) || 0) * (cost.get(l.item) || 0), 0);
  const num = (d: Doc) => Number(d.total ?? d.amount ?? 0);

  si.forEach((d) => {
    const t = num(d); const c = lineCost(d.lines);
    if (d.party) dr(`Customer: ${d.party}`, t);
    ccr("Sales Revenue", t);
    dr("Cost of Goods Sold", c); ccr("Inventory Control", c);
    (d.lines || []).forEach((l: any) => stOut(l.item, Number(l.qty) || 0));
  });
  pos.forEach((d) => {
    const t = num(d); const c = lineCost(d.lines);
    dr("Cash in Hand", t); ccr("Sales Revenue", t);
    dr("Cost of Goods Sold", c); ccr("Inventory Control", c);
    (d.lines || []).forEach((l: any) => stOut(l.item, Number(l.qty) || 0));
  });
  pi.forEach((d) => {
    const t = num(d);
    dr("Inventory Control", t);
    if (d.party) ccr(`Vendor: ${d.party}`, t);
    (d.lines || []).forEach((l: any) => stIn(l.item, Number(l.qty) || 0));
  });
  cr.forEach((d) => { const t = num(d); dr("Cash in Hand", t); if (d.party) ccr(`Customer: ${d.party}`, t); });
  cp.forEach((d) => { const t = num(d); if (d.party) dr(`Vendor: ${d.party}`, t); ccr("Cash in Hand", t); });
  sr.forEach((d) => {
    const t = num(d);
    if (d.party) ccr(`Customer: ${d.party}`, t); dr("Sales Revenue", t);
    (d.lines || []).forEach((l: any) => stIn(l.item, Number(l.qty) || 0));
  });
  pr.forEach((d) => {
    const t = num(d);
    if (d.party) dr(`Vendor: ${d.party}`, t); ccr("Inventory Control", t);
    (d.lines || []).forEach((l: any) => stOut(l.item, Number(l.qty) || 0));
  });
  add.forEach((d) => (d.lines || []).forEach((l: any) => stIn(l.item, Number(l.qty) || 0)));
  red.forEach((d) => (d.lines || []).forEach((l: any) => stOut(l.item, Number(l.qty) || 0)));

  // opening balances (entered in Maintain → Opening Balances)
  ob.forEach((o) => {
    if (Number(o.debit)) dr(o.account, Number(o.debit));
    if (Number(o.credit)) ccr(o.account, Number(o.credit));
  });

  return { balances, stock, items };
}

export interface JournalLine {
  date: string; ref: string; type: string; account: string; debit: number; credit: number;
}

// Flat list of every posting line (the journal / day book).
export async function computeJournal(): Promise<JournalLine[]> {
  const [items, si, pi, pos, cr, cp, sr, pr, ob] = await Promise.all([
    listDocs("items"), listDocs("sale_invoices"), listDocs("purchase_invoices"),
    listDocs("pos_sales"), listDocs("cash_receipts"), listDocs("cash_payments"),
    listDocs("sale_returns"), listDocs("purchase_returns"), listDocs("opening_balances"),
  ]);
  const cost = new Map(items.map((i) => [i.name, Number(i.purchasePrice || 0)]));
  const lineCost = (lines: any[] = []) => lines.reduce((s, l) => s + (Number(l.qty) || 0) * (cost.get(l.item) || 0), 0);
  const num = (d: Doc) => Number(d.total ?? d.amount ?? 0);
  const out: JournalLine[] = [];
  const push = (date: string, ref: string, type: string, account: string, debit: number, credit: number) => {
    if (!debit && !credit) return;
    out.push({ date: date || "", ref: ref || "", type, account, debit, credit });
  };

  si.forEach((d) => { const t = num(d), c = lineCost(d.lines);
    push(d.date, d.number, "Sale Invoice", `Customer: ${d.party}`, t, 0);
    push(d.date, d.number, "Sale Invoice", "Sales Revenue", 0, t);
    push(d.date, d.number, "Sale Invoice", "Cost of Goods Sold", c, 0);
    push(d.date, d.number, "Sale Invoice", "Inventory Control", 0, c);
  });
  pos.forEach((d) => { const t = num(d), c = lineCost(d.lines);
    push(d.date, d.number, "POS Sale", "Cash in Hand", t, 0);
    push(d.date, d.number, "POS Sale", "Sales Revenue", 0, t);
    push(d.date, d.number, "POS Sale", "Cost of Goods Sold", c, 0);
    push(d.date, d.number, "POS Sale", "Inventory Control", 0, c);
  });
  pi.forEach((d) => { const t = num(d);
    push(d.date, d.number, "Purchase Invoice", "Inventory Control", t, 0);
    push(d.date, d.number, "Purchase Invoice", `Vendor: ${d.party}`, 0, t);
  });
  cr.forEach((d) => { const t = num(d);
    push(d.date, d.number, "Cash Receipt", "Cash in Hand", t, 0);
    push(d.date, d.number, "Cash Receipt", `Customer: ${d.party}`, 0, t);
  });
  cp.forEach((d) => { const t = num(d);
    push(d.date, d.number, "Cash Payment", `Vendor: ${d.party}`, t, 0);
    push(d.date, d.number, "Cash Payment", "Cash in Hand", 0, t);
  });
  sr.forEach((d) => { const t = num(d);
    push(d.date, d.number, "Sale Return", "Sales Revenue", t, 0);
    push(d.date, d.number, "Sale Return", `Customer: ${d.party}`, 0, t);
  });
  pr.forEach((d) => { const t = num(d);
    push(d.date, d.number, "Purchase Return", `Vendor: ${d.party}`, t, 0);
    push(d.date, d.number, "Purchase Return", "Inventory Control", 0, t);
  });
  ob.forEach((o) => push((o as any).fy ? "" : "", "OB", "Opening Balance", o.account, Number(o.debit || 0), Number(o.credit || 0)));

  return out.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}

export interface ItemStockRow {
  code: string; name: string; unit: string; category: string;
  opening: number; in: number; out: number; balance: number;
  rate: number; value: number; reorder: number;
}

export function itemStockRows(data: LedgerData): ItemStockRow[] {
  return data.items.map((i) => {
    const m = data.stock.get(i.name) || { in: 0, out: 0 };
    const opening = Number(i.openingStock || 0);
    const balance = opening + m.in - m.out;
    const rate = Number(i.purchasePrice || 0);
    return {
      code: i.code || "", name: i.name, unit: i.unit || "", category: i.category || "",
      opening, in: m.in, out: m.out, balance, rate, value: balance * rate,
      reorder: Number(i.reorderLevel || 0),
    };
  });
}
