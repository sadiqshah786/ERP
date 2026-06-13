import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, LogOut, X } from "lucide-react";
import { navigation, NavGroup } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";

function useIsActive() {
  const location = useLocation();
  return (p?: string) => !!p && (p === "/" ? location.pathname === "/" : location.pathname.startsWith(p));
}

function Leaf({ label, path, onNavigate, isActive }: { label: string; path: string; onNavigate: () => void; isActive: (p?: string) => boolean }) {
  const active = isActive(path);
  return (
    <Link
      to={path}
      onClick={onNavigate}
      className={cn(
        "relative flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all",
        active
          ? "bg-white/15 font-semibold text-white shadow-sm ring-1 ring-white/10"
          : "text-sidebar-foreground hover:bg-white/10 hover:text-white"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full transition-all", active ? "bg-secondary" : "bg-white/25")} />
      {label}
    </Link>
  );
}

function GroupItem({
  group, open, onToggle, onNavigate,
}: { group: NavGroup; open: boolean; onToggle: () => void; onNavigate: () => void }) {
  const isActive = useIsActive();
  const [openSub, setOpenSub] = useState<string | null>(null);

  const groupActive =
    isActive(group.path) ||
    group.children?.some((c) => isActive(c.path)) ||
    group.groups?.some((sg) => sg.children.some((c) => isActive(c.path)));

  // Direct link (Dashboard)
  if (group.path && !group.children && !group.groups) {
    return (
      <Link
        to={group.path}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
          groupActive ? "bg-white/15 text-white shadow-sm ring-1 ring-white/10" : "text-sidebar-foreground hover:bg-white/10 hover:text-white"
        )}
      >
        <group.icon className="h-[18px] w-[18px]" />
        <span>{group.label}</span>
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
          open
            ? "bg-white/10 text-white"
            : groupActive
            ? "text-white"
            : "text-sidebar-foreground hover:bg-white/10 hover:text-white"
        )}
      >
        <span className="flex items-center gap-3">
          <group.icon className="h-[18px] w-[18px]" />
          {group.label}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {/* Inline nested dropdown */}
      {open && (
        <div className="mt-1 ml-4 space-y-0.5 border-l border-white/10 pl-3 animate-fade-in">
          {group.children?.map((c) => (
            <Leaf key={c.path} label={c.label} path={c.path} onNavigate={onNavigate} isActive={isActive} />
          ))}

          {group.groups?.map((sg) => {
            const subActive = sg.children.some((c) => isActive(c.path));
            const subOpen = openSub === sg.label || (subActive && openSub === null);
            return (
              <div key={sg.label}>
                <button
                  onClick={() => setOpenSub(subOpen ? "__none__" : sg.label)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] transition-colors",
                    subOpen ? "text-white" : "text-sidebar-foreground hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span>{sg.label}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", subOpen && "rotate-180")} />
                </button>
                {subOpen && (
                  <div className="ml-3 space-y-0.5 border-l border-white/10 pl-3 animate-fade-in">
                    {sg.children.map((c) => (
                      <Leaf key={c.path} label={c.label} path={c.path} onNavigate={onNavigate} isActive={isActive} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  // Auto-open the group that contains the active route.
  useEffect(() => {
    const active = navigation.find(
      (g) =>
        g.children?.some((c) => location.pathname.startsWith(c.path)) ||
        g.groups?.some((sg) => sg.children.some((c) => location.pathname.startsWith(c.path)))
    );
    if (active) setOpenGroup(active.label);
  }, [location.pathname]);

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar bg-gradient-to-b from-white/10 via-transparent to-black/25 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <Logo variant="light" size={38} />
          <button className="text-sidebar-foreground lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {navigation.map((g) => (
            <GroupItem
              key={g.label}
              group={g}
              open={openGroup === g.label}
              onToggle={() => setOpenGroup((cur) => (cur === g.label ? null : g.label))}
              onNavigate={onClose}
            />
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center justify-between rounded-lg px-2 py-2">
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">{user?.name ?? "User"}</div>
              <div className="text-[11px] text-sidebar-foreground">Admin</div>
            </div>
            <button onClick={signOut} className="rounded-md p-2 text-sidebar-foreground hover:bg-white/5 hover:text-white" title="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
