export type FieldType = "text" | "number" | "email" | "tel" | "select" | "textarea" | "date";

export interface Field {
  name: string;
  label: string;
  type?: FieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

export interface EntityConfig {
  title: string;
  singular: string;
  collection: string;
  description?: string;
  fields: Field[];
  columns: { key: string; label: string; money?: boolean }[];
}

const F = (name: string, label: string, type: FieldType = "text", extra: Partial<Field> = {}): Field => ({
  name, label, type, ...extra,
});

export const masterConfigs: Record<string, EntityConfig> = {
  "/master/customers": {
    title: "Customers", singular: "Customer", collection: "customers",
    description: "Manage your customer accounts and credit terms.",
    fields: [
      F("name", "Customer Name", "text", { required: true }),
      F("contactPerson", "Contact Person"),
      F("phone", "Phone", "tel"),
      F("email", "Email", "email"),
      F("address", "Address", "textarea"),
      F("city", "City"),
      F("openingBalance", "Opening Balance", "number"),
      F("creditLimit", "Credit Limit", "number"),
      F("status", "Status", "select", { options: ["Active", "Inactive"] }),
    ],
    columns: [
      { key: "name", label: "Name" }, { key: "phone", label: "Phone" },
      { key: "city", label: "City" }, { key: "creditLimit", label: "Credit Limit", money: true },
      { key: "status", label: "Status" },
    ],
  },
  "/master/vendors": {
    title: "Vendors", singular: "Vendor", collection: "vendors",
    description: "Manage suppliers and payable terms.",
    fields: [
      F("name", "Vendor Name", "text", { required: true }),
      F("contactPerson", "Contact Person"),
      F("phone", "Phone", "tel"),
      F("email", "Email", "email"),
      F("address", "Address", "textarea"),
      F("taxNumber", "NTN / Tax No."),
      F("openingBalance", "Opening Balance", "number"),
      F("status", "Status", "select", { options: ["Active", "Inactive"] }),
    ],
    columns: [
      { key: "name", label: "Name" }, { key: "phone", label: "Phone" },
      { key: "taxNumber", label: "NTN" }, { key: "status", label: "Status" },
    ],
  },
  "/master/banks": {
    title: "Banks", singular: "Bank", collection: "banks",
    fields: [
      F("name", "Bank Name", "text", { required: true }),
      F("accountTitle", "Account Title"),
      F("accountNumber", "Account Number"),
      F("branch", "Branch"),
      F("iban", "IBAN"),
      F("openingBalance", "Opening Balance", "number"),
    ],
    columns: [
      { key: "name", label: "Bank" }, { key: "accountTitle", label: "Title" },
      { key: "accountNumber", label: "Account #" }, { key: "openingBalance", label: "Balance", money: true },
    ],
  },
  "/master/chart-of-inventory": {
    title: "Items / Products", singular: "Item", collection: "items",
    description: "Your product and inventory catalogue.",
    fields: [
      F("code", "Item Code", "text", { required: true }),
      F("name", "Item Name", "text", { required: true }),
      F("category", "Category"),
      F("unit", "Unit", "select", { options: ["PCS", "KG", "LTR", "BOX", "MTR", "SET"] }),
      F("purchasePrice", "Purchase Price", "number"),
      F("salePrice", "Sale Price", "number"),
      F("openingStock", "Opening Stock", "number"),
      F("reorderLevel", "Reorder Level", "number"),
      F("taxRate", "Tax Rate %", "number"),
    ],
    columns: [
      { key: "code", label: "Code" }, { key: "name", label: "Name" },
      { key: "category", label: "Category" }, { key: "salePrice", label: "Sale Price", money: true },
      { key: "openingStock", label: "Stock" },
    ],
  },
  "/master/inventory-locations": {
    title: "Inventory Locations", singular: "Location", collection: "locations",
    fields: [
      F("name", "Location Name", "text", { required: true }),
      F("code", "Code"),
      F("address", "Address", "textarea"),
      F("incharge", "In-charge"),
    ],
    columns: [{ key: "name", label: "Name" }, { key: "code", label: "Code" }, { key: "incharge", label: "In-charge" }],
  },
  "/master/employees": {
    title: "Employees", singular: "Employee", collection: "employees",
    fields: [
      F("name", "Full Name", "text", { required: true }),
      F("designation", "Designation"),
      F("department", "Department"),
      F("phone", "Phone", "tel"),
      F("cnic", "CNIC"),
      F("joiningDate", "Joining Date", "date"),
      F("basicSalary", "Basic Salary", "number"),
      F("status", "Status", "select", { options: ["Active", "Inactive"] }),
    ],
    columns: [
      { key: "name", label: "Name" }, { key: "designation", label: "Designation" },
      { key: "department", label: "Dept" }, { key: "basicSalary", label: "Basic", money: true },
      { key: "status", label: "Status" },
    ],
  },
  "/master/regions": {
    title: "Regions", singular: "Region", collection: "regions",
    fields: [F("name", "Region Name", "text", { required: true }), F("code", "Code"), F("manager", "Regional Manager")],
    columns: [{ key: "name", label: "Region" }, { key: "code", label: "Code" }, { key: "manager", label: "Manager" }],
  },
  "/master/jobs": {
    title: "Jobs / Projects", singular: "Job", collection: "jobs",
    fields: [
      F("name", "Job / Project Name", "text", { required: true }),
      F("client", "Client"),
      F("startDate", "Start Date", "date"),
      F("budget", "Budget", "number"),
      F("status", "Status", "select", { options: ["Open", "In Progress", "Completed", "On Hold"] }),
    ],
    columns: [
      { key: "name", label: "Name" }, { key: "client", label: "Client" },
      { key: "budget", label: "Budget", money: true }, { key: "status", label: "Status" },
    ],
  },
  "/master/units": {
    title: "Units of Measure", singular: "Unit", collection: "units",
    fields: [F("name", "Unit Name", "text", { required: true }), F("symbol", "Symbol"), F("description", "Description")],
    columns: [{ key: "name", label: "Name" }, { key: "symbol", label: "Symbol" }],
  },
  "/master/chart-of-accounts": {
    title: "Chart of Accounts", singular: "Account", collection: "accounts",
    fields: [
      F("code", "Account Code", "text", { required: true }),
      F("name", "Account Name", "text", { required: true }),
      F("type", "Type", "select", { options: ["Asset", "Liability", "Equity", "Income", "Expense"] }),
      F("parent", "Parent Account"),
      F("openingBalance", "Opening Balance", "number"),
    ],
    columns: [
      { key: "code", label: "Code" }, { key: "name", label: "Name" },
      { key: "type", label: "Type" }, { key: "openingBalance", label: "Opening", money: true },
    ],
  },
  "/assets/categories": {
    title: "Asset Categories", singular: "Category", collection: "asset_categories",
    fields: [
      F("name", "Category Name", "text", { required: true }),
      F("depreciationMethod", "Depreciation Method", "select", { options: ["Straight Line", "Reducing Balance"] }),
      F("rate", "Depreciation Rate %", "number"),
    ],
    columns: [{ key: "name", label: "Name" }, { key: "depreciationMethod", label: "Method" }, { key: "rate", label: "Rate %" }],
  },
  "/assets/register": {
    title: "Asset Register", singular: "Asset", collection: "assets",
    fields: [
      F("name", "Asset Name", "text", { required: true }),
      F("category", "Category"),
      F("purchaseDate", "Purchase Date", "date"),
      F("cost", "Cost", "number"),
      F("location", "Location"),
      F("status", "Status", "select", { options: ["In Use", "Idle", "Disposed"] }),
    ],
    columns: [
      { key: "name", label: "Asset" }, { key: "category", label: "Category" },
      { key: "cost", label: "Cost", money: true }, { key: "status", label: "Status" },
    ],
  },
  "/salary/staff": {
    title: "Salary Staff", singular: "Staff", collection: "salary_staff",
    fields: [
      F("name", "Staff Name", "text", { required: true }),
      F("designation", "Designation"),
      F("basicSalary", "Basic Salary", "number"),
      F("allowances", "Allowances", "number"),
      F("deductions", "Deductions", "number"),
    ],
    columns: [
      { key: "name", label: "Name" }, { key: "designation", label: "Designation" },
      { key: "basicSalary", label: "Basic", money: true },
    ],
  },
  "/settings/users": {
    title: "Users & Roles", singular: "User", collection: "users",
    fields: [
      F("name", "Name", "text", { required: true }),
      F("email", "Email", "email", { required: true }),
      F("role", "Role", "select", { options: ["Admin", "Manager", "Accountant", "Sales", "Viewer"] }),
      F("status", "Status", "select", { options: ["Active", "Disabled"] }),
    ],
    columns: [
      { key: "name", label: "Name" }, { key: "email", label: "Email" },
      { key: "role", label: "Role" }, { key: "status", label: "Status" },
    ],
  },
};
