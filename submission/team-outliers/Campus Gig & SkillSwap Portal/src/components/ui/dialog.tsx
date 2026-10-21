import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
}: DialogProps) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    }
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Surface */}
      <div
        className={cn(
          "relative z-50 w-full overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl transition-all",
          maxWidthClasses[maxWidth]
        )}
      >
        <div className="flex items-start justify-between pb-4 border-b border-stone-100">
          <div>
            <h3 className="font-heading font-extrabold text-xl text-stone-900">{title}</h3>
            {description && <p className="text-xs text-stone-500 mt-1">{description}</p>}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="py-4 max-h-[75vh] overflow-y-auto">{children}</div>

        {footer && <div className="pt-4 border-t border-stone-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export { Dialog };
