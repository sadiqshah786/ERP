import * as React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
interface Toast { id: number; title: string; description?: string; type: ToastType }

interface ToastCtx {
  toast: (t: { title: string; description?: string; type?: ToastType }) => void;
}
const Ctx = React.createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
  return React.useContext(Ctx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const idRef = React.useRef(0);

  const toast = React.useCallback((t: { title: string; description?: string; type?: ToastType }) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, type: "info", ...t }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3800);
  }, []);

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-success" />,
    error: <AlertTriangle className="h-5 w-5 text-destructive" />,
    info: <Info className="h-5 w-5 text-primary" />,
  };

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-5 right-5 z-[100] flex w-80 flex-col gap-2">
          {toasts.map((t) => (
            <div key={t.id} className={cn("flex items-start gap-3 rounded-xl border bg-card p-4 card-shadow-lg animate-fade-in")}>
              {icons[t.type]}
              <div className="flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
              </div>
              <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </Ctx.Provider>
  );
}
