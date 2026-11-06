"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toasts({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 left-4 z-[60] flex flex-col items-end gap-2 sm:left-auto print:hidden" role="status" aria-live="polite">
      {toasts.map((t) => {
        const Icon = t.tone === "error" ? AlertCircle : CheckCircle2;
        return (
          <div key={t.id} className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-pop">
            <Icon size={18} aria-hidden="true" className={cn("mt-0.5 shrink-0", t.tone === "error" ? "text-brand-600" : "text-ok-500")} />
            <p className="flex-1 text-sm text-ink">{t.message}</p>
            <button type="button" onClick={() => onDismiss(t.id)} aria-label="Dismiss notification" className="rounded p-0.5 text-muted hover:text-ink">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
