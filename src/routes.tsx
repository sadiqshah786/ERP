import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CrudPage } from "@/components/CrudPage";
import { DocumentPage } from "@/components/DocumentPage";
import { ReportPage } from "@/components/ReportPage";
import { SettingsPage } from "@/components/SettingsPage";
import { GenericModule } from "@/components/GenericModule";
import { allRoutes, NavLeaf } from "@/lib/navigation";
import { masterConfigs } from "@/lib/schemas";
import { docConfigs } from "@/lib/docConfigs";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Auth = lazy(() => import("@/pages/Auth"));
const POS = lazy(() => import("@/pages/POS"));
const UsersRoles = lazy(() => import("@/pages/UsersRoles"));
const CompanySettings = lazy(() => import("@/pages/settings/CompanySettings"));
const FinancialYear = lazy(() => import("@/pages/settings/FinancialYear"));
const DocumentSettings = lazy(() => import("@/pages/settings/DocumentSettings"));

function resolve(leaf: NavLeaf) {
  const { path, label } = leaf;
  if (path === "/pos") return <POS />;
  if (path === "/settings/users") return <UsersRoles />;
  if (path === "/settings/company") return <CompanySettings />;
  if (path === "/settings/financial-year") return <FinancialYear />;
  if (path === "/settings/documents") return <DocumentSettings />;
  if (masterConfigs[path]) return <CrudPage config={masterConfigs[path]} />;
  if (docConfigs[path]) return <DocumentPage config={docConfigs[path]} />;
  if (path.startsWith("/reports/")) return <ReportPage title={label} />;
  if (path.startsWith("/settings/")) return <SettingsPage path={path} title={label} />;
  return <GenericModule title={label} />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>}>
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
