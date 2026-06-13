import { Menu, Search, Bell, Moon, Sun, RefreshCw, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export function Topbar({
  onMenu, onSearch, title, subtitle,
}: { onMenu: () => void; onSearch: () => void; title: string; subtitle?: string }) {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur-md lg:px-6">
      <button className="rounded-md p-2 hover:bg-muted lg:hidden" onClick={onMenu}>
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold leading-tight md:text-lg">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      {/* Search trigger */}
      <button
        onClick={onSearch}
        className="hidden items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted md:flex"
      >
        <Search className="h-4 w-4" />
        <span>Search…</span>
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onSearch} className="md:hidden" title="Search"><Search className="h-[18px] w-[18px]" /></Button>
        <Button variant="ghost" size="icon" onClick={toggle} title="Toggle theme">
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => location.reload()} title="Refresh"><RefreshCw className="h-[18px] w-[18px]" /></Button>
        <Button variant="ghost" size="icon" title="Notifications"><Bell className="h-[18px] w-[18px]" /></Button>
      </div>

      <div className="flex items-center gap-3 border-l pl-3">
        <div className="hidden text-right leading-tight sm:block">
          <div className="text-sm font-semibold">{user?.name ?? "User"}</div>
          <div className="text-[11px] text-muted-foreground">Admin</div>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-white">
          {(user?.name ?? "U").charAt(0).toUpperCase()}
        </div>
        <Button variant="outline" size="sm" onClick={signOut} className="hidden md:inline-flex">
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>
    </header>
  );
}
