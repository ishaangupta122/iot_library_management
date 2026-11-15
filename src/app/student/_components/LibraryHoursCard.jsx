"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { useLibrary } from "@/context/LibraryContext";
import { clock, is24h, libraryStatus } from "@/lib/hours";
import { cn, formatDate, formatTime, WEEKDAY_LONG, WEEKDAY_SHORT, weekdayOf } from "@/lib/utils";

const WEEK = [1, 2, 3, 4, 5, 6, 0];
const hoursText = (h) => (!h || h.closed ? "Closed" : is24h(h) ? "Open 24 hours" : `${clock(h.open)} – ${clock(h.close)}`);

export function LibraryHoursCard() {
  const { operatingHours } = useLibrary();
  const [ms, setMs] = useState(null);
  useEffect(() => {
    setMs(Date.now());
    const id = setInterval(() => setMs(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  if (ms === null) return <div className="h-[68px] sm:w-64" aria-hidden="true" />;

  const today = weekdayOf(ms);
  const status = libraryStatus(operatingHours, ms);
  const rest = status.text.replace(/^(Open now|Closed) · /, "");
  const detail = rest.charAt(0).toUpperCase() + rest.slice(1);

  return (
    <div className="flex flex-col sm:items-end sm:text-right">
      <p className="flex items-center gap-3 sm:flex-row-reverse">
        <span className="font-display text-3xl font-medium tracking-tight tabular-nums text-ink sm:text-4xl">{formatTime(ms)}</span>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", status.open ? "border-ok-100 bg-ok-50 text-ok-700" : "border-line bg-cream-100 text-ink-soft")}>
          <span className={cn("h-2 w-2 rounded-full", status.open ? "bg-ok-500" : "bg-muted")} aria-hidden="true" />
          {status.open ? "Open" : "Closed"}
        </span>
      </p>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-muted sm:justify-end sm:text-base">
        <span>{WEEKDAY_SHORT[today]}, {formatDate(ms)}</span>
        <span aria-hidden="true">·</span>
        <span>{detail}</span>
        <span aria-hidden="true">·</span>
        <Popover
          label="Opening hours"
          width="w-72"
          trigger={({ open, toggle, props }) => (
            <button type="button" onClick={toggle} {...props} className="inline-flex items-center gap-1 font-medium text-ink underline-offset-4 hover:underline">
              Hours <ChevronDown size={15} aria-hidden="true" className={cn("transition-transform", open && "rotate-180")} />
            </button>
          )}
        >
          <div className="p-4 text-left">
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Opening hours</p>
            <dl className="space-y-1.5">
              {WEEK.map((day) => {
                const h = operatingHours.find((x) => x.day === day);
                return (
                  <div key={day} className={cn("flex justify-between gap-4 text-sm", day === today ? "font-semibold text-ink" : "text-ink-soft")}>
                    <dt>{WEEKDAY_LONG[day]}{day === today && <span className="ml-1.5 text-xs font-medium text-muted">(today)</span>}</dt>
                    <dd className="tabular-nums">{hoursText(h)}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </Popover>
      </div>
    </div>
  );
}
