import { useEffect, useRef, useState } from "react";
import { Building2, MapPin, FileText, DollarSign, Upload, Save, ImageIcon } from "lucide-react";
import { SettingsSection, Field } from "@/components/settings/Section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const KEY = "amal_erp::settings::company";
const PROVINCES = ["Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan", "Gilgit-Baltistan", "Azad Kashmir", "Islamabad"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const selectCls =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";

export default function CompanySettings() {
  const { toast } = useToast();
  const [f, setF] = useState<Record<string, any>>({ country: "Pakistan", currency: "PKR (Rs.)", fiscalStart: "July", amountDp: "2", qtyDp: "2" });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(KEY) || "{}"); setF((p) => ({ ...p, ...s })); } catch { /* ignore */ }
  }, []);

  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast({ title: "File too large", description: "Max 2MB", type: "error" }); return; }
    const reader = new FileReader();
    reader.onload = () => set("logo", reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(f));
    toast({ title: "Company settings saved", type: "success" });
  };

  const dp = Number(f.amountDp ?? 2);
  const preview = `Rs. ${(1234567.89).toLocaleString("en-PK", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Company Settings</h2>
        <p className="text-sm text-muted-foreground">Configure your company information, logo, tax numbers, and currency settings.</p>
      </div>

      <SettingsSection icon={<Building2 className="h-5 w-5" />} title="Company Information">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="grid h-32 w-32 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-dashed bg-muted/40 text-muted-foreground">
            {f.logo ? <img src={f.logo} alt="logo" className="h-full w-full object-contain" /> : <div className="text-center"><ImageIcon className="mx-auto h-7 w-7" /><div className="mt-1 text-xs">No Logo</div></div>}
          </div>
          <div className="space-y-2">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif" className="hidden" onChange={onLogo} />
            <Button variant="secondary" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Upload Logo</Button>
            <div className="text-xs leading-relaxed text-muted-foreground">
              Recommended size: 200x200 pixels<br />Maximum file size: 2MB<br />Formats: PNG, JPG, GIF
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Company Name" required><Input value={f.companyName ?? ""} onChange={(e) => set("companyName", e.target.value)} /></Field>
          <Field label="Trade Name"><Input placeholder="Trading / brand name" value={f.tradeName ?? ""} onChange={(e) => set("tradeName", e.target.value)} /></Field>
        </div>
      </SettingsSection>

      <SettingsSection icon={<MapPin className="h-5 w-5" />} title="Contact Information">
        <div className="space-y-4">
          <Field label="Address" required>
            <textarea className="min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Complete street address" value={f.address ?? ""} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" required><Input value={f.city ?? ""} onChange={(e) => set("city", e.target.value)} /></Field>
            <Field label="Province">
              <select className={selectCls} value={f.province ?? ""} onChange={(e) => set("province", e.target.value)}>
                <option value="">Select Province</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Country"><Input value={f.country ?? ""} onChange={(e) => set("country", e.target.value)} /></Field>
            <Field label="Postal Code"><Input placeholder="e.g., 54000" value={f.postal ?? ""} onChange={(e) => set("postal", e.target.value)} /></Field>
            <Field label="Phone" required><Input placeholder="+92-42-35761234" value={f.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="Mobile"><Input placeholder="+92-300-1234567" value={f.mobile ?? ""} onChange={(e) => set("mobile", e.target.value)} /></Field>
            <Field label="Email" required><Input type="email" placeholder="info@company.com" value={f.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Website"><Input placeholder="www.company.com" value={f.website ?? ""} onChange={(e) => set("website", e.target.value)} /></Field>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection icon={<FileText className="h-5 w-5" />} title="Tax Information">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="NTN (National Tax Number)"><Input value={f.ntn ?? ""} onChange={(e) => set("ntn", e.target.value)} /></Field>
          <Field label="GST Registration Number"><Input placeholder="Registration number" value={f.gst ?? ""} onChange={(e) => set("gst", e.target.value)} /></Field>
          <Field label="STN (Sales Tax Number)"><Input placeholder="If different from GST" value={f.stn ?? ""} onChange={(e) => set("stn", e.target.value)} /></Field>
        </div>
      </SettingsSection>

      <SettingsSection icon={<DollarSign className="h-5 w-5" />} title="Currency & Financial Settings">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fiscal Year Start">
            <select className={selectCls} value={f.fiscalStart ?? "July"} onChange={(e) => set("fiscalStart", e.target.value)}>
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Currency"><Input value={f.currency ?? "PKR (Rs.)"} readOnly className="bg-muted" /></Field>
          <Field label="Amount Decimal Places">
            <select className={selectCls} value={f.amountDp ?? "2"} onChange={(e) => set("amountDp", e.target.value)}>
              <option value="0">0 - Whole (0)</option><option value="2">2 - Standard (0.00)</option><option value="3">3 - Extended (0.000)</option>
            </select>
          </Field>
          <Field label="Quantity Decimal Places">
            <select className={selectCls} value={f.qtyDp ?? "2"} onChange={(e) => set("qtyDp", e.target.value)}>
              <option value="0">0 - Whole (0)</option><option value="2">2 - Standard (0.00)</option><option value="3">3 - Extended (0.000)</option>
            </select>
          </Field>
          <Field label="Currency Preview"><Input value={preview} readOnly className="bg-muted" /></Field>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={save}><Save className="h-4 w-4" /> Save Changes</Button>
        </div>
      </SettingsSection>
    </div>
  );
}
