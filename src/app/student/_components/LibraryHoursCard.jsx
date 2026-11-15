"use client";

import { useEffect, useState } from "react";
import { HoursPopover } from "@/components/hours/HoursPopover";
import { useLibrary } from "@/context/LibraryContext";
import { libraryStatus } from "@/lib/hours";
import { cn, formatDate, formatTime, WEEKDAY_SHORT, weekdayOf } from "@/lib/utils";

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
    <div className="flex flex-col gap-3 sm:items-end lg:flex-row-reverse lg:gap-4">
      <div className="sm:text-right">
        <p className="font-display text-3xl font-medium tracking-tight tabular-nums text-ink sm:text-4xl">{formatTime(ms)}</p>
        <p className="mt-0.5 text-sm text-muted">{WEEKDAY_SHORT[today]}, {formatDate(ms)}</p>
      </div>
      <div className="flex h-10 w-fit items-center divide-x divide-line-strong rounded-lg border border-line-strong bg-cream-100 text-sm font-medium text-ink">
        <span className={cn("flex items-center gap-2 px-3", status.open ? "text-ok-700" : "text-warn-700")}>
          <span className={cn("h-2 w-2 rounded-full", status.open ? "bg-ok-500" : "bg-warn-500")} aria-hidden="true" />
          {status.open ? "Open" : "Closed"}
        </span>
        <span className="whitespace-nowrap px-3 text-ink-soft">{detail}</span>
        <span className="flex px-1.5"><HoursPopover hours={operatingHours} nowMs={ms} className="rounded-md px-1.5 py-1 hover:bg-cream-200 hover:no-underline" /></span>
      </div>
    </div>
  );
}
