import { useEffect, useMemo, useState } from "react";
import { Plus, Minus, Trash2, Search, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Doc, subscribe, createDoc } from "@/lib/store";
import { formatCurrency, nextDocNumber } from "@/lib/utils";

interface CartLine { id: string; name: string; price: number; qty: number }

export default function POS() {
  const { toast } = useToast();
  const [items, setItems] = useState<Doc[]>([]);
  const [sales, setSales] = useState<Doc[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => subscribe("items", setItems), []);
  useEffect(() => subscribe("pos_sales", setSales), []);

  const filtered = useMemo(
    () => items.filter((i) => (i.name || "").toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  const add = (i: Doc) =>
    setCart((c) => {
      const found = c.find((x) => x.id === i.id);
      if (found) return c.map((x) => (x.id === i.id ? { ...x, qty: x.qty + 1 } : x));
      return [...c, { id: i.id, name: i.name, price: Number(i.salePrice || 0), qty: 1 }];
    });

  const setQty = (id: string, d: number) =>
    setCart((c) => c.flatMap((x) => (x.id === id ? (x.qty + d <= 0 ? [] : [{ ...x, qty: x.qty + d }]) : [x])));

  const total = cart.reduce((s, l) => s + l.price * l.qty, 0);

  const checkout = async () => {
    if (!cart.length) return;
    const number = nextDocNumber("POS", sales.length);
    await createDoc("pos_sales", { number, date: new Date().toISOString().slice(0, 10), lines: cart, total, status: "Paid" });
    toast({ title: `Sale ${number} completed`, description: formatCurrency(total), type: "success" });
    setCart([]);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {filtered.length === 0 ? (
          <div className="grid h-64 place-items-center rounded-xl border bg-card text-sm text-muted-foreground">
            No products found. Add items in Maintain → Items/Products.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((i) => (
              <button key={i.id} onClick={() => add(i)} className="rounded-xl border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md card-shadow">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary"><ShoppingCart className="h-5 w-5" /></div>
                <div className="mt-2 line-clamp-1 font-medium">{i.name}</div>
                <div className="text-sm font-bold text-primary">{formatCurrency(Number(i.salePrice || 0))}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart */}
      <div className="flex flex-col rounded-xl border bg-card card-shadow">
        <div className="border-b px-5 py-3 font-bold">Current Sale</div>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Cart is empty.</p>
          ) : (
            cart.map((l) => (
              <div key={l.id} className="flex items-center gap-2 rounded-lg border p-2">
                <div className="flex-1">
                  <div className="line-clamp-1 text-sm font-medium">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{formatCurrency(l.price)}</div>
                </div>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setQty(l.id, -1)}><Minus className="h-3 w-3" /></Button>
                <span className="w-6 text-center text-sm font-semibold">{l.qty}</span>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setQty(l.id, 1)}><Plus className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCart((c) => c.filter((x) => x.id !== l.id))}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
            ))
          )}
        </div>
        <div className="border-t p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-2xl font-extrabold">{formatCurrency(total)}</span>
          </div>
          <Button className="w-full" size="lg" disabled={!cart.length} onClick={checkout}>Complete Sale</Button>
        </div>
      </div>
    </div>
  );
}
