"use client";

import { useMemo } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Pill } from "@/components/ui/StatusBadge";
import { ChartCard } from "@/components/charts/ChartCard";
import { BarsChart } from "@/components/charts/BarsChart";
import { useLibrary } from "@/context/LibraryContext";
import { dailyOccupancy, hourlyProfile, weekdayProfile } from "@/lib/analytics";
import { addDays, dateKeyOf } from "@/lib/utils";

const TREND_DAYS = 30;

/** Historical (not live) patterns to help choose when to visit. */
export function UsageTrends() {
  const { seatViews, occupancySessions, operatingHours, nowMs } = useLibrary();
  const minute = Math.floor(nowMs / 60_000);

  const t = useMemo(() => {
    const monitoredSeats = seatViews.filter((s) => s.deviceId).length;
    const today = dateKeyOf(nowMs);
    const range = { start: addDays(today, -TREND_DAYS), end: addDays(today, -1) };
    const base = { sessions: occupancySessions, monitoredSeats, operatingHours, range, nowMs };
    const hourly = hourlyProfile(base);
    const byOcc = [...hourly].sort((a, b) => a.occupancy - b.occupancy);
    const weekdays = weekdayProfile(dailyOccupancy(base));
    const dayOrder = weekdays.map((d) => d.label);
    const byDay = [...weekdays].sort((a, b) => a.occupancy - b.occupancy);
    const inWeekOrder = (days) => [...days].sort((a, b) => dayOrder.indexOf(a.label) - dayOrder.indexOf(b.label));
    return {
      hourly,
      quiet: byOcc.slice(0, 3).sort((a, b) => a.hour - b.hour),
      peak: byOcc.slice(-3).sort((a, b) => a.hour - b.hour),
      quietDays: inWeekOrder(byDay.slice(0, 2)),
      peakDays: inWeekOrder(byDay.slice(-2)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seatViews.length, occupancySessions, operatingHours, minute]);

  return (
    <section aria-labelledby="trends-title">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 id="trends-title" className="font-display text-xl font-medium">Best time to visit</h2>
        <Pill tone="warn">Based on the last {TREND_DAYS} days</Pill>
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <ChartCard className="h-full lg:col-span-3" title="Typical occupancy by hour">
          <BarsChart data={t.hourly} bars={[{ key: "occupancy", name: "Typically occupied", color: "rgba(156, 48, 43, 0.24)" }]} unit="%" yMax={100} highlightMax highlightColor="#9c302b" height={220} />
        </ChartCard>

        <Card className="flex h-full flex-col lg:col-span-2">
          <CardHeader title="Quietest and busiest times" />
          <ul className="flex flex-1 flex-col px-5 pt-3 pb-3 sm:px-6">
            <TimeRow tone="ok" label="Quietest hours" items={t.quiet.map((h) => h.label)} />
            <TimeRow tone="brand" label="Busiest hours" items={t.peak.map((h) => h.label)} />
            <TimeRow tone="ok" label="Quietest days" items={t.quietDays.map((d) => d.label)} />
            <TimeRow tone="brand" label="Busiest days" items={t.peakDays.map((d) => d.label)} />
          </ul>
        </Card>
      </div>
    </section>
  );
}

const DOT = { ok: "bg-ok-700", brand: "bg-brand-700" };

/** One label/value row; a coloured dot marks quiet (green) vs busy (red). */
function TimeRow({ tone, label, items }) {
  return (
    <li className="flex flex-1 items-center justify-between gap-4 border-b border-line py-2 last:border-b-0">
      <span className="flex items-center gap-2.5 text-sm font-medium text-ink-soft"><span className={`h-2.5 w-2.5 rounded-full ${DOT[tone]}`} aria-hidden="true" />{label}</span>
      <span className="text-right font-display text-xl font-medium text-ink">{items.join(", ")}</span>
    </li>
  );
}
