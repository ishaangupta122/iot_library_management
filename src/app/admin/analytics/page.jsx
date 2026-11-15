"use client";

import { CHART_COLORS, ChartCard } from "@/components/charts/chartParts";
import { useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { SeatStatCard } from "@/components/seats/SeatStatCard";
import { TrendChart } from "@/components/charts/TrendChart";
import { BarsChart } from "@/components/charts/BarsChart";
import { useLibrary } from "@/context/LibraryContext";
import { usePersistentState } from "@/lib/usePersistentState";
import { avgSessionByWeekday, bucketTrend, dailyOccupancy, durationStats, historyRange, hourlyForDay, hourlyProfile, sessionsInRange, weekdayProfile } from "@/lib/analytics";
import { dateKeyOf, formatDuration } from "@/lib/utils";

const PERIODS = [
  { value: "today", label: "Today", days: 1, group: "hourly" },
  { value: "7d", label: "7 days", days: 7, group: "daily" },
  { value: "30d", label: "30 days", days: 30, group: "daily" },
];

export default function AnalyticsPage() {
  const { monitoredSeats, occupancySessions, operatingHours, nowMs } = useLibrary();
  const [period, setPeriod] = usePersistentState("analytics:period", "30d", (v) => PERIODS.some((p) => p.value === v));
  const { days, group } = PERIODS.find((p) => p.value === period);

  const a = useMemo(() => {
    const today = dateKeyOf(nowMs);
    const range = historyRange(occupancySessions, today, days);
    const base = { sessions: occupancySessions, monitoredSeats: monitoredSeats.length, operatingHours, range, nowMs };
    const daily = dailyOccupancy(base);
    const hourly = hourlyProfile(base);
    const weekdays = weekdayProfile(daily);
    const totals = daily.reduce((t, d) => ({ occ: t.occ + d.occupiedMin, cap: t.cap + d.capacityMin }), { occ: 0, cap: 0 });
    const top = (rows) => rows.reduce((b, p) => (p.occupancy > b.occupancy ? p : b), rows[0] ?? { label: "—", occupancy: 0 });
    return {
      trend: group === "hourly" ? hourlyForDay({ ...base, dateKey: today }) : bucketTrend(daily, group),
      hourly,
      weekdays,
      duration: durationStats(sessionsInRange(occupancySessions, range), nowMs),
      sessionByDay: avgSessionByWeekday(sessionsInRange(occupancySessions, range), nowMs),
      avgOccupancy: totals.cap ? Math.round((totals.occ / totals.cap) * 100) : 0,
      peak: top(hourly),
      busiest: top(weekdays),
    };
  }, [monitoredSeats, occupancySessions, operatingHours, days, group, nowMs]);

  const showDays = days >= 7;
  const bar = [{ key: "occupancy", name: "Occupancy", color: CHART_COLORS.brandSoft }];

  return (
    <>
      <PageHeader
        title="Usage Analytics"
        description="How seats are used."
        actions={<Segmented label="Period" value={period} onChange={setPeriod} options={PERIODS} />}
      />

      <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${showDays ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        <SeatStatCard label="Average occupancy" value={`${a.avgOccupancy}%`} suffix="of seat-hours" tone="neutral" />
        <SeatStatCard label="Peak hour" value={a.peak.label} suffix={`${Math.round(a.peak.occupancy)}% full`} tone="neutral" />
        {showDays && <SeatStatCard label="Busiest day" value={a.busiest.label} suffix={`${Math.round(a.busiest.occupancy)}% full`} tone="neutral" />}
        <SeatStatCard label="Average session" value={formatDuration(a.duration.averageMin)} suffix="per visit" tone="neutral" />
      </div>

      <div className="mt-6 space-y-6">
        <ChartCard title="Occupancy over time" description="Share of seat time in use for each period, during opening hours.">
          <TrendChart data={a.trend} series={[{ key: "occupancy", name: "Occupancy", color: CHART_COLORS.brand }]} />
        </ChartCard>

        <div className={`grid gap-6 ${showDays ? "lg:grid-cols-2" : ""}`}>
          <ChartCard title="Peak usage hours" description="Average share of seats in use at each hour of the day.">
            <BarsChart data={a.hourly} bars={bar} unit="%" yMax={100} highlightMax height={240} />
          </ChartCard>
          {showDays && (
            <ChartCard title="Busiest days" description="Average share of seats in use on each day of the week.">
              <BarsChart data={a.weekdays} bars={bar} unit="%" yMax={100} highlightMax height={240} />
            </ChartCard>
          )}
        </div>

        {showDays && (
          <ChartCard title="Average session time by day" description="How long students typically stay, by the day they arrived.">
            <BarsChart data={a.sessionByDay} horizontal bars={[{ key: "minutes", name: "Average session", color: CHART_COLORS.brandSoft }]} unit="m" highlightMax height={300} />
          </ChartCard>
        )}
      </div>
    </>
  );
}
