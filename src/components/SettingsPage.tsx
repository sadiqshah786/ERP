import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

const FORMS: Record<string, { title: string; fields: { name: string; label: string; type?: string }[] }> = {
  "/settings/company": {
    title: "My Company",
    fields: [
      { name: "companyName", label: "Company Name" },
      { name: "address", label: "Address" },
      { name: "phone", label: "Phone" },
      { name: "email", label: "Email", type: "email" },
      { name: "taxNumber", label: "NTN / Tax Number" },
      { name: "currency", label: "Base Currency" },
    ],
  },
  "/settings/financial-year": {
    title: "Financial Year",
    fields: [
      { name: "startDate", label: "Year Start", type: "date" },
      { name: "endDate", label: "Year End", type: "date" },
      { name: "lockDate", label: "Books Lock Date", type: "date" },
    ],
  },
  "/settings/documents": {
    title: "Document Settings",
    fields: [
      { name: "invoicePrefix", label: "Invoice Prefix" },
      { name: "poPrefix", label: "PO Prefix" },
      { name: "footerNote", label: "Default Footer Note" },
    ],
  },
};

export function SettingsPage({ path, title }: { path: string; title: string }) {
  const { toast } = useToast();
  const cfg = FORMS[path];
  const [form, setForm] = useState<Record<string, string>>({});
  const key = "amal_erp::settings::" + path;

  useEffect(() => {
    try { setForm(JSON.parse(localStorage.getItem(key) || "{}")); } catch { setForm({}); }
  }, [key]);

  if (!cfg) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center card-shadow">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          This settings module is part of AMAL ERP. Configuration options for <strong>{title}</strong> appear here.
        </p>
      </div>
    );
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(key, JSON.stringify(form));
    toast({ title: "Settings saved", type: "success" });
  };

  return (
    <form onSubmit={save} className="max-w-2xl space-y-4">
      <h2 className="text-xl font-bold">{cfg.title}</h2>
      <div className="grid gap-4 rounded-xl border bg-card p-5 card-shadow sm:grid-cols-2">
        {cfg.fields.map((f) => (
          <div key={f.name} className="space-y-1.5">
            <Label htmlFor={f.name}>{f.label}</Label>
            <Input id={f.name} type={f.type || "text"} value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
          </div>
        ))}
      </div>
      <Button type="submit"><Save className="h-4 w-4" /> Save Changes</Button>
    </form>
  );
}
