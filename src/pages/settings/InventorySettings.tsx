import { useEffect, useState } from "react";
import { Save, Layers, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CostMethod, COST_METHOD_LABEL } from "@/lib/costing";
import { cn } from "@/lib/utils";

const KEY = "amal_erp::settings::inventory";

const OPTIONS: { method: CostMethod; desc: string }[] = [
  { method: "FIFO", desc: "Oldest stock is sold first. COGS uses the earliest purchase costs — closing stock is valued at the most recent costs." },
  { method: "LIFO", desc: "Newest stock is sold first. COGS uses the latest purchase costs — closing stock is valued at the oldest costs." },
  { method: "WA", desc: "Weighted average cost across all stock on hand. Each sale and the closing stock are valued at the running average cost." },
];

export default function InventorySettings() {
  const { toast } = useToast();
  const [method, setMethod] = useState<CostMethod>("FIFO");

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(KEY) || "{}"); if (s.method) setMethod(s.method); } catch { /* ignore */ }
  }, []);

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify({ method }));
    toast({ title: "Inventory settings saved", description: `Valuation method: ${COST_METHOD_LABEL[method]}. All stock value & COGS now use this.`, type: "success" });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Inventory Movement</h2>
        <p className="text-sm text-muted-foreground">Choose how inventory is valued. This drives COGS and closing stock value across all reports.</p>
      </div>

      <div className="rounded-2xl border bg-card card-shadow">
        <div className="flex items-center gap-3 border-b px-6 py-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Layers className="h-5 w-5" /></div>
          <h3 className="text-lg font-bold">Costing / Valuation Method</h3>
        </div>
        <div className="space-y-3 p-6">
          {OPTIONS.map((o) => (
            <button key={o.method} onClick={() => setMethod(o.method)}
              className={cn("flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors",
                method === o.method ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40")}>
              <div className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2", method === o.method ? "border-primary bg-primary text-white" : "border-muted-foreground/40")}>
                {method === o.method && <Check className="h-3 w-3" />}
              </div>
              <div>
                <div className="font-bold">{COST_METHOD_LABEL[o.method]}</div>
                <div className="text-sm text-muted-foreground">{o.desc}</div>
              </div>
            </button>
          ))}
          <div className="flex justify-end pt-2">
            <Button onClick={save}><Save className="h-4 w-4" /> Save Method</Button>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Changing the method recalculates COGS and stock value retroactively from your transaction history — Inventory Balances, Trial Balance and the Chart of Accounts all reflect the selected method instantly.
      </p>
    </div>
  );
}
