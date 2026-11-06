import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { STATUS_META } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

// Brighter, clearly different hues so the segments are easy to tell apart.
const BAR = { occupied: "bg-brand-600", reserved: "bg-warn-500", available: "bg-ok-500", unavailable: "bg-line-strong" };
const ORDER = ["occupied", "reserved", "available", "unavailable"];

/** One bar showing the split of every seat by status. */
export function LiveOccupancyCard({ counts }) {
  return (
    <Card>
      <CardHeader title="Live occupancy" description="Current state of every seat." action={<Button href="/admin/monitoring" size="sm">Open live monitoring</Button>} />
      <CardBody>
        <div className="flex h-3.5 overflow-hidden rounded-full bg-cream-200" role="img" aria-label={ORDER.map((s) => `${counts[s]} ${s}`).join(", ")}>
          {ORDER.map((s) => counts[s] > 0 && <div key={s} className={BAR[s]} style={{ width: `${(counts[s] / counts.total) * 100}%` }} />)}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px]">
          {ORDER.map((s) => (
            <li key={s} className="flex items-center gap-2 text-ink-soft">
              <span className={cn("h-2.5 w-2.5 rounded-full", BAR[s])} aria-hidden="true" />
              {STATUS_META[s].label} <strong className="text-ink">{counts[s]}</strong>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
