import { cn } from "@/lib/utils";

const BLUE = "#0a8dc7";
const BLUE_DARK = "#066a97";
const GREEN = "#9ed24d";

/**
 * Memon Solutions logo mark — an "MS" monogram tile with the brand
 * blue gradient and a green accent, echoing the official artwork.
 * To use the exact official artwork instead, drop it in /public and
 * point this component (or the sidebar/auth) at an <img>.
 */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} role="img" aria-label="Memon Solutions">
      <defs>
        <linearGradient id="ms-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={BLUE} />
          <stop offset="1" stopColor={BLUE_DARK} />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ms-grad)" />
      {/* green corner accent */}
      <path d="M48 0 L48 17 L31 0 Z" fill={GREEN} />
      {/* green leaf accent (lower-left), echoing the original */}
      <path d="M9 31 L15 28 L15 40 L9 43 Z" fill={GREEN} opacity="0.95" />
      <text
        x="26" y="33" textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="21" fill="#fff"
      >
        MS
      </text>
    </svg>
  );
}

/** Full lockup: mark + MEMON / SOLUTIONS wordmark. */
export function Logo({
  variant = "color", size = 40, className,
}: { variant?: "color" | "light"; size?: number; className?: string }) {
  const main = variant === "light" ? "text-white" : "text-slate-800";
  const sub = variant === "light" ? "text-white/75" : "text-slate-500";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <div className="leading-none">
        <div className={cn("text-lg font-extrabold tracking-tight", main)}>MEMON</div>
        <div className={cn("mt-0.5 text-[10px] font-semibold tracking-[0.28em]", sub)}>SOLUTIONS</div>
      </div>
    </div>
  );
}
