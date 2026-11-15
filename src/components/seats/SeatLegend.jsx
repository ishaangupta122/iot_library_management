import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Available", dot: "bg-ok-700" },
  { label: "Occupied", dot: "bg-brand-700" },
  { label: "Reserved", dot: "bg-warn-700" },
];

export function SeatLegend({ large = false }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1.5" aria-label="Seat status legend">
      {ITEMS.map((l) => (
        <li key={l.label} className={cn("flex items-center gap-2 font-medium text-ink-soft", large ? "text-sm" : "text-[13px]")}>
          <span className={cn("rounded-full", large ? "h-3 w-3" : "h-2.5 w-2.5", l.dot)} aria-hidden="true" />
          {l.label}
        </li>
      ))}
    </ul>
  );
}
