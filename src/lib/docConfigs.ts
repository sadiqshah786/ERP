export interface DocConfig {
  title: string;
  collection: string;
  prefix: string;
  party: "customer" | "vendor" | "none";
  itemized: boolean;
  description?: string;
}

export const docConfigs: Record<string, DocConfig> = {
  // Purchases
  "/purchases/purchase-order": { title: "Purchase Order", collection: "purchase_orders", prefix: "PO", party: "vendor", itemized: true },
  "/purchases/grn": { title: "Goods Receipt (GRN)", collection: "grns", prefix: "GRN", party: "vendor", itemized: true },
  "/purchases/purchase-invoice": { title: "Purchase Invoice", collection: "purchase_invoices", prefix: "PINV", party: "vendor", itemized: true },
  "/purchases/purchase-return": { title: "Purchase Return", collection: "purchase_returns", prefix: "PRET", party: "vendor", itemized: true },
  "/purchases/non-tax-invoice": { title: "Non-Tax Purchase Invoice", collection: "nt_purchase_invoices", prefix: "NPINV", party: "vendor", itemized: true },
  "/purchases/non-tax-purchase-return": { title: "Non-Tax Purchase Return", collection: "nt_purchase_returns", prefix: "NPRET", party: "vendor", itemized: true },
  "/purchases/import-invoice": { title: "Import Purchase Invoice", collection: "import_invoices", prefix: "IMP", party: "vendor", itemized: true },

  // Sales
  "/sales/quotation": { title: "Quotation", collection: "quotations", prefix: "QT", party: "customer", itemized: true },
  "/sales/sale-order": { title: "Sale Order", collection: "sale_orders", prefix: "SO", party: "customer", itemized: true },
  "/sales/delivery-challan": { title: "Delivery Challan", collection: "delivery_challans", prefix: "DC", party: "customer", itemized: true },
  "/sales/sale-invoice": { title: "Sale Invoice", collection: "sale_invoices", prefix: "SINV", party: "customer", itemized: true },
  "/sales/sale-return": { title: "Sale Return", collection: "sale_returns", prefix: "SRET", party: "customer", itemized: true },
  "/sales/non-tax-invoice": { title: "Non-Tax Sale Invoice", collection: "nt_sale_invoices", prefix: "NSINV", party: "customer", itemized: true },
  "/sales/non-tax-sale-return": { title: "Non-Tax Sale Return", collection: "nt_sale_returns", prefix: "NSRET", party: "customer", itemized: true },

  // Store
  "/store/purchase-requisition": { title: "Purchase Requisition", collection: "requisitions", prefix: "REQ", party: "none", itemized: true },
  "/store/inward-gate-pass": { title: "Inward Gate Pass", collection: "inward_gate_passes", prefix: "IGP", party: "vendor", itemized: true },
  "/store/outward-gate-pass": { title: "Outward Gate Pass", collection: "outward_gate_passes", prefix: "OGP", party: "customer", itemized: true },
  "/store/bill-of-materials": { title: "Bill of Materials", collection: "boms", prefix: "BOM", party: "none", itemized: true },
  "/store/production-order": { title: "Production Order", collection: "production_orders", prefix: "PROD", party: "none", itemized: true },
  "/store/add-stock": { title: "Add Stock", collection: "stock_additions", prefix: "ADD", party: "none", itemized: true },
  "/store/reduce-stock": { title: "Reduce Stock", collection: "stock_reductions", prefix: "RED", party: "none", itemized: true },
  "/store/stock-transfer": { title: "Stock Transfer", collection: "stock_transfers", prefix: "TRF", party: "none", itemized: true },

  // Receipts / Payments / Journal
  "/receipts/cash-receipt": { title: "Cash Receipt", collection: "cash_receipts", prefix: "CR", party: "customer", itemized: false },
  "/receipts/bank-receipt": { title: "Bank Receipt", collection: "bank_receipts", prefix: "BR", party: "customer", itemized: false },
  "/payments/cash-payment": { title: "Cash Payment", collection: "cash_payments", prefix: "CP", party: "vendor", itemized: false },
  "/payments/bank-payment": { title: "Bank Payment", collection: "bank_payments", prefix: "BP", party: "vendor", itemized: false },
  "/journal/general": { title: "General Journal", collection: "journal_vouchers", prefix: "JV", party: "none", itemized: false },

  // Salary
  "/salary/advance": { title: "Salary Advance", collection: "salary_advances", prefix: "ADV", party: "none", itemized: false },
  "/salary/loan": { title: "Staff Loan", collection: "staff_loans", prefix: "LOAN", party: "none", itemized: false },
  "/salary/payroll-run": { title: "Payroll Run", collection: "payroll_runs", prefix: "PAY", party: "none", itemized: false },
  "/salary/final-settlement": { title: "Final Settlement", collection: "final_settlements", prefix: "FS", party: "none", itemized: false },

  // Assets
  "/assets/depreciation": { title: "Depreciation Run", collection: "depreciation_runs", prefix: "DEP", party: "none", itemized: false },
  "/assets/disposal": { title: "Asset Disposal", collection: "asset_disposals", prefix: "DIS", party: "none", itemized: false },

  // Other
  "/master/opening-balances": { title: "Opening Balances", collection: "opening_balances", prefix: "OB", party: "none", itemized: false },
};
