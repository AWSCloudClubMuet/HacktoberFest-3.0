import { ConvexError } from "convex/values";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Toast = { id: number; kind: "ok" | "error"; text: string; leaving?: boolean };

const ToastContext = createContext<{
  push: (kind: Toast["kind"], text: string) => void;
} | null>(null);

const TOAST_MS = 4500;
const TOAST_EXIT_MS = 150;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x))), TOAST_MS);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), TOAST_MS + TOAST_EXIT_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-96 flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            data-leaving={t.leaving || undefined}
            className="toast pointer-events-auto flex items-start gap-3 rounded-xl border border-transparent bg-ink px-4 py-3 text-sm leading-5 text-white shadow-pop"
          >
            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${t.kind === "error" ? "bg-alert" : "bg-ok"}`} />
            <span className="flex-1">{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export function errorMessage(err: unknown) {
  if (err instanceof ConvexError) return String(err.data);
  if (err instanceof Error) {
    // Strip Convex's request-id prefix and stack noise from server errors.
    const match = err.message.match(/Uncaught (?:Convex)?Error: (.*?)(?:\n|\s+at |$)/);
    return match ? match[1] : err.message;
  }
  return "Something went wrong";
}

/** Runs a mutation, shows a toast either way, and reports whether it worked. */
export function useRun() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useRun must be used inside ToastProvider");
  return useCallback(
    async <T,>(work: Promise<T>, success?: string): Promise<boolean> => {
      try {
        await work;
        if (success) ctx.push("ok", success);
        return true;
      } catch (err) {
        ctx.push("error", errorMessage(err));
        return false;
      }
    },
    [ctx],
  );
}
