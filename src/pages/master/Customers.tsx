import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  Plus, Pencil, Trash2, Search, Users, Download, Upload, FileDown, Loader2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FieldError } from "@/components/ui/field-error";
import { useToast } from "@/components/ui/toast";
import { Doc, listDocs, createDoc, updateDocById, deleteDocById } from "@/lib/store";
import { masterConfigs } from "@/lib/schemas";
import { downloadTemplate, parseImportFile } from "@/lib/template";
import { cn, formatCurrency } from "@/lib/utils";

const CFG = masterConfigs["/master/customers"];

const inputCls = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";

const schema = Yup.object({
  name: Yup.string().required("Company name is required"),
  phone: Yup.string().required("Phone is required"),
  email: Yup.string().email("Enter a valid email").nullable(),
});

interface PriceRow { item: string; price: number }

export default function Customers() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Doc[]>([]);
  const [regions, setRegions] = useState<Doc[]>([]);
  const [employees, setEmployees] = useState<Doc[]>([]);
  const [items, setItems] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [modal, setModal] = useState<{ open: boolean; editing: Doc | null }>({ open: false, editing: null });
  const [toDelete, setToDelete] = useState<Doc | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await listDocs("customers")); }
    catch (e: any) { toast({ title: "Could not load customers", description: e?.message, type: "error" }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { listDocs("regions").then(setRegions).catch(() => {}); }, []);
  useEffect(() => { listDocs("employees").then(setEmployees).catch(() => {}); }, []);
  useEffect(() => { listDocs("items").then(setItems).catch(() => {}); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [rows, search]);

  const salesPeople = useMemo(
    () => employees.filter((e) => e.isSalesPerson === "Yes").map((e) => `${e.firstName || ""} ${e.lastName || ""}`.trim()).filter(Boolean),
    [employees]
  );
  const areaSuggestions = useMemo(() => Array.from(new Set(rows.map((r) => r.area).filter(Boolean))) as string[], [rows]);

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true);
    try {
      const { payloads, skipped } = await parseImportFile(file, CFG);
      if (!payloads.length) { toast({ title: "Nothing to import", type: "error" }); return; }
      for (const p of payloads) await createDoc("customers", p);
      await load();
      toast({ title: `${payloads.length} customers imported`, description: skipped ? `${skipped} skipped` : undefined, type: "success" });
    } catch (err: any) { toast({ title: "Import failed", description: err?.message, type: "error" }); }
    finally { setImporting(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold">Customers</h2>
          <p className="text-xs text-muted-foreground">Master Data / Customers</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => downloadTemplate(CFG)}><FileDown className="h-4 w-4" /> Download Template</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>{importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import Excel</Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onImport} />
          <Button onClick={() => setModal({ open: true, editing: null })}><Plus className="h-4 w-4" /> Add Customer</Button>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 card-shadow">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Users className="h-5 w-5" /></div>
        <div><div className="text-2xl font-extrabold leading-none">{rows.length}</div><div className="text-xs text-muted-foreground">Total Customers</div></div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by company name, phone, NTN…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="rounded-2xl border bg-card card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead><TableHead>Phone</TableHead><TableHead>Region</TableHead>
              <TableHead className="text-right">Credit Limit</TableHead><TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6}><div className="grid place-items-center gap-2 py-12 text-muted-foreground"><Users className="h-8 w-8" /><p className="text-sm">No customers yet. Click “Add Customer”.</p></div></TableCell></TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="font-semibold">{r.name}</div>
                  {r.contactPerson && <div className="text-xs text-muted-foreground">{r.contactPerson}</div>}
                </TableCell>
                <TableCell>{r.phone || "—"}</TableCell>
                <TableCell>{r.region || "—"}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(r.creditLimit || 0))}</TableCell>
                <TableCell><Badge variant={r.status === "Inactive" ? "secondary" : "success"}>{r.status || "Active"}</Badge></TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setModal({ open: true, editing: r })}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setToDelete(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CustomerModal
        state={modal} regions={regions} salesPeople={salesPeople} items={items} areaSuggestions={areaSuggestions}
        onClose={() => setModal({ open: false, editing: null })}
        onSaved={async () => { await load(); setModal({ open: false, editing: null }); }}
      />

      <ConfirmDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete customer?" description={`“${toDelete?.name}” will be permanently removed.`} confirmLabel="Delete customer"
        onConfirm={async () => { await deleteDocById("customers", toDelete!.id); await load(); toast({ title: "Customer deleted", type: "success" }); }} />
    </div>
  );
}

