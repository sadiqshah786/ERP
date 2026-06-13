import { useEffect, useState } from "react";
import { FileText, Save, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const KEY = "amal_erp::settings::documents";
const YEAR = new Date().getFullYear();

interface DocItem { key: string; name: string; desc: string; prefix: string }
interface DocGroup { title: string; items: DocItem[] }

const GROUPS: DocGroup[] = [
  { title: "Purchase Documents", items: [
    { key: "pr", name: "Purchase Requisition", desc: "Internal purchase requests", prefix: "PR" },
    { key: "po", name: "Purchase Order", desc: "Orders to vendors", prefix: "PO" },
    { key: "grn", name: "Goods Receipt Note", desc: "Goods received from vendors", prefix: "GRN" },
    { key: "pi", name: "Purchase Invoice", desc: "Vendor bills", prefix: "PI" },
    { key: "pdn", name: "Purchase Return", desc: "Debit notes to vendors", prefix: "PDN" },
    { key: "npi", name: "Non-Tax Purchase Invoice", desc: "Purchase bills without GST", prefix: "NPI" },
    { key: "npr", name: "Non-Tax Purchase Return", desc: "Returns without GST", prefix: "NPR" },
    { key: "ipi", name: "Import Purchase Invoice", desc: "Foreign vendor bills with landed cost", prefix: "IPI" },
  ] },
  { title: "Sales Documents", items: [
    { key: "qt", name: "Quotation", desc: "Price quotes to customers", prefix: "QT" },
    { key: "so", name: "Sale Order", desc: "Customer orders", prefix: "SO" },
    { key: "dc", name: "Delivery Challan", desc: "Delivery documents", prefix: "DC" },
    { key: "si", name: "Sale Invoice", desc: "Customer bills", prefix: "SI" },
    { key: "scn", name: "Sale Return", desc: "Credit notes to customers", prefix: "SCN" },
    { key: "nsi", name: "Non-Tax Sale Invoice", desc: "Sale invoices without GST", prefix: "NSI" },
    { key: "nsr", name: "Non-Tax Sale Return", desc: "Returns without GST", prefix: "NSR" },
    { key: "pos", name: "POS Counter Sale", desc: "Point-of-sale receipts", prefix: "POS" },
  ] },
  { title: "Receipt & Payment Documents", items: [
    { key: "cr", name: "Cash Receipt", desc: "Cash received", prefix: "CR" },
    { key: "br", name: "Bank Receipt", desc: "Bank deposits", prefix: "BR" },
    { key: "cp", name: "Cash Payment", desc: "Cash paid", prefix: "CP" },
    { key: "bp", name: "Bank Payment", desc: "Bank payments", prefix: "BP" },
  ] },
  { title: "Journal Documents", items: [
    { key: "jv", name: "Journal Voucher", desc: "Manual accounting entries", prefix: "JV" },
  ] },
  { title: "Store Documents", items: [
    { key: "igp", name: "Inward Gate Pass", desc: "Goods entering premises", prefix: "IGP" },
    { key: "ogp", name: "Outward Gate Pass", desc: "Goods leaving premises", prefix: "OGP" },
    { key: "adj", name: "Stock Adjustment", desc: "Inventory corrections", prefix: "ADJ" },
    { key: "trf", name: "Stock Transfer", desc: "Inter-location transfers", prefix: "TRF" },
    { key: "bt", name: "Branch Transfer", desc: "Inter-branch transfers", prefix: "BT" },
    { key: "bom", name: "Bill of Materials", desc: "Product recipes", prefix: "BOM" },
    { key: "prod", name: "Production Order", desc: "Manufacturing orders", prefix: "PROD" },
  ] },
  { title: "Salary Documents", items: [
    { key: "adv", name: "Salary Advance", desc: "Staff advance vouchers", prefix: "ADV" },
    { key: "lon", name: "Staff Loan", desc: "Staff loan agreements", prefix: "LON" },
    { key: "pay", name: "Payroll Run", desc: "Monthly payroll", prefix: "PAY" },
    { key: "fnf", name: "Final Settlement", desc: "Staff F&F", prefix: "FNF" },
  ] },
];

type Cfg = Record<string, { prefix: string; start: number; padding: number }>;

function defaults(): Cfg {
  const c: Cfg = {};
  GROUPS.forEach((g) => g.items.forEach((i) => (c[i.key] = { prefix: i.prefix, start: 1, padding: 5 })));
  return c;
}

export default function DocumentSettings() {
  const { toast } = useToast();
  const [cfg, setCfg] = useState<Cfg>(defaults());

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "{}");
      setCfg((p) => ({ ...p, ...s }));
    } catch { /* ignore */ }
  }, []);

  const set = (key: string, field: "prefix" | "start" | "padding", value: any) =>
    setCfg((p) => ({ ...p, [key]: { ...p[key], [field]: field === "prefix" ? value : Number(value) } }));

  const preview = (key: string) => {
    const c = cfg[key];
    if (!c) return "";
    return `${c.prefix}-${YEAR}-${String(c.start).padStart(Math.max(1, c.padding), "0")}`;
  };

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(cfg));
    toast({ title: "Document settings saved", type: "success" });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Document Numbering</h2>
        <p className="text-sm text-muted-foreground">Configure automatic document numbering prefixes and formats for all transaction types.</p>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm">
        <div className="mb-2 flex items-center gap-2 font-semibold"><Info className="h-4 w-4 text-primary" /> Document Number Format: <code className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">PREFIX-YEAR-NUMBER</code></div>
        <ul className="ml-1 space-y-1 text-muted-foreground">
          <li><strong>Prefix:</strong> A short code to identify the document type (e.g., SI for Sale Invoice)</li>
          <li><strong>Year:</strong> Current year is automatically added</li>
          <li><strong>Number:</strong> Auto-incremented sequence number with zero padding</li>
        </ul>
        <p className="mt-2 text-muted-foreground">Example: <code className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">SI-{YEAR}-00001</code> for the first Sale Invoice of {YEAR}</p>
      </div>

      {GROUPS.map((g) => (
        <div key={g.title} className="rounded-2xl border bg-card card-shadow">
          <div className="flex items-center gap-2 border-b px-6 py-4 font-bold">
            <FileText className="h-4 w-4 text-primary" /> {g.title}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 text-left">Document Type</th>
                  <th className="px-3 py-3 text-left w-28">Prefix</th>
                  <th className="px-3 py-3 text-left w-24">Start #</th>
                  <th className="px-3 py-3 text-left w-24">Padding</th>
                  <th className="px-6 py-3 text-left w-44">Preview</th>
                </tr>
              </thead>
              <tbody>
                {g.items.map((i) => (
                  <tr key={i.key} className="border-b last:border-0">
                    <td className="px-6 py-3">
                      <div className="font-semibold">{i.name}</div>
                      <div className="text-xs text-muted-foreground">{i.desc}</div>
                    </td>
                    <td className="px-3 py-3"><Input className="h-9" value={cfg[i.key]?.prefix ?? ""} onChange={(e) => set(i.key, "prefix", e.target.value.toUpperCase())} /></td>
                    <td className="px-3 py-3"><Input className="h-9" type="number" value={cfg[i.key]?.start ?? 1} onChange={(e) => set(i.key, "start", e.target.value)} /></td>
                    <td className="px-3 py-3"><Input className="h-9" type="number" value={cfg[i.key]?.padding ?? 5} onChange={(e) => set(i.key, "padding", e.target.value)} /></td>
                    <td className="px-6 py-3">
                      <span className="inline-block rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 font-mono text-xs text-primary">{preview(i.key)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button onClick={save}><Save className="h-4 w-4" /> Save Settings</Button>
      </div>
    </div>
  );
}
