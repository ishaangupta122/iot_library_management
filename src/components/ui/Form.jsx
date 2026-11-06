"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

const controlClasses =
  "w-full rounded-lg border bg-surface px-3 text-sm text-ink placeholder:text-muted/80 transition-colors disabled:bg-cream-100 disabled:text-muted";

/** Label + control + hint/error wiring in one place. `children` receives the aria props. */
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

export function Select({ error, className, children, ...props }) {
  return (
    <select className={cn(controlClasses, "h-10 pr-8", error ? "border-brand-500" : "border-line-strong", className)} {...props}>
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label, description, disabled }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-brand-600" : "bg-line-strong",
        )}
      >
        <span className={cn("absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform", checked && "translate-x-5")} />
      </button>
    </div>
  );
}
