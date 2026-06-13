import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Lock, Unlock, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Doc, listDocs, createDoc, updateDocById } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default function FinancialYear() {
  const { toast } = useToast();
  const [years, setYears] = useState<Doc[]>([]);
  const [modal, setModal] = useState<{ open: boolean; editing: Doc | null }>({ open: false, editing: null });
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    let y = await listDocs("financial_years");
    if (y.length === 0) {
      await createDoc("financial_years", { code: "2025-26", name: "Financial Year 2025-26", start: "2025-07-01", end: "2026-06-30", status: "Active" });
      y = await listDocs("financial_years");
    }
    setYears(y);
  }, []);
  useEffect(() => { load().catch(() => {}); }, [load]);

  const active = years.find((y) => y.status === "Active");

  const open = (editing: Doc | null) => {
    setForm(editing ? { ...editing } : { code: "", name: "", start: "", end: "" });
    setModal({ open: true, editing });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { code: form.code, name: form.name, start: form.start, end: form.end };
      if (modal.editing) await updateDocById("financial_years", modal.editing.id, payload);
      else await createDoc("financial_years", { ...payload, status: "Active" });
      // ensure single active: if creating active, close others
      if (!modal.editing) {
        const all = await listDocs("financial_years");
        const newest = all[0];
        for (const y of all) if (y.id !== newest.id && y.status === "Active") await updateDocById("financial_years", y.id, { status: "Closed" });
      }
      toast({ title: modal.editing ? "Financial year updated" : "Financial year created", type: "success" });
      setModal({ open: false, editing: null });
      await load();
    } catch (err: any) { toast({ title: "Save failed", description: err?.message, type: "error" }); }
    finally { setSaving(false); }
  };

  const toggleClose = async (y: Doc) => {
    if (y.status === "Active") {
      await updateDocById("financial_years", y.id, { status: "Closed" });
      toast({ title: `${y.name} closed`, type: "success" });
    } else {
      // reopen → close others
      for (const o of years) if (o.id !== y.id && o.status === "Active") await updateDocById("financial_years", o.id, { status: "Closed" });
      await updateDocById("financial_years", y.id, { status: "Active" });
      toast({ title: `${y.name} re-opened`, type: "success" });
    }
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Financial Years</h2>
          <p className="text-sm text-muted-foreground">Manage your accounting periods. Only one financial year can be active at a time.</p>
        </div>
        <Button onClick={() => open(null)}><Plus className="h-4 w-4" /> New Financial Year</Button>
      </div>

      {active && (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <span>Current Active Year: <strong className="text-success">{active.name}</strong>{" "}
            <span className="text-muted-foreground">({formatDate(active.start)} - {formatDate(active.end)})</span></span>
        </div>
      )}

      <div className="rounded-2xl border bg-card card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year Code</TableHead><TableHead>Year Name</TableHead><TableHead>Period</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {years.map((y) => (
              <TableRow key={y.id}>
                <TableCell className="font-bold text-primary">{y.code}</TableCell>
                <TableCell>{y.name}</TableCell>
                <TableCell className="text-sm">{formatDate(y.start)} - {formatDate(y.end)}</TableCell>
                <TableCell><Badge variant={y.status === "Active" ? "success" : "secondary"}>{y.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => open(y)}><Pencil className="h-4 w-4" /> Edit</Button>
                    <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => toggleClose(y)}>
                      {y.status === "Active" ? <><Lock className="h-4 w-4" /> Close Year</> : <><Unlock className="h-4 w-4" /> Re-open</>}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modal.open} onOpenChange={(v) => !v && setModal({ open: false, editing: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{modal.editing ? "Edit Financial Year" : "New Financial Year"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Year Code *</Label><Input required placeholder="2025-26" value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Year Name *</Label><Input required placeholder="Financial Year 2025-26" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Start Date *</Label><Input type="date" required value={form.start ?? ""} onChange={(e) => setForm({ ...form, start: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>End Date *</Label><Input type="date" required value={form.end ?? ""} onChange={(e) => setForm({ ...form, end: e.target.value })} /></div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setModal({ open: false, editing: null })} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}{modal.editing ? "Save changes" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
