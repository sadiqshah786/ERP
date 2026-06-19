// ─────────────────────────────────────────────────────────────
// Inventory costing engine: FIFO / LIFO / Weighted Average.
// Processes each item's movements in chronological order and
// computes COGS per outbound movement + closing stock value.
// ─────────────────────────────────────────────────────────────

export type CostMethod = "FIFO" | "LIFO" | "WA";

export const COST_METHOD_LABEL: Record<CostMethod, string> = {
  FIFO: "FIFO (First In, First Out)",
  LIFO: "LIFO (Last In, First Out)",
  WA: "Weighted Average",
};

const SETTINGS_KEY = "amal_erp::settings::inventory";

export function getCostMethod(): CostMethod {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return (s.method as CostMethod) || "FIFO";
  } catch {
    return "FIFO";
  }
}

export interface Movement {
  item: string;
  dir: "in" | "out";
  qty: number;
  cost?: number;   // unit cost for inbound
  ts: number;      // sort key (createdAtMs / parsed date)
  ref: string;
  type: string;
  date: string;
}

export interface OutCogs { ref: string; type: string; date: string; qty: number; cost: number }

export interface ItemCosting {
  item: string;
  qtyIn: number; qtyOut: number; closingQty: number;
  closingValue: number; cogs: number; avgCost: number;
  outCogs: OutCogs[];
}

export function costInventory(byItem: Map<string, Movement[]>, method: CostMethod): Map<string, ItemCosting> {
  const result = new Map<string, ItemCosting>();

  byItem.forEach((moves, item) => {
    const sorted = [...moves].sort((a, b) => a.ts - b.ts);
    let qtyIn = 0, qtyOut = 0, cogs = 0, lastCost = 0;
    const outCogs: OutCogs[] = [];

    if (method === "WA") {
      let qty = 0, value = 0;
      for (const m of sorted) {
        if (m.dir === "in") {
          const c = m.cost || 0; qty += m.qty; value += m.qty * c; qtyIn += m.qty; if (c) lastCost = c;
        } else {
          const avg = qty > 0 ? value / qty : lastCost;
          const c = m.qty * avg; cogs += c; qty -= m.qty; value -= c; qtyOut += m.qty;
          outCogs.push({ ref: m.ref, type: m.type, date: m.date, qty: m.qty, cost: c });
        }
      }
      const closingQty = qty;
      result.set(item, { item, qtyIn, qtyOut, closingQty, closingValue: Math.max(0, value), cogs, avgCost: closingQty > 0 ? value / closingQty : lastCost, outCogs });
    } else {
      // FIFO / LIFO via cost layers
      const layers: { qty: number; cost: number }[] = [];
      for (const m of sorted) {
        if (m.dir === "in") {
          layers.push({ qty: m.qty, cost: m.cost || 0 }); qtyIn += m.qty; if (m.cost) lastCost = m.cost;
        } else {
          let need = m.qty; let cost = 0; qtyOut += m.qty;
          while (need > 0 && layers.length) {
            const idx = method === "FIFO" ? 0 : layers.length - 1;
            const layer = layers[idx];
            const take = Math.min(layer.qty, need);
            cost += take * layer.cost; layer.qty -= take; need -= take;
            if (layer.qty <= 1e-9) layers.splice(idx, 1);
          }
          if (need > 0) cost += need * lastCost; // sold more than on hand
          cogs += cost;
          outCogs.push({ ref: m.ref, type: m.type, date: m.date, qty: m.qty, cost });
        }
      }
      const closingQty = layers.reduce((s, l) => s + l.qty, 0);
      const closingValue = layers.reduce((s, l) => s + l.qty * l.cost, 0);
      result.set(item, { item, qtyIn, qtyOut, closingQty, closingValue, cogs, avgCost: closingQty > 0 ? closingValue / closingQty : lastCost, outCogs });
    }
  });

  return result;
}
