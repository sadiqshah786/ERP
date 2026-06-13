import {
  Home, Settings, Database, ShoppingCart, DollarSign, Box, Download, Upload,
  BookOpen, Monitor, Boxes, BarChart3, type LucideIcon,
} from "lucide-react";

export interface NavLeaf { label: string; path: string }
export interface NavSubGroup { label: string; children: NavLeaf[] }
export interface NavGroup {
  label: string;
  icon: LucideIcon;
  path?: string;
  children?: NavLeaf[];
  groups?: NavSubGroup[];
}

export const navigation: NavGroup[] = [
  { label: "Dashboard", icon: Home, path: "/" },
  {
    label: "Settings", icon: Settings,
    children: [
      { label: "My Company", path: "/settings/company" },
      { label: "Users & Roles", path: "/settings/users" },
      { label: "Financial Year", path: "/settings/financial-year" },
      { label: "Document Settings", path: "/settings/documents" },
      { label: "Print Formats", path: "/settings/print-formats" },
      { label: "Inventory Movement", path: "/settings/inventory-movement" },
      { label: "Backup", path: "/settings/backup" },
    ],
  },
  {
    label: "Maintain", icon: Database,
    children: [
      { label: "Chart of Accounts", path: "/master/chart-of-accounts" },
      { label: "Customers", path: "/master/customers" },
      { label: "Vendors", path: "/master/vendors" },
      { label: "Banks", path: "/master/banks" },
      { label: "Items/Products", path: "/master/chart-of-inventory" },
      { label: "Inventory Locations", path: "/master/inventory-locations" },
      { label: "Employees", path: "/master/employees" },
      { label: "Regions", path: "/master/regions" },
      { label: "Jobs / Projects", path: "/master/jobs" },
      { label: "Opening Balances", path: "/master/opening-balances" },
      { label: "Import Charge Templates", path: "/master/import-charge-templates" },
      { label: "Units of Measure", path: "/master/units" },
      { label: "Barcode Labels", path: "/inventory/labels" },
    ],
  },
  {
    label: "Purchases", icon: ShoppingCart,
    children: [
      { label: "Purchase Order", path: "/purchases/purchase-order" },
      { label: "Goods Receipt (GRN)", path: "/purchases/grn" },
      { label: "Purchase Invoice", path: "/purchases/purchase-invoice" },
      { label: "Purchase Return", path: "/purchases/purchase-return" },
      { label: "Non-Tax Purchase Invoice", path: "/purchases/non-tax-invoice" },
      { label: "Non-Tax Purchase Return", path: "/purchases/non-tax-purchase-return" },
      { label: "Import Purchase Invoice", path: "/purchases/import-invoice" },
    ],
  },
  {
    label: "Sales", icon: DollarSign,
    children: [
      { label: "Quotation", path: "/sales/quotation" },
      { label: "Sale Order", path: "/sales/sale-order" },
      { label: "Delivery Challan", path: "/sales/delivery-challan" },
      { label: "Sale Invoice", path: "/sales/sale-invoice" },
      { label: "Sale Return", path: "/sales/sale-return" },
      { label: "Non-Tax Sale Invoice", path: "/sales/non-tax-invoice" },
      { label: "Non-Tax Sale Return", path: "/sales/non-tax-sale-return" },
      { label: "POS Counter Sale", path: "/pos" },
    ],
  },
  {
    label: "Store", icon: Box,
    children: [
      { label: "Purchase Requisition", path: "/store/purchase-requisition" },
      { label: "Inward Gate Pass", path: "/store/inward-gate-pass" },
      { label: "Outward Gate Pass", path: "/store/outward-gate-pass" },
      { label: "Bill of Materials", path: "/store/bill-of-materials" },
      { label: "Production Order", path: "/store/production-order" },
      { label: "Add Stock", path: "/store/add-stock" },
      { label: "Reduce Stock", path: "/store/reduce-stock" },
      { label: "Stock Transfer", path: "/store/stock-transfer" },
    ],
  },
  {
    label: "Receipts", icon: Download,
    children: [
      { label: "Cash Receipt", path: "/receipts/cash-receipt" },
      { label: "Bank Receipt", path: "/receipts/bank-receipt" },
    ],
  },
  {
    label: "Payments", icon: Upload,
    children: [
      { label: "Cash Payment", path: "/payments/cash-payment" },
      { label: "Bank Payment", path: "/payments/bank-payment" },
    ],
  },
  {
    label: "Journal", icon: BookOpen,
    children: [{ label: "General Journal", path: "/journal/general" }],
  },
  {
    label: "Salary", icon: Monitor,
    children: [
      { label: "Salary Staff", path: "/salary/staff" },
      { label: "Advance", path: "/salary/advance" },
      { label: "Loan", path: "/salary/loan" },
      { label: "Payroll Run", path: "/salary/payroll-run" },
      { label: "Final Settlement", path: "/salary/final-settlement" },
    ],
  },
  {
    label: "Fixed Assets", icon: Boxes,
    children: [
      { label: "Asset Register", path: "/assets/register" },
      { label: "Asset Categories", path: "/assets/categories" },
      { label: "Depreciation Run", path: "/assets/depreciation" },
      { label: "Asset Disposal", path: "/assets/disposal" },
    ],
  },
  {
    label: "Reports", icon: BarChart3,
    groups: [
      {
        label: "Main Reports",
        children: [
          { label: "Journal Report", path: "/reports/journal" },
          { label: "Print Vouchers", path: "/reports/vouchers" },
          { label: "Serial Tracking", path: "/reports/serial-tracking" },
          { label: "PO Tracking", path: "/reports/po-tracking" },
          { label: "SO Tracking", path: "/reports/so-tracking" },
          { label: "GRN Tracking", path: "/reports/grn-tracking" },
          { label: "DC Tracking", path: "/reports/dc-tracking" },
          { label: "Draft Report", path: "/reports/drafts" },
        ],
      },
      {
        label: "Purchase Reports",
        children: [
          { label: "Purchase Summary", path: "/reports/purchase-summary" },
          { label: "Purchase Register", path: "/reports/purchase-register" },
          { label: "Party Purchase Summary", path: "/reports/party-purchase-summary" },
          { label: "Vendor Payments", path: "/reports/vendor-payments" },
          { label: "Purchase Activity", path: "/reports/purchase-activity" },
          { label: "Item Purchase Analysis", path: "/reports/item-purchase-analysis" },
          { label: "Accounts Payable Aging", path: "/reports/ap-aging" },
          { label: "Vendor Balances", path: "/reports/vendor-balances" },
          { label: "Landed Cost Analysis", path: "/reports/landed-cost-analysis" },
          { label: "Purchase Cycle (Flow)", path: "/reports/purchase-cycle" },
        ],
      },
      {
        label: "Sale Reports",
        children: [
          { label: "Sale Summary", path: "/reports/sale-summary" },
          { label: "Sale Register", path: "/reports/sale-register" },
          { label: "POS Sales", path: "/reports/pos-sales" },
          { label: "Party Sale Summary", path: "/reports/party-sale-summary" },
          { label: "Collection Report", path: "/reports/collection-report" },
          { label: "Sale Activity", path: "/reports/sale-activity" },
          { label: "Item Sale Analysis", path: "/reports/item-sale-analysis" },
          { label: "Accounts Receivable Aging", path: "/reports/ar-aging" },
          { label: "Salesperson Performance", path: "/reports/salesperson-performance" },
          { label: "Salesman Incentive", path: "/reports/salesman-incentive" },
          { label: "Item-wise Profit & Loss", path: "/reports/item-profit-loss" },
          { label: "Invoice-wise Profit & Loss", path: "/reports/invoice-profit-loss" },
          { label: "Customer Balances", path: "/reports/customer-balances" },
          { label: "Sales Intelligence", path: "/reports/sales-intelligence" },
          { label: "Operational Metrics", path: "/reports/operational-metrics" },
          { label: "Sale Cycle (Flow)", path: "/reports/sale-cycle" },
        ],
      },
      {
        label: "Inventory Reports",
        children: [
          { label: "Inventory Ledger", path: "/reports/inventory-ledger" },
          { label: "Inventory Balances", path: "/reports/inventory-balances" },
          { label: "Low Stock Alert", path: "/reports/low-stock-alert" },
          { label: "Inventory Intelligence", path: "/reports/inventory-intelligence" },
        ],
      },
      {
        label: "Financial Reports",
        children: [
          { label: "Ledger Report", path: "/reports/ledger" },
          { label: "Trial Balance", path: "/reports/trial-balance" },
          { label: "Profit & Loss", path: "/reports/profit-loss" },
          { label: "Balance Sheet", path: "/reports/balance-sheet" },
          { label: "Cash Flow Statement", path: "/reports/cash-flow" },
          { label: "Tax Reports", path: "/reports/tax-reports" },
          { label: "Financial Health", path: "/reports/financial-health" },
          { label: "Cash Flow Management", path: "/reports/cash-flow-management" },
        ],
      },
      {
        label: "Salary Reports",
        children: [
          { label: "Salary Register", path: "/reports/salary-register" },
          { label: "Staff Loan & Advance", path: "/reports/staff-loan-advance" },
          { label: "Statutory Contributions", path: "/reports/statutory-contributions" },
        ],
      },
      {
        label: "Fixed Asset Reports",
        children: [
          { label: "Fixed Asset Register", path: "/reports/asset-register" },
          { label: "Depreciation Schedule", path: "/reports/depreciation-schedule" },
          { label: "FBR Depreciation Statement", path: "/reports/fbr-depreciation" },
          { label: "Asset Disposals", path: "/reports/asset-disposals" },
          { label: "Asset Movement", path: "/reports/asset-movement" },
        ],
      },
      {
        label: "Job Reports",
        children: [
          { label: "Job Cost Sheet", path: "/reports/job-cost-sheet" },
          { label: "Job Profit & Loss", path: "/reports/job-profit-loss" },
        ],
      },
      {
        label: "Production Reports",
        children: [
          { label: "Production Summary / Register", path: "/reports/production-summary" },
          { label: "Production Cost & Variance", path: "/reports/production-variance" },
        ],
      },
    ],
  },
];

// Flatten all leaf routes for the router.
export function allRoutes(): NavLeaf[] {
  const out: NavLeaf[] = [];
  for (const g of navigation) {
    if (g.path && g.path !== "/") out.push({ label: g.label, path: g.path });
    g.children?.forEach((c) => out.push(c));
    g.groups?.forEach((sg) => sg.children.forEach((c) => out.push(c)));
  }
  return out;
}
