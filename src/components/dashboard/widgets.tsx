import { cn } from "@/lib/utils";

export function Gauge({ value, size = 120, label, sublabel, color }: {
  value: number; size?: number; label?: string; sublabel?: string; color?: string;
}) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;
  const col = color ?? (pct < 40 ? "hsl(0 72% 51%)" : pct < 70 ? "hsl(38 92% 50%)" : "hsl(142 71% 45%)");
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(220 13% 91%)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke}
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-extrabold">{label ?? value}</div>
        {sublabel && <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{sublabel}</div>}
      </div>
    </div>
  );
}

export function Meter({ label, value, color = "hsl(142 71% 45%)" }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, background: color }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold">{value}</span>
    </div>
  );
}

export function MiniGauge({ value, target, title, subtitle, ok }: {
  value: string; target: string; title: string; subtitle: string; ok?: boolean;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border p-4">
      <Gauge value={ok ? 80 : 20} size={84} label={value} color={ok ? "hsl(142 71% 45%)" : "hsl(0 72% 51%)"} />
      <div className="mt-2 text-center">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-[11px] text-muted-foreground">{subtitle}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">🎯 Target: {target}</div>
      </div>
    </div>
  );
}

export function StatBar({ label, value, color = "hsl(25 95% 53%)" }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, background: color }} />
      </div>
    </div>
  );
}

export function SectionCard({ title, subtitle, icon, action, children, className }: {
  title: string; subtitle?: string; icon?: React.ReactNode; action?: React.ReactNode;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border bg-card card-shadow", className)}>
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div>
          <div className="flex items-center gap-2 font-bold">{icon}{title}</div>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </div>
  );
}
