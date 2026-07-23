import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";

const PRIMARY = "#f97316";      // orange
const PRIMARY_DARK = "#ea580c"; // orange-600
const ACCENT = "#ec4899";       // pink

/**
 * SS ERP logo mark — a monogram tile with the brand indigo gradient
 * and an emerald accent. To use official artwork instead, drop it in
 * /public and point this component at an <img>.
 */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} role="img" aria-label={brand.fullName}>
      <defs>
        <linearGradient id="ss-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={PRIMARY} />
          <stop offset="1" stopColor={PRIMARY_DARK} />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ss-grad)" />
      <path d="M48 0 L48 17 L31 0 Z" fill={ACCENT} />
      <path d="M9 31 L15 28 L15 40 L9 43 Z" fill={ACCENT} opacity="0.95" />
      <text x="26" y="33" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="20" fill="#fff">
        {brand.wordmarkPrimary}
      </text>
    </svg>
  );
}

/** Full lockup: mark + wordmark. */
export function Logo({
  variant = "color", size = 40, className,
}: { variant?: "color" | "light"; size?: number; className?: string }) {
  const main = variant === "light" ? "text-white" : "text-slate-800";
  const sub = variant === "light" ? "text-white/75" : "text-slate-500";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <div className="leading-none">
        <div className={cn("text-lg font-extrabold tracking-tight", main)}>{brand.wordmarkPrimary}</div>
        <div className={cn("mt-0.5 text-[10px] font-semibold tracking-[0.28em]", sub)}>{brand.wordmarkAccent}</div>
      </div>
    </div>
  );
}
