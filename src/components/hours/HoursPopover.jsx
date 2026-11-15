"use client";

import { ChevronDown } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { clock, is24h } from "@/lib/hours";
import { cn, formatDate, WEEKDAY_LONG, WEEKDAY_SHORT, weekdayOf } from "@/lib/utils";

const WEEK = [1, 2, 3, 4, 5, 6, 0];
const hoursText = (h) => (!h || h.closed ? "Closed" : is24h(h) ? "Open 24 hours" : `${clock(h.open)} – ${clock(h.close)}`);

export function HoursPopover({ hours, nowMs, status, showDate = false, className }) {
  const today = weekdayOf(nowMs);
  return (
    <Popover
      label="Opening hours"
      width="w-72"
      trigger={({ open, toggle, props }) => (
        <button type="button" onClick={toggle} {...props} className={cn("inline-flex items-center gap-1 font-medium text-ink underline-offset-4 hover:underline", className)}>
          Hours <ChevronDown size={15} aria-hidden="true" className={cn("transition-transform", open && "rotate-180")} />
        </button>
      )}
    >
      <div className="p-4 text-left">
        {showDate && (
          <div className="mb-3 border-b border-line pb-3">
            <p className="text-sm font-semibold text-ink">{WEEKDAY_SHORT[today]}, {formatDate(nowMs)}</p>
            {status && <p className="text-sm text-muted">{status.text}</p>}
          </div>
        )}
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Opening hours</p>
        <dl className="space-y-1.5">
          {WEEK.map((day) => {
            const h = hours.find((x) => x.day === day);
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
  );
}
