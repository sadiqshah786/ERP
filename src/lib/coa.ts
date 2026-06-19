// ─────────────────────────────────────────────────────────────
// Default Chart of Accounts structure (standard small-business chart).
// Groups are levelled: L2 (Main Group) → L3 (Sub Group) → L4 (Category)
// → postable detail accounts. Customer/Vendor sub-accounts are injected
// live at render time under the groups marked with `link`.
// ─────────────────────────────────────────────────────────────

export type Nature = "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";

export interface CoaNode {
  code: string;
  name: string;
  level: number;          // 2 | 3 | 4 for groups
  postable?: boolean;     // true for detail accounts (leaves)
  link?: "customers" | "vendors" | "banks";
  children?: CoaNode[];
}

export interface CoaType {
  key: string;
  label: string;
  nature: Nature;
  color: "asset" | "liability" | "equity" | "revenue" | "expense";
  groups: CoaNode[];
}

const leaf = (code: string, name: string): CoaNode => ({ code, name, level: 5, postable: true });

export const COA: CoaType[] = [
  {
    key: "1", label: "Assets", nature: "Asset", color: "asset",
    groups: [
      { code: "11", name: "Current Assets", level: 2, children: [
        { code: "111", name: "Cash & Bank", level: 3, children: [
          { code: "11101", name: "Cash Accounts", level: 4, children: [leaf("11101001", "Cash in Hand"), leaf("11101002", "Petty Cash")] },
          { code: "11102", name: "Bank Accounts", level: 4, link: "banks", children: [] },
        ]},
        { code: "112", name: "Receivables", level: 3, children: [
          { code: "11201", name: "Receivable Customers", level: 4, link: "customers", children: [] },
          { code: "11202", name: "Other Receivables", level: 4, children: [] },
          { code: "11203", name: "Vendor Advances", level: 4, children: [] },
          { code: "11204", name: "Staff Accounts", level: 4, children: [] },
        ]},
        { code: "113", name: "Inventory", level: 3, children: [
          { code: "11301", name: "Inventory", level: 4, children: [leaf("11301001", "Inventory Control")] },
          { code: "11302", name: "WIP Inventory", level: 4, children: [leaf("11302001", "WIP - Production")] },
        ]},
        { code: "114", name: "Prepaid Expenses", level: 3, children: [
          { code: "11401", name: "Prepaid Rent", level: 4, children: [] },
          { code: "11402", name: "Prepaid Insurance", level: 4, children: [] },
        ]},
      ]},
      { code: "12", name: "Fixed Assets", level: 2, children: [
        { code: "121", name: "Property & Equipment", level: 3, children: [
          { code: "12101", name: "Furniture & Fixtures", level: 4, children: [leaf("12101001", "Furniture & Fixtures")] },
          { code: "12102", name: "Office Equipment", level: 4, children: [leaf("12102001", "Office Equipment")] },
          { code: "12103", name: "Vehicles", level: 4, children: [leaf("12103001", "Vehicles")] },
          { code: "12104", name: "Building", level: 4, children: [leaf("12104001", "Building")] },
          { code: "12105", name: "Land", level: 4, children: [leaf("12105001", "Land")] },
          { code: "12106", name: "Plant & Machinery", level: 4, children: [leaf("12106001", "Plant & Machinery")] },
        ]},
        { code: "122", name: "Accumulated Depreciation", level: 3, children: [
          { code: "12201", name: "Accum Dep - Furniture", level: 4, children: [leaf("12201001", "Accum Dep - Furniture")] },
          { code: "12202", name: "Accum Dep - Equipment", level: 4, children: [leaf("12202001", "Accum Dep - Equipment")] },
          { code: "12203", name: "Accum Dep - Vehicles", level: 4, children: [leaf("12203001", "Accum Dep - Vehicles")] },
          { code: "12204", name: "Accum Dep - Building", level: 4, children: [leaf("12204001", "Accum Dep - Building")] },
          { code: "12205", name: "Accum Dep - Plant & Machinery", level: 4, children: [leaf("12205001", "Accum Dep - Plant & Machinery")] },
        ]},
      ]},
      { code: "13", name: "Other Assets", level: 2, children: [
        { code: "131", name: "Intangible Assets", level: 3, children: [
          { code: "13101", name: "Software & Licenses", level: 4, children: [] },
        ]},
      ]},
    ],
  },
  {
    key: "2", label: "Liabilities", nature: "Liability", color: "liability",
    groups: [
      { code: "21", name: "Current Liabilities", level: 2, children: [
        { code: "211", name: "Payables", level: 3, children: [
          { code: "21101", name: "Payable Vendors", level: 4, link: "vendors", children: [] },
          { code: "21102", name: "Other Payables", level: 4, children: [] },
        ]},
        { code: "212", name: "Accrued Expenses", level: 3, children: [leaf("21201001", "Accrued Salaries")] },
        { code: "213", name: "Taxes Payable", level: 3, children: [leaf("21301001", "Sales Tax Payable"), leaf("21301002", "Income Tax Payable")] },
      ]},
      { code: "22", name: "Long Term Liabilities", level: 2, children: [
        { code: "221", name: "Loans Payable", level: 3, children: [leaf("22101001", "Bank Loan")] },
      ]},
    ],
  },
  {
    key: "3", label: "Equity", nature: "Equity", color: "equity",
    groups: [
      { code: "31", name: "Capital", level: 2, children: [
        { code: "311", name: "Owner's Equity", level: 3, children: [
          leaf("31101001", "Owner's Capital"), leaf("31101002", "Retained Earnings"),
          leaf("31101003", "Drawings"), leaf("31101004", "Current Year Earnings"),
        ]},
      ]},
    ],
  },
  {
    key: "4", label: "Revenue", nature: "Revenue", color: "revenue",
    groups: [
      { code: "41", name: "Operating Revenue", level: 2, children: [
        { code: "411", name: "Sales Revenue", level: 3, children: [leaf("41101001", "Sales Revenue"), leaf("41101002", "Service Revenue")] },
      ]},
      { code: "42", name: "Other Income", level: 2, children: [
        { code: "421", name: "Other Income", level: 3, children: [leaf("42101001", "Other Income")] },
      ]},
    ],
  },
  {
    key: "5", label: "Expenses", nature: "Expense", color: "expense",
    groups: [
      { code: "51", name: "Cost of Goods Sold", level: 2, children: [
        { code: "511", name: "COGS", level: 3, children: [leaf("51101001", "Cost of Goods Sold"), leaf("51101002", "Purchase Discounts")] },
      ]},
      { code: "52", name: "Operating Expenses", level: 2, children: [
        { code: "521", name: "Administrative", level: 3, children: [
          leaf("52101001", "Salaries & Wages"), leaf("52101002", "Rent Expense"),
          leaf("52101003", "Utilities"), leaf("52101004", "Office Expenses"),
        ]},
        { code: "522", name: "Selling & Distribution", level: 3, children: [
          leaf("52201001", "Marketing & Advertising"), leaf("52201002", "Freight & Delivery"),
        ]},
        { code: "523", name: "Other Operating", level: 3, children: [
          leaf("52301001", "Depreciation Expense"), leaf("52301002", "Repairs & Maintenance"),
          leaf("52301003", "Bank Charges"), leaf("52301004", "Miscellaneous"),
        ]},
      ]},
    ],
  },
];

