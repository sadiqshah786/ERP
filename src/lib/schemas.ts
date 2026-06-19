export type FieldType = "text" | "number" | "email" | "tel" | "select" | "textarea" | "date";

export interface Field {
  name: string;
  label: string;
  type?: FieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  section?: string;
}

export interface EntityConfig {
  title: string;
  singular: string;
  collection: string;
  description?: string;
  fields: Field[];
  columns: { key: string; label: string; money?: boolean }[];
  codeField?: string;   // field that holds an auto-generated code
  codePrefix?: string;  // e.g. "EMP-" → EMP-0001
}

const F = (name: string, label: string, type: FieldType = "text", extra: Partial<Field> = {}): Field => ({
  name, label, type, ...extra,
});

export const masterConfigs: Record<string, EntityConfig> = {
  "/master/customers": {
    title: "Customers", singular: "Customer", collection: "customers",
    description: "Manage your customer accounts and credit terms.",
    fields: [
      F("name", "Company Name", "text", { required: true, placeholder: "ABC Traders Pvt Ltd", section: "Profile" }),
      F("contactPerson", "Contact Person", "text", { placeholder: "Ahmed Khan", section: "Profile" }),
      F("email", "Email", "email", { placeholder: "info@company.pk", section: "Profile" }),
      F("phone", "Phone", "tel", { required: true, placeholder: "+92 300 1234567", section: "Profile" }),
      F("ntn", "NTN (National Tax Number)", "text", { placeholder: "1234567-8", section: "Profile" }),
      F("strn", "STRN (Sales Tax Registration)", "text", { placeholder: "12-34-5678-901-23", section: "Profile" }),
      F("address", "Address", "textarea", { placeholder: "Street address, area", section: "Profile" }),
      F("region", "Region", "text", { section: "Profile" }),
      F("area", "Area", "text", { section: "Profile" }),
      F("postalCode", "Postal Code", "text", { placeholder: "74000", section: "Profile" }),
      F("country", "Country", "text", { section: "Profile" }),
      F("creditLimit", "Credit Limit (PKR)", "number", { section: "Profile" }),
      F("creditDays", "Credit Days", "number", { section: "Profile" }),
      F("status", "Status", "select", { options: ["Active", "Inactive"], section: "Profile" }),
      F("salesPerson", "Default Sales Person", "text", { section: "Profile" }),
      F("notes", "Notes", "textarea", { placeholder: "Optional notes or additional information", section: "Profile" }),
    ],
    columns: [
      { key: "name", label: "Company Name" }, { key: "phone", label: "Phone" },
      { key: "city", label: "Region" }, { key: "creditLimit", label: "Credit Limit", money: true },
      { key: "status", label: "Status" },
    ],
  },
  "/master/vendors": {
    title: "Vendors", singular: "Vendor", collection: "vendors",
    description: "Manage suppliers, tax and payment terms.",
    fields: [
      F("name", "Vendor Name", "text", { required: true, placeholder: "Business/Company name", section: "Basic Information" }),
      F("vendorType", "Vendor Type", "select", { required: true, options: ["Supplier", "Manufacturer", "Distributor", "Service Provider"], section: "Basic Information" }),
      F("contactPerson", "Contact Person", "text", { placeholder: "Primary contact name", section: "Basic Information" }),
      F("email", "Email", "email", { placeholder: "vendor@example.com", section: "Basic Information" }),
      F("phone", "Phone", "tel", { placeholder: "Phone number", section: "Basic Information" }),
      F("mobile", "Mobile", "tel", { placeholder: "Mobile number", section: "Basic Information" }),
      F("address", "Address", "textarea", { placeholder: "Street address", section: "Address" }),
      F("city", "City", "text", { placeholder: "City", section: "Address" }),
      F("country", "Country", "text", { section: "Address" }),
      F("ntn", "NTN (National Tax Number)", "text", { placeholder: "NTN registration number", section: "Tax Information" }),
      F("gst", "GST Number", "text", { placeholder: "GST registration number", section: "Tax Information" }),
      F("wht", "WHT Applicable", "select", { options: ["No", "Yes — deduct withholding tax"], section: "Tax Information" }),
      F("bankName", "Bank Name", "text", { placeholder: "e.g., HBL, MCB, UBL", section: "Bank Details" }),
      F("accountNumber", "Account Number", "text", { placeholder: "Bank account number", section: "Bank Details" }),
      F("branch", "Branch", "text", { placeholder: "Branch name", section: "Bank Details" }),
      F("paymentTerms", "Payment Terms (Days)", "number", { section: "Payment Terms & Status" }),
      F("status", "Status", "select", { options: ["Active", "Inactive"], section: "Payment Terms & Status" }),
      F("notes", "Notes", "textarea", { placeholder: "Internal notes about this vendor…", section: "Payment Terms & Status" }),
    ],
    columns: [
      { key: "name", label: "Name" }, { key: "vendorType", label: "Type" },
      { key: "phone", label: "Phone" }, { key: "ntn", label: "NTN" }, { key: "status", label: "Status" },
    ],
  },
  "/master/banks": {
    title: "Bank Accounts", singular: "Bank", collection: "banks",
    description: "Manage company bank accounts.",
    fields: [
      F("name", "Bank Name", "text", { required: true, placeholder: "e.g., Habib Bank Limited", section: "Bank Information" }),
      F("branchName", "Branch Name", "text", { placeholder: "e.g., Gulberg Branch", section: "Bank Information" }),
      F("branchCode", "Branch Code", "text", { placeholder: "e.g., 0123", section: "Bank Information" }),
      F("accountType", "Account Type", "select", { required: true, options: ["Current Account", "Saving Account", "Term Deposit"], section: "Bank Information" }),
      F("accountNumber", "Account Number", "text", { required: true, placeholder: "Bank account number", section: "Account Details" }),
      F("accountTitle", "Account Title", "text", { required: true, placeholder: "Account holder name", section: "Account Details" }),
      F("iban", "IBAN", "text", { placeholder: "PK36HABB0000001123456702", section: "Account Details" }),
      F("swift", "SWIFT Code", "text", { placeholder: "HABORPKAXXX", section: "Account Details" }),
      F("status", "Status", "select", { options: ["Active", "Inactive"], section: "Settings" }),
      F("isDefault", "Default for payments", "select", { options: ["No", "Yes"], section: "Settings" }),
    ],
    columns: [
      { key: "name", label: "Bank" }, { key: "accountTitle", label: "Title" },
      { key: "accountNumber", label: "Account #" }, { key: "accountType", label: "Type" },
    ],
  },
  "/master/chart-of-inventory": {
    title: "Items / Products", singular: "Item", collection: "items",
    description: "Your product and inventory catalogue.",
    codeField: "code", codePrefix: "ITM-",
    fields: [
      F("code", "Item Code", "text", { required: true, section: "Item Details" }),
      F("name", "Item Name", "text", { required: true, section: "Item Details" }),
      F("barcode", "Barcode", "text", { section: "Item Details" }),
      F("category", "Category", "text", { section: "Item Details" }),
      F("unit", "Unit", "select", { options: ["PCS", "KG", "LTR", "BOX", "MTR", "SET"], section: "Item Details" }),
      F("purchasePrice", "Purchase Price", "number", { section: "Pricing" }),
      F("salePrice", "Sale Price", "number", { section: "Pricing" }),
      F("taxRate", "Tax Rate %", "number", { section: "Pricing" }),
      F("openingStock", "Opening Stock", "number", { section: "Stock" }),
      F("reorderLevel", "Reorder Level", "number", { section: "Stock" }),
    ],
    columns: [
      { key: "code", label: "Code" }, { key: "name", label: "Name" },
      { key: "category", label: "Category" }, { key: "salePrice", label: "Sale Price", money: true },
      { key: "openingStock", label: "Stock" },
    ],
  },
  "/master/inventory-locations": {
    title: "Inventory Locations", singular: "Location", collection: "locations",
    codeField: "code", codePrefix: "LOC-",
    fields: [
      F("code", "Location Code", "text"),
      F("locationType", "Location Type", "select", { options: ["Warehouse", "Shop", "Store", "Transit"] }),
      F("name", "Location Name", "text", { required: true }),
      F("address", "Address", "textarea"),
      F("city", "City"),
      F("contactPerson", "Contact Person"),
      F("contactPhone", "Contact Phone", "tel"),
      F("isDefault", "Default Location", "select", { options: ["No", "Yes"] }),
      F("status", "Status", "select", { options: ["Active", "Inactive"] }),
    ],
    columns: [{ key: "code", label: "Code" }, { key: "name", label: "Name" }, { key: "locationType", label: "Type" }, { key: "contactPerson", label: "In-charge" }],
  },
  "/master/employees": {
    title: "Employees", singular: "Employee", collection: "employees",
    codeField: "code", codePrefix: "EMP-",
    fields: [
      F("code", "Employee Code", "text", { section: "Basic Information" }),
      F("cnic", "CNIC", "text", { placeholder: "00000-0000000-0", section: "Basic Information" }),
      F("firstName", "First Name", "text", { required: true, placeholder: "Enter first name", section: "Basic Information" }),
      F("lastName", "Last Name", "text", { placeholder: "Enter last name", section: "Basic Information" }),
      F("phone", "Phone", "tel", { section: "Basic Information" }),
      F("email", "Email", "email", { section: "Basic Information" }),
      F("address", "Address", "textarea", { section: "Basic Information" }),
      F("city", "City", "text", { section: "Basic Information" }),
      F("department", "Department", "select", { options: ["Sales", "Accounts", "Operations", "Admin", "Production", "Store"], section: "Employment Details" }),
      F("designation", "Designation", "text", { section: "Employment Details" }),
      F("joiningDate", "Joining Date", "date", { section: "Employment Details" }),
      F("basicSalary", "Salary", "number", { section: "Employment Details" }),
      F("isSalesPerson", "Is a Sales Person", "select", { options: ["No", "Yes"], section: "Sales Person Settings" }),
      F("status", "Status", "select", { options: ["Active", "Inactive"], section: "Sales Person Settings" }),
    ],
    columns: [
      { key: "code", label: "Code" }, { key: "firstName", label: "First Name" }, { key: "lastName", label: "Last Name" },
      { key: "department", label: "Dept" }, { key: "basicSalary", label: "Salary", money: true }, { key: "status", label: "Status" },
    ],
  },
  "/master/regions": {
    title: "Regions", singular: "Region", collection: "regions",
    codeField: "code", codePrefix: "REG-",
    fields: [F("code", "Region Code", "text"), F("name", "Region Name", "text", { required: true }), F("description", "Description", "textarea")],
    columns: [{ key: "code", label: "Code" }, { key: "name", label: "Region" }, { key: "description", label: "Description" }],
  },
  "/master/jobs": {
    title: "Jobs / Projects", singular: "Job", collection: "jobs",
    codeField: "code", codePrefix: "JOB-",
    fields: [
      F("code", "Job Code", "text"),
      F("name", "Job / Project Name", "text", { required: true, placeholder: "Enter job/project name" }),
      F("customer", "Customer", "text", { placeholder: "Customer (optional)" }),
      F("status", "Status", "select", { options: ["Active", "On Hold", "Completed", "Cancelled"] }),
      F("startDate", "Start Date", "date"),
      F("endDate", "End Date", "date"),
      F("budget", "Budget Amount (PKR)", "number"),
      F("description", "Description", "textarea", { placeholder: "Enter job description" }),
    ],
    columns: [
      { key: "code", label: "Code" }, { key: "name", label: "Name" }, { key: "customer", label: "Customer" },
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
    ],
    columns: [{ key: "code", label: "Code" }, { key: "name", label: "Name" }, { key: "type", label: "Type" }],
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
};
