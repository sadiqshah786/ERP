import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CrudPage } from "@/components/CrudPage";
import { DocumentPage } from "@/components/DocumentPage";
import { ReportPage } from "@/components/ReportPage";
import { SettingsPage } from "@/components/SettingsPage";
import { GenericModule } from "@/components/GenericModule";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { allRoutes, NavLeaf } from "@/lib/navigation";
import { masterConfigs } from "@/lib/schemas";
import { docConfigs } from "@/lib/docConfigs";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Auth = lazy(() => import("@/pages/Auth"));
const POS = lazy(() => import("@/pages/POS"));
const UsersRoles = lazy(() => import("@/pages/UsersRoles"));
const ChartOfAccounts = lazy(() => import("@/pages/ChartOfAccounts"));
const OpeningBalances = lazy(() => import("@/pages/OpeningBalances"));
const Customers = lazy(() => import("@/pages/master/Customers"));
const InventoryBalances = lazy(() => import("@/pages/reports/InventoryBalances"));
const TrialBalance = lazy(() => import("@/pages/reports/TrialBalance"));
const JournalReport = lazy(() => import("@/pages/reports/JournalReport"));
const LedgerReport = lazy(() => import("@/pages/reports/LedgerReport"));
const CompanySettings = lazy(() => import("@/pages/settings/CompanySettings"));
const FinancialYear = lazy(() => import("@/pages/settings/FinancialYear"));
const DocumentSettings = lazy(() => import("@/pages/settings/DocumentSettings"));
const InventorySettings = lazy(() => import("@/pages/settings/InventorySettings"));

function resolve(leaf: NavLeaf) {
  const { path, label } = leaf;
  if (path === "/pos") return <POS />;
  if (path === "/master/chart-of-accounts") return <ChartOfAccounts />;
  if (path === "/master/opening-balances") return <OpeningBalances />;
  if (path === "/master/customers") return <Customers />;
  if (path === "/settings/users") return <UsersRoles />;
  if (path === "/settings/company") return <CompanySettings />;
  if (path === "/settings/financial-year") return <FinancialYear />;
  if (path === "/settings/documents") return <DocumentSettings />;
  if (path === "/settings/inventory-movement") return <InventorySettings />;
  if (masterConfigs[path]) return <CrudPage config={masterConfigs[path]} />;
  if (docConfigs[path]) return <DocumentPage config={docConfigs[path]} />;
  if (path === "/reports/journal") return <JournalReport />;
  if (path === "/reports/ledger") return <LedgerReport />;
  if (path === "/reports/inventory-balances") return <InventoryBalances />;
  if (path === "/reports/low-stock-alert") return <InventoryBalances lowStockOnly />;
  if (path === "/reports/trial-balance") return <TrialBalance />;
  if (path.startsWith("/reports/")) return <ReportPage title={label} />;
  if (path.startsWith("/settings/")) return <SettingsPage path={path} title={label} />;
  return <GenericModule title={label} />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/login" element={<Auth initial="signin" />} />
        <Route path="/signup" element={<Auth initial="signup" />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          {allRoutes().map((leaf) => (
            <Route key={leaf.path} path={leaf.path} element={resolve(leaf)} />
          ))}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
