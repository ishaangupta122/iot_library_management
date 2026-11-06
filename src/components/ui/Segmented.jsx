import { cn } from "@/lib/utils";

/** Small single-choice toggle group (tabs / granularity / presets). */
export function Segmented({ value, onChange, options, label, className }) {
  return (
    <div role="group" aria-label={label} className={cn("inline-flex rounded-lg border border-line-strong bg-surface p-0.5", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors",
            value === opt.value ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:text-ink",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
