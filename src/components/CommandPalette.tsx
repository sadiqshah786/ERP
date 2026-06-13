import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CornerDownLeft } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { navigation, allRoutes } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface Item { label: string; path: string; group: string }

function buildIndex(): Item[] {
  const out: Item[] = [];
  for (const g of navigation) {
    if (g.path) out.push({ label: g.label, path: g.path, group: "Pages" });
    g.children?.forEach((c) => out.push({ label: c.label, path: c.path, group: g.label }));
    g.groups?.forEach((sg) => sg.children.forEach((c) => out.push({ label: c.label, path: c.path, group: sg.label })));
  }
  return out.length ? out : allRoutes().map((r) => ({ ...r, group: "Pages" }));
}

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const index = useMemo(buildIndex, []);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!q.trim()) return index.slice(0, 8);
    const s = q.toLowerCase();
    return index.filter((i) => i.label.toLowerCase().includes(s) || i.group.toLowerCase().includes(s)).slice(0, 12);
  }, [q, index]);

  useEffect(() => { setActive(0); }, [q]);
  useEffect(() => { if (open) { setQ(""); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);

  const go = (path: string) => { navigate(path); onOpenChange(false); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); results[active] && go(results[active].path); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0">
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search pages, modules, reports…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No results for “{q}”.</div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.path}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.path)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm",
                  i === active ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                )}
              >
                <span className="font-medium">{r.label}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{r.group}</span>
                  {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />}
                </span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
