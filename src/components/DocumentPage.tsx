import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, FileText, Search, X, Printer, Pencil, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ui/toast";
import { DocConfig } from "@/lib/docConfigs";
import { Doc, listDocs, createDoc, updateDocById, deleteDocById } from "@/lib/store";
import { formatCurrency, formatDate, nextDocNumber } from "@/lib/utils";
import { printDocument } from "@/lib/print";
import { exportToCsv } from "@/lib/export";

interface Line { item: string; qty: number; rate: number }

const today = () => new Date().toISOString().slice(0, 10);

export function DocumentPage({ config }: { config: DocConfig }) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Doc[]>([]);
  const [parties, setParties] = useState<Doc[]>([]);
  const [items, setItems] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Doc | null>(null);

  const [party, setParty] = useState("");
  const [date, setDate] = useState(today());
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState(0);
  const [lines, setLines] = useState<Line[]>([{ item: "", qty: 1, rate: 0 }]);

  // Load the document listing from the API; re-called after every mutation.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listDocs(config.collection));
    } catch (err: any) {
      toast({ title: "Could not load documents", description: err?.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, [config.collection]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const coll = config.party === "customer" ? "customers" : config.party === "vendor" ? "vendors" : null;
    if (coll) listDocs(coll).then(setParties).catch(() => {});
  }, [config.party]);

  useEffect(() => {
    if (config.itemized) listDocs("items").then(setItems).catch(() => {});
  }, [config.itemized]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [rows, search]);

  const lineTotal = lines.reduce((s, l) => s + l.qty * l.rate, 0);
  const total = config.itemized ? lineTotal : amount;

  const reset = () => {
    setEditing(null);
    setParty(""); setDate(today()); setReference(""); setNotes(""); setAmount(0);
    setLines([{ item: "", qty: 1, rate: 0 }]);
  };

  const openNew = () => { reset(); setOpen(true); };

  const openEdit = (row: Doc) => {
    setEditing(row);
    setParty(row.party || "");
    setDate(row.date || today());
    setReference(row.reference || "");
    setNotes(row.notes || "");
    setAmount(Number(row.amount || 0));
    setLines(row.lines?.length ? row.lines : [{ item: "", qty: 1, rate: 0 }]);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = {
      date, party, reference, notes, total,
      ...(config.itemized ? { lines: lines.filter((l) => l.item) } : { amount }),
    };
    setSaving(true);
    try {
      if (editing) {
        await updateDocById(config.collection, editing.id, payload);
        toast({ title: `${editing.number} updated`, type: "success" });
      } else {
        const number = nextDocNumber(config.prefix, rows.length);
        await createDoc(config.collection, { number, status: "Posted", ...payload });
        toast({ title: `${config.title} ${number} created`, type: "success" });
      }
      await load(); // re-fetch the listing
      setOpen(false);
      reset();
    } catch (err: any) {
      toast({ title: "Save failed", description: err?.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    exportToCsv(
      config.collection,
      rows.map((r) => ({
        Number: r.number, Date: r.date, Party: r.party || "",
        Reference: r.reference || "", Total: r.total || 0, Status: r.status || "Posted",
      }))
    );
    toast({ title: "Exported to CSV", type: "success" });
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    await deleteDocById(config.collection, toDelete.id);
    await load(); // re-fetch the listing
    toast({ title: "Document deleted", type: "success" });
  };

  const updateLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{config.title}</h2>
          <p className="text-sm text-muted-foreground">Create, post and track {config.title.toLowerCase()} documents.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="w-full pl-8" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" onClick={exportCsv} disabled={!rows.length}><Download className="h-4 w-4" /> Export</Button>
          <Button className="flex-1 sm:flex-none" onClick={openNew}><Plus className="h-4 w-4" /> New {config.title}</Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card card-shadow">
        <div className="border-b px-5 py-3 text-sm font-semibold">{filtered.length} document{filtered.length !== 1 ? "s" : ""}</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Date</TableHead>
              {config.party !== "none" && <TableHead>{config.party === "customer" ? "Customer" : "Vendor"}</TableHead>}
              <TableHead>Reference</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="grid place-items-center gap-2 py-12 text-muted-foreground">
                    <FileText className="h-8 w-8" />
                    <p className="text-sm">No {config.title.toLowerCase()} documents yet.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.number}</TableCell>
                  <TableCell>{r.date ? formatDate(r.date) : "—"}</TableCell>
                  {config.party !== "none" && <TableCell>{r.party || "—"}</TableCell>}
                  <TableCell>{r.reference || "—"}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(Number(r.total || 0))}</TableCell>
                  <TableCell><Badge variant="success">{r.status || "Posted"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Print" onClick={() => printDocument(config, r)}><Printer className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Delete" onClick={() => setToDelete(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? `Edit ${editing.number}` : `New ${config.title}`}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {config.party !== "none" && (
                <div className="space-y-1.5">
                  <Label>{config.party === "customer" ? "Customer" : "Vendor"}</Label>
                  <Select value={party} onValueChange={setParty}>
                    <SelectTrigger><SelectValue placeholder={`Select ${config.party}…`} /></SelectTrigger>
                    <SelectContent>
                      {parties.length === 0 ? (
                        <SelectItem value="—" disabled>No {config.party}s — add one first</SelectItem>
                      ) : parties.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Reference</Label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional reference" />
              </div>
            </div>

            {config.itemized ? (
              <div className="space-y-2">
                <Label>Line Items</Label>
                <div className="rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="p-2 text-left">Item</th>
                        <th className="w-20 p-2">Qty</th>
                        <th className="w-28 p-2">Rate</th>
                        <th className="w-28 p-2 text-right">Amount</th>
                        <th className="w-10 p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((l, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="p-1.5">
                            {items.length > 0 ? (
                              <Select value={l.item} onValueChange={(v) => {
                                const it = items.find((x) => x.name === v);
                                updateLine(i, { item: v, rate: it?.salePrice ?? it?.purchasePrice ?? l.rate });
                              }}>
                                <SelectTrigger className="h-8"><SelectValue placeholder="Select item…" /></SelectTrigger>
                                <SelectContent>
                                  {items.map((x) => <SelectItem key={x.id} value={x.name}>{x.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input className="h-8" value={l.item} onChange={(e) => updateLine(i, { item: e.target.value })} placeholder="Item / description" />
                            )}
                          </td>
                          <td className="p-1.5"><Input className="h-8" type="number" value={l.qty} onChange={(e) => updateLine(i, { qty: Number(e.target.value) })} /></td>
                          <td className="p-1.5"><Input className="h-8" type="number" value={l.rate} onChange={(e) => updateLine(i, { rate: Number(e.target.value) })} /></td>
                          <td className="p-1.5 text-right font-medium">{formatCurrency(l.qty * l.rate)}</td>
                          <td className="p-1.5 text-center">
                            <button type="button" onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, { item: "", qty: 1, rate: 0 }])}>
                  <Plus className="h-4 w-4" /> Add line
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={notes} onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
              <span className="text-sm font-medium text-muted-foreground">Total</span>
              <span className="text-lg font-extrabold">{formatCurrency(total)}</span>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save Changes" : `Post ${config.title}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title={`Delete ${config.title.toLowerCase()}?`}
        description={`Document “${toDelete?.number ?? ""}” will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete document"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