export const typeColors: Record<CoaType["color"], { head: string; bar: string; text: string }> = {
  asset:     { head: "bg-green-50 dark:bg-green-950/30",   bar: "bg-green-500",   text: "text-green-700 dark:text-green-400" },
  liability: { head: "bg-amber-50 dark:bg-amber-950/30",   bar: "bg-amber-500",   text: "text-amber-700 dark:text-amber-400" },
  equity:    { head: "bg-blue-50 dark:bg-blue-950/30",     bar: "bg-blue-500",    text: "text-blue-700 dark:text-blue-400" },
  revenue:   { head: "bg-emerald-50 dark:bg-emerald-950/30", bar: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
  expense:   { head: "bg-rose-50 dark:bg-rose-950/30",     bar: "bg-rose-500",    text: "text-rose-700 dark:text-rose-400" },
};

export interface FlatAccount { code: string; name: string; nature: Nature; kind?: "customer" | "vendor" | "bank" }

const seq = (n: number) => String(n).padStart(3, "0");

// Flatten all postable accounts (incl. live customer/vendor/bank sub-accounts).
export function flattenAccounts(customers: any[], vendors: any[], banks: any[]): FlatAccount[] {
  const out: FlatAccount[] = [];
  COA.forEach((t) => {
    const walk = (n: CoaNode) => {
      if (n.postable) { out.push({ code: n.code, name: n.name, nature: t.nature }); return; }
      if (n.link === "customers") customers.forEach((c, i) => out.push({ code: `${n.code}${seq(i + 1)}`, name: `Customer: ${c.name}`, nature: "Asset", kind: "customer" }));
      else if (n.link === "vendors") vendors.forEach((v, i) => out.push({ code: `${n.code}${seq(i + 1)}`, name: `Vendor: ${v.name}`, nature: "Liability", kind: "vendor" }));
      else if (n.link === "banks") banks.forEach((b, i) => out.push({ code: `${n.code}${seq(i + 1)}`, name: b.name + (b.accountNumber ? ` — ${b.accountNumber}` : ""), nature: "Asset", kind: "bank" }));
      n.children?.forEach(walk);
    };
    t.groups.forEach(walk);
  });
  return out;
}

// Count helpers for the summary cards.
export function countNodes(nodes: CoaNode[], levels: number[]): number {
  let n = 0;
  const walk = (arr: CoaNode[]) => arr.forEach((x) => {
    if (x.postable ? levels.includes(5) : levels.includes(x.level)) n++;
    if (x.children) walk(x.children);
  });
  walk(nodes);
  return n;
}