function CustomerModal({ state, regions, salesPeople, items, areaSuggestions, onClose, onSaved }: {
  state: { open: boolean; editing: Doc | null }; regions: Doc[]; salesPeople: string[]; items: Doc[]; areaSuggestions: string[];
  onClose: () => void; onSaved: () => void;
}) {
  const { toast } = useToast();
  const [pricing, setPricing] = useState<PriceRow[]>([]);
  const e = state.editing;

  useEffect(() => {
    if (state.open) setPricing(Array.isArray(e?.customPricing) ? e!.customPricing : []);
  }, [state.open]); // eslint-disable-line react-hooks/exhaustive-deps

  const initial = {
    name: e?.name ?? "", contactPerson: e?.contactPerson ?? "", email: e?.email ?? "", phone: e?.phone ?? "",
    ntn: e?.ntn ?? "", strn: e?.strn ?? "", address: e?.address ?? "", region: e?.region ?? "", area: e?.area ?? "",
    postalCode: e?.postalCode ?? "", country: e?.country ?? "Pakistan", creditLimit: e?.creditLimit ?? 0,
    creditDays: e?.creditDays ?? 30, status: e?.status ?? "Active", salesPerson: e?.salesPerson ?? "", notes: e?.notes ?? "",
  };

  const submit = async (values: typeof initial) => {
    const payload = { ...values, customPricing: pricing.filter((p) => p.item) };
    try {
      if (e) await updateDocById("customers", e.id, payload);
      else await createDoc("customers", payload);
      toast({ title: e ? "Customer updated" : "Customer created", type: "success" });
      onSaved();
    } catch (err: any) { toast({ title: "Save failed", description: err?.message, type: "error" }); }
  };

  return (
    <Dialog open={state.open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>{e ? "Edit Customer" : "Add New Customer"}</DialogTitle></DialogHeader>
        <Formik enableReinitialize initialValues={initial} validationSchema={schema} onSubmit={submit}>
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => {
            const err = (n: keyof typeof initial) => touched[n] && (errors as any)[n];
            return (
              <Form>
                <Tabs defaultValue="profile">
                  <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="pricing">Custom Items &amp; Pricing</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5"><Label>Company Name *</Label><Input name="name" placeholder="ABC Traders Pvt Ltd" value={values.name} onChange={handleChange} onBlur={handleBlur} className={cn(err("name") && "border-destructive")} /><FieldError error={err("name")} /></div>
                      <div className="space-y-1.5"><Label>Contact Person</Label><Input name="contactPerson" placeholder="Ahmed Khan" value={values.contactPerson} onChange={handleChange} /></div>
                      <div className="space-y-1.5"><Label>Email</Label><Input name="email" type="email" placeholder="info@company.pk" value={values.email} onChange={handleChange} onBlur={handleBlur} className={cn(err("email") && "border-destructive")} /><FieldError error={err("email")} /></div>
                      <div className="space-y-1.5"><Label>Phone *</Label><Input name="phone" placeholder="+92 300 1234567" value={values.phone} onChange={handleChange} onBlur={handleBlur} className={cn(err("phone") && "border-destructive")} /><FieldError error={err("phone")} /></div>
                      <div className="space-y-1.5"><Label>NTN (National Tax Number)</Label><Input name="ntn" placeholder="1234567-8" value={values.ntn} onChange={handleChange} /></div>
                      <div className="space-y-1.5"><Label>STRN (Sales Tax Registration)</Label><Input name="strn" placeholder="12-34-5678-901-23" value={values.strn} onChange={handleChange} /></div>
                      <div className="space-y-1.5 sm:col-span-2"><Label>Address</Label><textarea name="address" placeholder="Street address, area" value={values.address} onChange={handleChange} className="min-h-[64px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
                      <div className="space-y-1.5">
                        <Label>Region</Label>
                        <Select value={values.region} onValueChange={(v) => setFieldValue("region", v)}>
                          <SelectTrigger><SelectValue placeholder="Select Region" /></SelectTrigger>
                          <SelectContent>
                            {regions.length === 0 ? <SelectItem value="—" disabled>No regions — add in Maintain → Regions</SelectItem>
                              : regions.map((r) => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Area</Label>
                        <input name="area" list="cust-areas" placeholder="Select / type area" value={values.area} onChange={handleChange} className={inputCls} />
                        <datalist id="cust-areas">{areaSuggestions.map((a) => <option key={a} value={a} />)}</datalist>
                      </div>
                      <div className="space-y-1.5"><Label>Postal Code</Label><Input name="postalCode" placeholder="74000" value={values.postalCode} onChange={handleChange} /></div>
                      <div className="space-y-1.5"><Label>Country</Label><Input name="country" value={values.country} onChange={handleChange} /></div>
                      <div className="space-y-1.5"><Label>Credit Limit (PKR)</Label><Input name="creditLimit" type="number" value={values.creditLimit} onChange={handleChange} /></div>
                      <div className="space-y-1.5"><Label>Credit Days</Label><Input name="creditDays" type="number" value={values.creditDays} onChange={handleChange} /></div>
                      <div className="space-y-1.5">
                        <Label>Status</Label>
                        <Select value={values.status} onValueChange={(v) => setFieldValue("status", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Default Sales Person</Label>
                        <Select value={values.salesPerson || "__none"} onValueChange={(v) => setFieldValue("salesPerson", v === "__none" ? "" : v)}>
                          <SelectTrigger><SelectValue placeholder="— None —" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">— None —</SelectItem>
                            {salesPeople.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Auto-fills the salesperson on this customer's sale documents. Can still be overridden per document.</p>
                      </div>
                      <div className="space-y-1.5 sm:col-span-2"><Label>Notes</Label><textarea name="notes" placeholder="Optional notes or additional information" value={values.notes} onChange={handleChange} className="min-h-[64px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
                    </div>
                  </TabsContent>

                  <TabsContent value="pricing">
                    <p className="mb-3 text-sm text-muted-foreground">Set special prices for specific items. These override the default sale price for this customer.</p>
                    <div className="overflow-hidden rounded-xl border">
                      <table className="w-full text-sm">
                        <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                          <tr><th className="p-2 text-left">Item</th><th className="w-40 p-2 text-left">Default Price</th><th className="w-40 p-2 text-left">Custom Price</th><th className="w-10 p-2"></th></tr>
                        </thead>
                        <tbody>
                          {pricing.length === 0 ? (
                            <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No custom prices. Add a row below.</td></tr>
                          ) : pricing.map((row, i) => {
                            const it = items.find((x) => x.name === row.item);
                            return (
                              <tr key={i} className="border-b last:border-0">
                                <td className="p-1.5">
                                  <Select value={row.item} onValueChange={(v) => setPricing((p) => p.map((r, idx) => idx === i ? { ...r, item: v } : r))}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Select item…" /></SelectTrigger>
                                    <SelectContent>{items.map((x) => <SelectItem key={x.id} value={x.name}>{x.name}</SelectItem>)}</SelectContent>
                                  </Select>
                                </td>
                                <td className="p-1.5 text-muted-foreground">{formatCurrency(Number(it?.salePrice || 0))}</td>
                                <td className="p-1.5"><Input className="h-9" type="number" value={row.price} onChange={(ev) => setPricing((p) => p.map((r, idx) => idx === i ? { ...r, price: Number(ev.target.value) } : r))} /></td>
                                <td className="p-1.5 text-center"><button type="button" onClick={() => setPricing((p) => p.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setPricing((p) => [...p, { item: "", price: 0 }])}><Plus className="h-4 w-4" /> Add item price</Button>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="mt-5">
                  <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}{e ? "Save changes" : "Create"}</Button>
                </DialogFooter>
              </Form>
            );
          }}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}
