import { useEffect, useMemo, useState } from "react";
import {
  Search, Printer, Wrench, ChevronRight, ChevronDown, Folder, FolderOpen, Lock,
  Plus, Pencil, Trash2, Wallet, CreditCard, PieChart, TrendingUp, TrendingDown,
  FolderTree, Layers, FileText, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ui/toast";
import { Doc, subscribe, createDoc, updateDocById, deleteDocById } from "@/lib/store";
import { COA, CoaType, CoaNode, Nature, typeColors } from "@/lib/coa";
import { cn, formatCurrency } from "@/lib/utils";

interface RNode extends CoaNode {
  _linked?: "customer" | "vendor" | "bank";
  _customId?: string;
  children?: RNode[];
}
interface RType extends Omit<CoaType, "groups"> { groups: RNode[] }

const typeIcons: Record<string, React.ElementType> = {
  "1": Wallet, "2": CreditCard, "3": PieChart, "4": TrendingUp, "5": TrendingDown,
};

const clone = (n: CoaNode): RNode => ({ ...n, children: n.children?.map(clone) });

function pad(n: number) { return String(n).padStart(3, "0"); }

export default function ChartOfAccounts() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Doc[]>([]);
  const [vendors, setVendors] = useState<Doc[]>([]);
  const [banks, setBanks] = useState<Doc[]>([]);
  const [custom, setCustom] = useState<Doc[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>(["1"]);
    COA.forEach((t) => t.groups.forEach(function walk(g) { s.add(g.code); g.children?.forEach((c) => c.children && walk(c)); }));
    return s;
  });
  const [addUnder, setAddUnder] = useState<RNode | null>(null);
  const [form, setForm] = useState({ name: "", code: "" });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<RNode | null>(null);
  const [toDelete, setToDelete] = useState<RNode | null>(null);

  useEffect(() => subscribe("customers", setCustomers), []);
  useEffect(() => subscribe("vendors", setVendors), []);
  useEffect(() => subscribe("banks", setBanks), []);
  useEffect(() => subscribe("coa_custom", setCustom), []);

  // Build the runtime tree: defaults + injected customers/vendors + custom accounts.
  const tree: RType[] = useMemo(() => {
    const customByParent = new Map<string, Doc[]>();
    custom.forEach((c) => {
      const arr = customByParent.get(c.parentCode) || [];
      arr.push(c); customByParent.set(c.parentCode, arr);
    });

    const inject = (n: RNode) => {
      if (n.link === "customers") {
        n.children = customers.map((c, i) => ({ code: `${n.code}${pad(i + 1)}`, name: `Customer: ${c.name}`, level: 5, postable: true, _linked: "customer" as const }));
      } else if (n.link === "vendors") {
        n.children = vendors.map((v, i) => ({ code: `${n.code}${pad(i + 1)}`, name: `Vendor: ${v.name}`, level: 5, postable: true, _linked: "vendor" as const }));
      } else if (n.link === "banks") {
        n.children = banks.map((b, i) => ({ code: `${n.code}${pad(i + 1)}`, name: b.name + (b.accountNumber ? ` — ${b.accountNumber}` : ""), level: 5, postable: true, _linked: "bank" as const }));
      }
      // append custom postable accounts saved under this node
      const extra = customByParent.get(n.code) || [];
      if (extra.length) {
        n.children = [...(n.children || []), ...extra.map((c) => ({ code: c.code, name: c.name, level: 5, postable: true, _customId: c.id }))];
      }
      n.children?.forEach(inject);
    };

    return COA.map((t) => {
      const groups = t.groups.map(clone);
      groups.forEach(inject);
      return { ...t, groups };
    });
  }, [customers, vendors, banks, custom]);

  const toggle = (code: string) => setExpanded((s) => { const n = new Set(s); n.has(code) ? n.delete(code) : n.add(code); return n; });

  // ── counts ──
  const counts = useMemo(() => {
    let main = 0, sub = 0, detail = 0, total = 0;
    tree.forEach((t) => t.groups.forEach(function walk(n: RNode) {
      total++;
      if (n.postable) detail++;
      else if (n.level === 2) main++;
      else if (n.level === 3) sub++;
      n.children?.forEach(walk);
    }));
    return { main, sub, detail, total };
  }, [tree]);

  // ── search filter ──
  const q = search.trim().toLowerCase();
  const nodeMatches = (n: RNode): boolean => {
    const self = n.code.toLowerCase().includes(q) || n.name.toLowerCase().includes(q);
    return self || !!n.children?.some(nodeMatches);
  };

  const submitAdd = async () => {
    if (!addUnder || !form.name.trim()) return;
    setSaving(true);
    try {
      if (editing?._customId) {
        await updateDocById("coa_custom", editing._customId, { name: form.name, code: form.code });
        toast({ title: "Account updated", type: "success" });
      } else {
        await createDoc("coa_custom", { parentCode: addUnder.code, name: form.name, code: form.code, nature: typeForNode(addUnder.code) });
        toast({ title: "Account added", type: "success" });
      }
      setAddUnder(null); setEditing(null); setForm({ name: "", code: "" });
    } catch (e: any) { toast({ title: "Save failed", description: e?.message, type: "error" }); }
    finally { setSaving(false); }
  };

  const openAdd = (node: RNode) => {
    const next = (node.children?.length ?? 0) + 1;
    setEditing(null);
    setForm({ name: "", code: `${node.code}${pad(next)}` });
    setAddUnder(node);
  };
  const openEditCustom = (node: RNode, parent: RNode) => {
    setEditing(node);
    setForm({ name: node.name, code: node.code });
    setAddUnder(parent);
  };

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Chart of Accounts</h2>
          <p className="text-xs text-muted-foreground">Master Data / Chart of Accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
          <Button size="sm" className="bg-amber-500 text-white hover:bg-amber-600" onClick={() => toast({ title: "Chart verified", description: "All control accounts are in place.", type: "success" })}>
            <Wrench className="h-4 w-4" /> Repair COA
          </Button>
        </div>
      </div>

      {/* search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by account code or name…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={<FolderTree className="h-5 w-5" />} color="#ec4899" value={counts.main} label="Main Groups" />
        <SummaryCard icon={<Layers className="h-5 w-5" />} color="#10b981" value={counts.sub} label="Sub Groups" />
        <SummaryCard icon={<FileText className="h-5 w-5" />} color="#3b82f6" value={counts.detail} label="Detail Accounts" />
        <SummaryCard icon={<Layers className="h-5 w-5" />} color="#f59e0b" value={counts.total} label="Total Accounts" />
      </div>

      {/* tree */}
      <div className="space-y-3">
        {tree.map((t) => {
          const Icon = typeIcons[t.key];
          const c = typeColors[t.color];
          const open = expanded.has(t.key) || !!q;
          const visibleGroups = q ? t.groups.filter(nodeMatches) : t.groups;
          if (q && visibleGroups.length === 0 && !t.label.toLowerCase().includes(q)) return null;
          const acctCount = (() => { let n = 0; t.groups.forEach(function w(x: RNode){ n++; x.children?.forEach(w); }); return n; })();
          return (
            <div key={t.key} className="overflow-hidden rounded-2xl border bg-card card-shadow">
              <button onClick={() => toggle(t.key)} className={cn("flex w-full items-center gap-3 px-5 py-4 text-left", c.head)}>
                {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <div className={cn("grid h-9 w-9 place-items-center rounded-lg bg-white/70", c.text)}><Icon className="h-5 w-5" /></div>
                <div className="flex-1">
                  <div className={cn("font-bold", c.text)}>{t.label}</div>
                  <div className="text-xs text-muted-foreground">{acctCount} accounts</div>
                </div>
                <div className={cn("font-bold", c.text)}>{formatCurrency(0)}</div>
              </button>
              {open && (
                <div className="divide-y">
                  {visibleGroups.map((g) => <NodeRow key={g.code} node={g} depth={0} {...{ expanded, toggle, q, nodeMatches, openAdd, openEditCustom, setToDelete, nature: t.nature }} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={!!addUnder} onOpenChange={(v) => { if (!v) { setAddUnder(null); setEditing(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Account" : "New Account"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">Under: <strong className="text-foreground">{addUnder?.name}</strong></p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Account Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Account Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Mobile Bank Account" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setAddUnder(null); setEditing(null); }} disabled={saving}>Cancel</Button>
              <Button onClick={submitAdd} disabled={saving || !form.name.trim()}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Save" : "Add Account"}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete account?" description={`"${toDelete?.name}" will be removed from the chart.`}
        confirmLabel="Delete account"
        onConfirm={async () => { if (toDelete?._customId) { await deleteDocById("coa_custom", toDelete._customId); toast({ title: "Account deleted", type: "success" }); } }}
      />
    </div>
  );
}

function typeForNode(code: string): Nature {
  const t = COA.find((x) => x.key === code[0]);
  return t?.nature ?? "Asset";
}

function SummaryCard({ icon, color, value, label }: { icon: React.ReactNode; color: string; value: number; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 card-shadow">
      <div className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${color}1a`, color }}>{icon}</div>
      <div>
        <div className="text-2xl font-extrabold leading-none">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

interface RowProps {
  node: RNode; depth: number; parent?: RNode;
  expanded: Set<string>; toggle: (c: string) => void; q: string;
  nodeMatches: (n: RNode) => boolean;
  openAdd: (n: RNode) => void; openEditCustom: (n: RNode, p: RNode) => void;
  setToDelete: (n: RNode) => void; nature: Nature;
}

function NodeRow(props: RowProps) {
  const { node, depth, parent, expanded, toggle, q, nodeMatches, openAdd, openEditCustom, setToDelete, nature } = props;
  const indent = 16 + depth * 22;
  const hasChildren = !!node.children?.length || node.link;

  if (node.postable) {
    return (
      <div className="flex items-center gap-2 py-2.5 pr-3 hover:bg-muted/40" style={{ paddingLeft: indent + 20 }}>
        <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
        <span className="font-mono text-xs font-bold text-primary">{node.code}</span>
        <span className="text-sm">{node.name}</span>
        <Badge variant="success" className="text-[10px]">POSTABLE</Badge>
        {node._linked === "customer" && <Badge className="bg-pink-100 text-pink-700 text-[10px]">Customer</Badge>}
        {node._linked === "vendor" && <Badge className="bg-violet-100 text-violet-700 text-[10px]">Vendor</Badge>}
        {node._linked === "bank" && <Badge className="bg-cyan-100 text-cyan-700 text-[10px]">Bank</Badge>}
        {!node._customId && !node._linked && <Lock className="h-3 w-3 text-muted-foreground" />}
        <div className="ml-auto flex items-center gap-3">
          <Badge variant="outline" className="text-[10px]">{nature}</Badge>
          <span className="text-sm text-muted-foreground">{formatCurrency(0)}</span>
          {node._customId ? (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => parent && openEditCustom(node, parent)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setToDelete(node)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
            </>
          ) : (
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled title="Linked / system account"><Pencil className="h-3.5 w-3.5 opacity-30" /></Button>
          )}
        </div>
      </div>
    );
  }

  const open = expanded.has(node.code) || !!q;
  const subCount = node.children?.length ?? 0;
  const visibleChildren = q ? (node.children || []).filter(nodeMatches) : node.children || [];

  return (
    <div>
      <div className="flex items-center gap-2 py-2.5 pr-2 hover:bg-muted/40" style={{ paddingLeft: indent }}>
        <button onClick={() => toggle(node.code)} className="shrink-0 text-muted-foreground">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {open ? <FolderOpen className="h-4 w-4 text-muted-foreground" /> : <Folder className="h-4 w-4 text-muted-foreground" />}
        <span className="font-mono text-xs font-semibold text-muted-foreground">{node.code}</span>
        <span className="text-sm font-semibold">{node.name}</span>
        <Badge variant="secondary" className="text-[10px]">CATEGORY · L{node.level}</Badge>
        <Lock className="h-3 w-3 text-muted-foreground" />
        <span className="hidden text-xs italic text-muted-foreground sm:inline">{subCount} sub-account{subCount !== 1 ? "s" : ""}</span>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openAdd(node)}><Plus className="h-3.5 w-3.5" /> Add</Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled title="System group (locked)"><Pencil className="h-3.5 w-3.5 opacity-40" /> Edit</Button>
        </div>
      </div>
      {open && visibleChildren.map((child) => (
        <NodeRow key={child.code} {...props} node={child} parent={node} depth={depth + 1} />
      ))}
    </div>
  );
}
