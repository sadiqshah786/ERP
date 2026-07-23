import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "@/components/CommandPalette";
import { allRoutes } from "@/lib/navigation";

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();

  const title = useMemo(() => {
    if (location.pathname === "/") return "Dashboard";
    const match = allRoutes().find((r) => location.pathname.startsWith(r.path));
    return match?.label ?? "SS ERP";
  }, [location.pathname]);

  const subtitle = location.pathname === "/" ? "Last updated: just now" : undefined;

  // Global ⌘K / Ctrl+K to open search.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-64">
        <Topbar onMenu={() => setOpen(true)} onSearch={() => setPaletteOpen(true)} title={title} subtitle={subtitle} />
        <main className="mx-auto max-w-[1600px] p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
