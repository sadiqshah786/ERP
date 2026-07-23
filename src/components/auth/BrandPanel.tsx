import {
  BookOpen, Package, ShoppingCart, FileText, Users, DollarSign,
  TrendingUp, Layers, Check,
} from "lucide-react";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("inline-block", className)}>
      <Logo variant="light" size={52} />
      <div className="mt-3 h-1 w-44 rounded-full bg-secondary" />
    </div>
  );
}

const moduleIcons: Record<string, React.ElementType> = {
  Accounting: BookOpen, Inventory: Package, "Point of Sale": ShoppingCart, Invoicing: FileText,
  "HR & Payroll": Users, Finance: DollarSign, Reports: TrendingUp, "Multi-Branch": Layers,
};

function ModuleChips({ wrap = false }: { wrap?: boolean }) {
  return (
    <div className={cn("flex gap-2.5", wrap ? "flex-wrap" : "flex-wrap")}>
      {brand.modules.map((m) => {
        const Icon = moduleIcons[m] ?? Layers;
        return (
          <span key={m} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-sm font-medium text-white/90 ring-1 ring-white/10">
            <Icon className="h-4 w-4" /> {m}
          </span>
        );
      })}
    </div>
  );
}

/** Login variant — tagline, modules, stats */
export function LoginBrandPanel() {
  return (
    <div className="relative flex flex-col justify-center gap-8 overflow-hidden bg-gradient-to-br from-[#f97316] via-[#f43f5e] to-[#db2777] p-10 text-white lg:p-12">
      <Wordmark />
      <div>
        <p className="text-sm text-white/70">Complete Business Management</p>
        <h2 className="mt-1 text-2xl font-bold lg:text-3xl">Accounting &amp; ERP Software</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">{brand.description}</p>
      </div>
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/50">Everything you need in one place</p>
        <ModuleChips />
      </div>
      <div className="border-t border-white/15 pt-6">
        <div className="flex gap-10">
          {brand.stats.map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-extrabold">{s.value}</div>
              <div className="text-[11px] uppercase tracking-wide text-white/60">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Signup variant — stepper + modules grid */
export function SignupBrandPanel({ step }: { step: 1 | 2 }) {
  const steps = [
    { n: 1, label: "Account Details" },
    { n: 2, label: "Verification" },
  ];
  return (
    <div className="relative flex flex-col gap-8 overflow-hidden bg-gradient-to-br from-[#f97316] via-[#f43f5e] to-[#db2777] p-10 text-white lg:p-12">
      <Wordmark />
      <div>
        <p className="text-sm text-white/70">Start Your Journey to</p>
        <h2 className="mt-1 text-2xl font-bold lg:text-3xl">Better Business Management</h2>
      </div>

      <div className="space-y-4">
        {steps.map((s) => {
          const done = step > s.n;
          const active = step === s.n;
          return (
            <div key={s.n} className="flex items-center gap-3">
              <div
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full text-sm font-bold transition-colors",
                  done ? "bg-secondary text-[#0a3a52]" : active ? "bg-white text-primary" : "bg-white/15 text-white/70"
                )}
              >
                {done ? <Check className="h-5 w-5" /> : s.n}
              </div>
              <span className={cn("font-semibold", active || done ? "text-white" : "text-white/60")}>{s.label}</span>
            </div>
          );
        })}
      </div>

      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/50">Modules included</p>
        <div className="grid max-w-sm grid-cols-2 gap-2.5">
          {brand.modules.map((m) => {
            const Icon = moduleIcons[m] ?? Layers;
            return (
              <span key={m} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-sm font-medium text-white/90 ring-1 ring-white/10">
                <Icon className="h-4 w-4" /> {m}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
