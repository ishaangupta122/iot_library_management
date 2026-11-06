import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchInput({ value, onChange, placeholder, label = "Search", className }) {
  return (
    <div className={cn("relative", className)}>
      <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-10 w-full rounded-lg border border-line-strong bg-surface pr-3 pl-9 text-sm text-ink placeholder:text-muted/80"
      />
    </div>
  );
}

/** Compact labelled select used in filter bars. */
export function FilterSelect({ label, value, onChange, options, allLabel }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-lg border border-line-strong bg-surface px-3 pr-8 text-sm text-ink sm:w-auto"
    >
      <option value="all">{allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
