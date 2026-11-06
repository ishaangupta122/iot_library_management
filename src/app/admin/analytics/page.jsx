"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { SeatStatCard } from "@/components/seats/SeatStatCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { TrendChart } from "@/components/charts/TrendChart";
import { BarsChart } from "@/components/charts/BarsChart";
import { CHART_COLORS } from "@/components/charts/chartTheme";
import { useLibrary } from "@/context/LibraryContext";
import { avgSessionByWeekday, bucketTrend, dailyOccupancy, durationStats, hourlyForDay, hourlyProfile, sessionsInRange, weekdayProfile } from "@/lib/analytics";
import { addDays, dateKeyOf, formatDuration } from "@/lib/utils";

// One filter sets both the date range and how the trend is grouped.
const PERIODS = [
  { value: "today", label: "Today", days: 1, group: "hourly" },
  { value: "7d", label: "7 days", days: 7, group: "daily" },
  { value: "30d", label: "30 days", days: 30, group: "daily" },
  { value: "90d", label: "90 days", days: 90, group: "weekly" },
];

export default function AnalyticsPage() {
  const { seatViews, occupancySessions, operatingHours, nowMs } = useLibrary();
  const [period, setPeriod] = useState("30d");
  const { days, group } = PERIODS.find((p) => p.value === period);

  const a = useMemo(() => {
    const today = dateKeyOf(nowMs);
    const range = { start: addDays(today, -(days - 1)), end: today };
    const monitored = seatViews.filter((s) => s.deviceId);
    const base = { sessions: occupancySessions, monitoredSeats: monitored.length, operatingHours, range, nowMs };
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
  }, [seatViews, occupancySessions, operatingHours, days, group, nowMs]);

  // A single day has no "busiest day", so those parts only appear for a week or more.
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
        <ChartCard title="Occupancy over time">
          <TrendChart data={a.trend} series={[{ key: "occupancy", name: "Occupancy", color: CHART_COLORS.brand }]} />
        </ChartCard>

        <div className={`grid gap-6 ${showDays ? "lg:grid-cols-2" : ""}`}>
          <ChartCard title="Peak usage hours">
            <BarsChart data={a.hourly} bars={bar} unit="%" yMax={100} highlightMax height={240} />
          </ChartCard>
          {showDays && (
            <ChartCard title="Busiest days">
              <BarsChart data={a.weekdays} bars={bar} unit="%" yMax={100} highlightMax height={240} />
            </ChartCard>
          )}
        </div>

        {showDays && (
          <ChartCard title="Average session time by day">
            <BarsChart data={a.sessionByDay} horizontal bars={[{ key: "minutes", name: "Average session", color: CHART_COLORS.brandSoft }]} unit="m" highlightMax height={300} />
          </ChartCard>
        )}
      </div>
    </>
  );
}
