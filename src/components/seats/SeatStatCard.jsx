import { cn } from "@/lib/utils";

const VALUE = { ok: "text-ok-700", brand: "text-brand-700", warn: "text-warn-700", neutral: "text-ink" };

/** Text-only stat: label, big number and "of N". Pass `suffix` to override the "of N" text. */
export function SeatStatCard({ label, value, total, suffix, tone = "neutral" }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <p className="text-sm font-semibold text-ink-soft">{label}</p>
      <p className="mt-3 flex items-baseline gap-2">
        <span className={cn("font-display text-5xl leading-none font-medium tracking-tight", VALUE[tone])}>{value}</span>
        <span className="text-sm text-muted">{suffix ?? `of ${total}`}</span>
      </p>
    </div>
  );
}
