"use client";

import { useEffect, useState } from "react";
import { HoursPopover } from "@/components/hours/HoursPopover";
import { useLibrary } from "@/context/LibraryContext";
import { libraryStatus } from "@/lib/hours";
import { cn, formatTime } from "@/lib/utils";

export function LibraryClock() {
  const { operatingHours } = useLibrary();
  const [ms, setMs] = useState(null);
  useEffect(() => {
    setMs(Date.now());
    const id = setInterval(() => setMs(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);
  if (ms === null) return null;
  const status = libraryStatus(operatingHours, ms);
  return (
    <div className="flex h-10 shrink-0 items-center divide-x divide-line-strong rounded-lg border border-line-strong bg-cream-100 text-sm font-medium text-ink" title={status.text}>
      <span className={cn("flex items-center gap-2 px-3", status.open ? "text-ok-700" : "text-warn-700")}>
        <span className={cn("h-2 w-2 rounded-full", status.open ? "bg-ok-500" : "bg-warn-500")} aria-hidden="true" />
        {status.open ? "Open" : "Closed"}
      </span>
      <span className="hidden px-3 tabular-nums sm:inline">{formatTime(ms)}</span>
      <span className="hidden px-1.5 md:flex"><HoursPopover hours={operatingHours} nowMs={ms} status={status} showDate className="rounded-md px-1.5 py-1 hover:bg-cream-200 hover:no-underline" /></span>
    </div>
  );
}
