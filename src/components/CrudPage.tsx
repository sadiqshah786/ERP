import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Formik, Form } from "formik";
import { Plus, Pencil, Trash2, Search, Inbox, Download, Printer, Loader2, FileDown, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FieldError } from "@/components/ui/field-error";
import { buildYupSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";
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
import { downloadTemplate, parseImportFile } from "@/lib/template";

export function CrudPage({ config }: { config: EntityConfig }) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [toDelete, setToDelete] = useState<Doc | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const schema = useMemo(() => buildYupSchema(config.fields), [config]);
  const initialValues = useMemo(() => {
    const v: Record<string, any> = {};
    for (const f of config.fields) v[f.name] = editing?.[f.name] ?? (f.name === "country" ? "Pakistan" : "");
    if (config.codeField && !editing && !v[config.codeField]) {
      v[config.codeField] = `${config.codePrefix || ""}${String(rows.length + 1).padStart(4, "0")}`;
    }
    return v;
    // rows.length intentionally captured at open time only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, editing]);

  // ordered unique sections for grouped rendering
  const sections = useMemo(() => {
    const seen: string[] = [];
    config.fields.forEach((f) => { const s = f.section || ""; if (!seen.includes(s)) seen.push(s); });
    return seen;
  }, [config]);

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

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (row: Doc) => { setEditing(row); setOpen(true); };

  const handleSubmit = async (values: Record<string, any>) => {
    const payload: Record<string, any> = {};
    for (const f of config.fields) {
      let v = values[f.name];
      if (f.type === "number") v = v === "" || v == null ? 0 : Number(v);
      payload[f.name] = v ?? "";
    }
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

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const { payloads, skipped } = await parseImportFile(file, config);
      if (payloads.length === 0) {
        toast({ title: "Nothing to import", description: "No rows matched the template columns.", type: "error" });
        return;
      }
      for (const p of payloads) await createDoc(config.collection, p);
      await load();
      toast({
        title: `${payloads.length} ${config.title.toLowerCase()} imported`,
        description: skipped ? `${skipped} row(s) skipped (missing required fields).` : undefined,
        type: "success",
      });
    } catch (err: any) {
      toast({ title: "Import failed", description: err?.message ?? "Could not read the file.", type: "error" });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{config.title}</h2>
          {config.description && <p className="text-sm text-muted-foreground">{config.description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="w-full pl-8" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" onClick={() => downloadTemplate(config)} title="Download Excel template"><FileDown className="h-4 w-4" /> Template</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing} title="Import from Excel/CSV">
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import
          </Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onImportFile} />
          <Button variant="outline" onClick={print} disabled={!filtered.length} title="Print"><Printer className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}><Download className="h-4 w-4" /> Export</Button>
          <Button className="flex-1 sm:flex-none" onClick={openNew}><Plus className="h-4 w-4" /> Add {config.singular}</Button>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${config.singular}` : `New ${config.singular}`}</DialogTitle>
          </DialogHeader>
          <Formik enableReinitialize initialValues={initialValues} validationSchema={schema} onSubmit={handleSubmit}>
            {({ values, errors, touched, handleChange, handleBlur, setFieldValue, setFieldTouched, isSubmitting }) => {
              const invalid = (n: string) => touched[n] && errors[n];
              const renderField = (f: typeof config.fields[number]) => (
                <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
                  <Label htmlFor={f.name}>{f.label}{f.required && <span className="text-destructive"> *</span>}</Label>
                  {f.type === "select" ? (
                    <Select
                      value={(values[f.name] as string) ?? ""}
                      onValueChange={(v) => { setFieldValue(f.name, v); setFieldTouched(f.name, true); }}
                    >
                      <SelectTrigger className={cn(invalid(f.name) && "border-destructive ring-destructive/20")}><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>
                        {f.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      id={f.name} name={f.name}
                      className={cn("flex min-h-[72px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", invalid(f.name) && "border-destructive focus-visible:ring-destructive/20")}
                      value={(values[f.name] as string) ?? ""}
                      onChange={handleChange} onBlur={handleBlur}
                    />
                  ) : (
                    <Input
                      id={f.name} name={f.name}
                      type={f.type === "number" ? "number" : f.type === "email" ? "email" : f.type === "date" ? "date" : "text"}
                      placeholder={f.placeholder}
                      className={cn(invalid(f.name) && "border-destructive focus-visible:ring-destructive/20")}
                      value={(values[f.name] as string) ?? ""}
                      onChange={handleChange} onBlur={handleBlur}
                    />
                  )}
                  <FieldError error={invalid(f.name) as string} />
                </div>
              );
              return (
                <Form className="space-y-5 pt-1">
                  {sections.map((sec) => (
                    <div key={sec || "_default"} className="space-y-3">
                      {sec && <div className="border-b pb-1.5 text-sm font-bold text-primary">{sec}</div>}
                      <div className="grid gap-4 sm:grid-cols-2">
                        {config.fields.filter((f) => (f.section || "") === sec).map(renderField)}
                      </div>
                    </div>
                  ))}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {editing ? "Save changes" : `Create ${config.singular}`}
                    </Button>
                  </DialogFooter>
                </Form>
              );
            }}
          </Formik>
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
