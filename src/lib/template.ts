import * as XLSX from "xlsx";
import type { EntityConfig } from "./schemas";

// ─────────────────────────────────────────────────────────────
// Excel import/export templates for master-data (CrudPage) entities.
// The template's header row uses the human-readable field labels;
// on import we map each column back to the field name (by label,
// case-insensitively, with the raw field name as a fallback).
// ─────────────────────────────────────────────────────────────

/** Download a .xlsx template with field labels as headers + one sample row. */
export function downloadTemplate(config: EntityConfig) {
  const headers = config.fields.map((f) => f.label);
  const sample: Record<string, any> = {};
  config.fields.forEach((f) => {
    sample[f.label] =
      f.type === "number" ? 0
      : f.type === "date" ? new Date().toISOString().slice(0, 10)
      : f.type === "select" ? (f.options?.[0] ?? "")
      : f.type === "email" ? "name@example.com"
      : `Sample ${f.label}`;
  });

  const ws = XLSX.utils.json_to_sheet([sample], { header: headers });
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(14, h.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, config.title.slice(0, 28) || "Template");
  XLSX.writeFile(wb, `${config.collection}-template.xlsx`);
}

export interface ImportResult { payloads: Record<string, any>[]; skipped: number }

/** Parse an uploaded .xlsx/.csv file into field-mapped payloads. */
export async function parseImportFile(file: File, config: EntityConfig): Promise<ImportResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

  // build lookup: normalized header -> field
  const norm = (s: string) => s.trim().toLowerCase();
  const byHeader = new Map<string, (typeof config.fields)[number]>();
  config.fields.forEach((f) => {
    byHeader.set(norm(f.label), f);
    byHeader.set(norm(f.name), f);
  });

  const payloads: Record<string, any>[] = [];
  let skipped = 0;

  for (const row of rows) {
    const payload: Record<string, any> = {};
    let hasValue = false;
    for (const [key, val] of Object.entries(row)) {
      const field = byHeader.get(norm(key));
      if (!field) continue;
      let v: any = typeof val === "string" ? val.trim() : val;
      if (field.type === "number") v = v === "" || v == null ? 0 : Number(v) || 0;
      payload[field.name] = v;
      if (v !== "" && v != null) hasValue = true;
    }
    // require at least the first required field (or any value) to import a row
    const required = config.fields.find((f) => f.required);
    const ok = required ? !!payload[required.name] : hasValue;
    if (ok) payloads.push(payload);
    else if (hasValue) skipped++;
  }

  return { payloads, skipped };
}
