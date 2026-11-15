"use client";

import { useMemo } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Pill } from "@/components/ui/StatusBadge";
import { ChartCard } from "@/components/charts/chartParts";
import { BarsChart } from "@/components/charts/BarsChart";
import { useLibrary } from "@/context/LibraryContext";
import { CONFIG } from "@/config";
import { dailyOccupancy, historyRange, hourlyProfile, sessionsInRange, weekdayProfile } from "@/lib/analytics";
import { daysBetween, dateKeyOf, WEEKDAY_SHORT } from "@/lib/utils";

const TREND_DAYS = CONFIG.history.studentTrendDays;

export function UsageTrends() {
  const { monitoredSeats, occupancySessions, operatingHours, nowMs } = useLibrary();
  const minute = Math.floor(nowMs / 60_000);

  const t = useMemo(() => {
    const today = dateKeyOf(nowMs);
    const range = historyRange(occupancySessions, today, TREND_DAYS);
    const base = { sessions: occupancySessions, monitoredSeats: monitoredSeats.length, operatingHours, range, nowMs };
    const hourly = hourlyProfile(base);
    const byOcc = [...hourly].sort((a, b) => a.occupancy - b.occupancy);
    const daily = dailyOccupancy(base);
    const seen = new Set(daily.map((d) => WEEKDAY_SHORT[d.weekday]));
    const weekdays = weekdayProfile(daily).filter((d) => seen.has(d.label));
    const dayOrder = weekdays.map((d) => d.label);
    const byDay = [...weekdays].sort((a, b) => a.occupancy - b.occupancy);
    const inWeekOrder = (days) => [...days].sort((a, b) => dayOrder.indexOf(a.label) - dayOrder.indexOf(b.label));
    return {
      days: daysBetween(range.start, range.end) + 1,
      hasData: sessionsInRange(occupancySessions, range).length > 0,
      hourly,
      quiet: byOcc.slice(0, 3).sort((a, b) => a.hour - b.hour),
      peak: byOcc.slice(-3).sort((a, b) => a.hour - b.hour),
      quietDays: inWeekOrder(byDay.slice(0, 2)),
      peakDays: inWeekOrder(byDay.slice(-2)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monitoredSeats.length, occupancySessions, operatingHours, minute]);

  return (
    <section aria-labelledby="trends-title">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 id="trends-title" className="font-display text-xl font-medium">Best time to visit</h2>
        <Pill tone="warn">{t.days >= TREND_DAYS ? `Based on the last ${TREND_DAYS} days` : `Based on ${t.days} day${t.days === 1 ? "" : "s"} of data`}</Pill>
      </div>
      {!t.hasData ? (
        <Card className="px-5 py-8 text-center text-sm text-muted sm:px-6">Not enough data yet. Usage patterns appear here once seats have been used during opening hours.</Card>
      ) : (
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
      )}
    </section>
  );
}

const DOT = { ok: "bg-ok-700", brand: "bg-brand-700" };

function TimeRow({ tone, label, items }) {
  return (
    <li className="flex flex-1 items-center justify-between gap-4 border-b border-line py-2 last:border-b-0">
      <span className="flex items-center gap-2.5 text-sm font-medium text-ink-soft"><span className={`h-2.5 w-2.5 rounded-full ${DOT[tone]}`} aria-hidden="true" />{label}</span>
      <span className="text-right font-display text-xl font-medium text-ink">{items.join(", ")}</span>
    </li>
  );
}
