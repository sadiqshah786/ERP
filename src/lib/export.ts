// CSV export helpers.

function csvCell(v: any): string {
  if (v == null) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function download(filename: string, content: string, type = "text/csv;charset=utf-8;") {
  const blob = new Blob(["﻿" + content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ExportColumn { key: string; label: string }

export function exportToCsv(filename: string, rows: Record<string, any>[], columns?: ExportColumn[]) {
  const cols: ExportColumn[] =
    columns ?? (rows[0] ? Object.keys(rows[0]).filter((k) => k !== "id").map((k) => ({ key: k, label: k })) : []);
  const header = cols.map((c) => csvCell(c.label)).join(",");
  const body = rows.map((r) => cols.map((c) => csvCell(r[c.key])).join(",")).join("\n");
  download(filename.endsWith(".csv") ? filename : `${filename}.csv`, `${header}\n${body}`);
}
