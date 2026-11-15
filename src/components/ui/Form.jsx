"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

const controlClasses =
  "w-full rounded-lg border bg-surface px-3 text-sm text-ink placeholder:text-muted/80 transition-colors disabled:bg-cream-100 disabled:text-muted";

export function Field({ label, hint, error, required, className, children }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink">
        {label}
        {required && <span className="text-brand-600" aria-hidden="true"> *</span>}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-brand-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ error, className, ...props }) {
  return <input className={cn(controlClasses, "h-10", error ? "border-brand-500" : "border-line-strong", className)} {...props} />;
}
