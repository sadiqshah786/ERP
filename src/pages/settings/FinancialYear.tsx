import { useCallback, useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Plus, Pencil, Lock, Unlock, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FieldError } from "@/components/ui/field-error";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Doc, listDocs, createDoc, updateDocById } from "@/lib/store";
import { cn, formatDate } from "@/lib/utils";

export default function FinancialYear() {
  const { toast } = useToast();
  const [years, setYears] = useState<Doc[]>([]);
  const [modal, setModal] = useState<{ open: boolean; editing: Doc | null }>({ open: false, editing: null });

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

  const open = (editing: Doc | null) => setModal({ open: true, editing });

  const schema = Yup.object({
    code: Yup.string().required("Year code is required"),
    name: Yup.string().required("Year name is required"),
    start: Yup.string().required("Start date is required"),
    end: Yup.string().required("End date is required")
      .test("after", "End date must be after start date", function (v) {
        const { start } = this.parent;
        return !start || !v || new Date(v) > new Date(start);
      }),
  });

  const submit = async (values: { code: string; name: string; start: string; end: string }) => {
    try {
      if (modal.editing) await updateDocById("financial_years", modal.editing.id, values);
      else await createDoc("financial_years", { ...values, status: "Active" });
      if (!modal.editing) {
        const all = await listDocs("financial_years");
        const newest = all[0];
        for (const y of all) if (y.id !== newest.id && y.status === "Active") await updateDocById("financial_years", y.id, { status: "Closed" });
      }
      toast({ title: modal.editing ? "Financial year updated" : "Financial year created", type: "success" });
      setModal({ open: false, editing: null });
      await load();
    } catch (err: any) { toast({ title: "Save failed", description: err?.message, type: "error" }); }
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
        <Button className="w-full sm:w-auto" onClick={() => open(null)}><Plus className="h-4 w-4" /> New Financial Year</Button>
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
          <Formik
            enableReinitialize
            initialValues={{ code: modal.editing?.code ?? "", name: modal.editing?.name ?? "", start: modal.editing?.start ?? "", end: modal.editing?.end ?? "" }}
            validationSchema={schema} onSubmit={submit}
          >
            {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => {
              const err = (n: "code" | "name" | "start" | "end") => touched[n] && errors[n];
              return (
                <Form className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label>Year Code *</Label><Input name="code" placeholder="2025-26" value={values.code} onChange={handleChange} onBlur={handleBlur} className={cn(err("code") && "border-destructive")} /><FieldError error={err("code")} /></div>
                  <div className="space-y-1.5"><Label>Year Name *</Label><Input name="name" placeholder="Financial Year 2025-26" value={values.name} onChange={handleChange} onBlur={handleBlur} className={cn(err("name") && "border-destructive")} /><FieldError error={err("name")} /></div>
                  <div className="space-y-1.5"><Label>Start Date *</Label><Input name="start" type="date" value={values.start} onChange={handleChange} onBlur={handleBlur} className={cn(err("start") && "border-destructive")} /><FieldError error={err("start")} /></div>
                  <div className="space-y-1.5"><Label>End Date *</Label><Input name="end" type="date" value={values.end} onChange={handleChange} onBlur={handleBlur} className={cn(err("end") && "border-destructive")} /><FieldError error={err("end")} /></div>
                  <DialogFooter className="sm:col-span-2">
                    <Button type="button" variant="outline" onClick={() => setModal({ open: false, editing: null })} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}{modal.editing ? "Save changes" : "Create"}</Button>
                  </DialogFooter>
                </Form>
              );
            }}
          </Formik>
        </DialogContent>
      </Dialog>
    </div>
  );
}
