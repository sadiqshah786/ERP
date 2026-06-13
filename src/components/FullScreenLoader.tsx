import { LogoMark } from "@/components/Logo";

export function FullScreenLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="flex flex-col items-center gap-5">
        <div className="animate-pulse">
          <LogoMark size={56} />
        </div>
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-muted border-t-primary" />
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
