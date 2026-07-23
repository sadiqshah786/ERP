// ─────────────────────────────────────────────────────────────
// Central brand config. Change these to re-skin the whole app.
// ─────────────────────────────────────────────────────────────
export const brand = {
  fullName: "SS ERP",
  shortName: "SS",
  // Wordmark parts (used in text fallbacks / footers / logo lockup)
  wordmarkPrimary: "SS",
  wordmarkAccent: "ERP",
  tagline: "Complete Accounting & ERP Software",
  description:
    "All-in-one solution for accounting, inventory, POS, invoicing, payroll and more — built for Pakistani businesses",
  modules: [
    "Accounting", "Inventory", "Point of Sale", "Invoicing",
    "HR & Payroll", "Finance", "Reports", "Multi-Branch",
  ],
  stats: [
    { value: "500+", label: "Businesses" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" },
  ],
};

// Common country dial codes for the WhatsApp field.
export const countryCodes = [
  { code: "+92", iso: "PK", name: "Pakistan" },
  { code: "+91", iso: "IN", name: "India" },
  { code: "+971", iso: "AE", name: "UAE" },
  { code: "+966", iso: "SA", name: "Saudi Arabia" },
  { code: "+1", iso: "US", name: "USA" },
  { code: "+44", iso: "GB", name: "UK" },
  { code: "+49", iso: "DE", name: "Germany" },
  { code: "+61", iso: "AU", name: "Australia" },
  { code: "+60", iso: "MY", name: "Malaysia" },
  { code: "+90", iso: "TR", name: "Turkey" },
  { code: "+880", iso: "BD", name: "Bangladesh" },
  { code: "+86", iso: "CN", name: "China" },
];
