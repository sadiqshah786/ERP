import { cn } from "@/lib/utils";

export function SettingsSection({
  icon, title, children, className,
}: { icon: React.ReactNode; title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border bg-card card-shadow", className)}>
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div>
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export function Field({ label, required, children, className }: {
  label: string; required?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-semibold text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}
