"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Accessible dialog. `placement="right"` renders a side drawer (full-width on phones). */
export function Modal({ open, onClose, title, description, badge, children, footer, size = "md", placement = "center" }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl" };
  const drawer = placement === "right";

  return (
    <div className={cn("fixed inset-0 z-50 flex print:hidden", drawer ? "justify-end" : "items-center justify-center p-4")}>
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-full w-full flex-col bg-surface shadow-pop outline-none",
          drawer ? "h-full sm:max-w-md sm:border-l sm:border-line" : cn("max-h-full rounded-2xl", widths[size]),
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-7 sm:py-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display text-xl leading-tight font-semibold text-ink">{title}</h2>
              {badge}
            </div>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="-mt-1 -mr-2 rounded-lg p-2 text-muted hover:bg-cream-200 hover:text-ink">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-cream-50 px-5 py-4 sm:px-7 sm:py-5 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}
