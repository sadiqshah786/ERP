import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Inbox, Download, Printer, Loader2 } from "lucide-react";
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
import { EntityConfig } from "@/lib/schemas";
import { Doc, listDocs, createDoc, updateDocById, deleteDocById } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { exportToCsv } from "@/lib/export";
import { printTable } from "@/lib/print";

export function CrudPage({ config }: { config: EntityConfig }) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Doc | null>(null);

  // Load the listing from the API; re-called after every mutation.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listDocs(config.collection));
    } catch (err: any) {
      toast({ title: "Could not load records", description: err?.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, [config.collection]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q)));
  }, [rows, search]);

  const openNew = () => {
    setEditing(null);
    setForm({});
    setOpen(true);
  };
  const openEdit = (row: Doc) => {
    setEditing(row);
    setForm({ ...row });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = {};
    for (const f of config.fields) {
      let v = form[f.name];
      if (f.type === "number") v = v === "" || v == null ? 0 : Number(v);
      payload[f.name] = v ?? "";
    }
    setSaving(true);
    try {
      if (editing) {
        await updateDocById(config.collection, editing.id, payload);
        toast({ title: `${config.singular} updated`, type: "success" });
      } else {
        await createDoc(config.collection, payload);
        toast({ title: `${config.singular} created`, type: "success" });
      }
      await load(); // re-fetch the listing
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Save failed", description: err?.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    await deleteDocById(config.collection, toDelete.id);
    await load(); // re-fetch the listing
    toast({ title: `${config.singular} deleted`, type: "success" });
  };

  const exportCsv = () => {
    exportToCsv(
      config.collection,
      filtered.map((r) => Object.fromEntries(config.columns.map((c) => [c.label, r[c.key] ?? ""]))),
      config.columns.map((c) => ({ key: c.label, label: c.label }))
    );
    toast({ title: "Exported to CSV", type: "success" });
  };

  const print = () =>
    printTable(config.title, config.columns.map((c) => ({ key: c.key, label: c.label })), filtered);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{config.title}</h2>
          {config.description && <p className="text-sm text-muted-foreground">{config.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="w-56 pl-8" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" onClick={print} disabled={!filtered.length} title="Print"><Printer className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}><Download className="h-4 w-4" /> Export</Button>
          <Button onClick={openNew}><Plus className="h-4 w-4" /> Add {config.singular}</Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card card-shadow">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <span className="text-sm font-semibold">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {config.columns.map((c) => <TableHead key={c.key}>{c.label}</TableHead>)}
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={config.columns.length + 1} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={config.columns.length + 1}>
                  <div className="grid place-items-center gap-2 py-12 text-muted-foreground">
                    <Inbox className="h-8 w-8" />
                    <p className="text-sm">No {config.title.toLowerCase()} yet. Click “Add {config.singular}” to create one.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  {config.columns.map((c) => (
                    <TableCell key={c.key}>
                      {c.key === "status" ? (
                        <Badge variant={String(row[c.key]).match(/active|in use|open|completed/i) ? "success" : "secondary"}>
                          {row[c.key] || "—"}
                        </Badge>
                      ) : c.money ? (
                        formatCurrency(Number(row[c.key] || 0))
                      ) : (
                        String(row[c.key] ?? "—")
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Delete" onClick={() => setToDelete(row)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${config.singular}` : `New ${config.singular}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            {config.fields.map((f) => (
              <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
                <Label htmlFor={f.name}>{f.label}{f.required && <span className="text-destructive"> *</span>}</Label>
                {f.type === "select" ? (
                  <Select value={form[f.name] ?? ""} onValueChange={(v) => setForm({ ...form, [f.name]: v })}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {f.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : f.type === "textarea" ? (
                  <textarea
                    id={f.name}
                    className="flex min-h-[72px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form[f.name] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  />
                ) : (
                  <Input
                    id={f.name}
                    type={f.type === "number" ? "number" : f.type === "email" ? "email" : f.type === "date" ? "date" : "text"}
                    required={f.required}
                    placeholder={f.placeholder}
                    value={form[f.name] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  />
                )}
              </div>
            ))}
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : `Create ${config.singular}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title={`Delete ${config.singular.toLowerCase()}?`}
        description={`“${toDelete?.[config.columns[0].key] ?? "This record"}” will be permanently removed. This action cannot be undone.`}
        confirmLabel={`Delete ${config.singular}`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
