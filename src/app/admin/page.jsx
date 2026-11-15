"use client";

import { CHART_COLORS, ChartCard } from "@/components/charts/chartParts";
import { useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SeatStatCard } from "@/components/seats/SeatStatCard";
import { Button } from "@/components/ui/Button";
import { TrendChart } from "@/components/charts/TrendChart";
import { LiveOccupancyCard } from "@/app/admin/_components/LiveOccupancyCard";
import { RecentReservations } from "@/app/admin/_components/RecentReservations";
import { useAuth } from "@/context/AuthContext";
import { useLibrary } from "@/context/LibraryContext";
import { hourlyForDay, hourlyProfile } from "@/lib/analytics";
import { addDays, dateKeyOf, hourOfDay } from "@/lib/utils";

export default function OverviewPage() {
  const lib = useLibrary();
  const { user } = useAuth();
  const { seatCounts, reservationViews, occupancySessions, operatingHours, now, nowMs, monitoredSeats } = lib;
  const monitored = monitoredSeats.length;
  const today = dateKeyOf(nowMs);

  const trend = useMemo(() => {
    const base = { sessions: occupancySessions, monitoredSeats: monitored, operatingHours, nowMs };
    const todayRows = hourlyForDay({ ...base, dateKey: today });
    const typical = hourlyProfile({ ...base, range: { start: addDays(today, -30), end: addDays(today, -1) } });
    const currentHour = hourOfDay(nowMs);
    const pct = (v) => Math.round(v);
    const trend = typical.map((t) => {
      const row = todayRows.find((r) => r.hour === t.hour);
      return { label: t.label, typical: pct(t.occupancy), today: t.hour < currentHour && row ? pct(row.occupancy) : null };
    });
    return trend;
  }, [occupancySessions, monitored, operatingHours, nowMs, today]);

  const sensorsOnline = monitoredSeats.filter((s) => s.sensor.state === "ok").length;
  const activeReservations = reservationViews.filter((r) => r.status === "active").length;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${(user?.name ?? "").split(" ")[0]}`}
        description={lib.library.name}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <SeatStatCard label="Available" value={seatCounts.available} total={seatCounts.total} tone="ok" />
        <SeatStatCard label="Occupancy rate" value={`${seatCounts.occupancyRate}%`} suffix="of seats in use" tone="neutral" />
        <SeatStatCard label="Active reservations" value={activeReservations} suffix="holds now" tone="warn" />
        <SeatStatCard label="Sensors online" value={sensorsOnline} total={monitoredSeats.length} tone={sensorsOnline === monitoredSeats.length ? "ok" : "brand"} />
      </div>

      <div className="mt-6">
        <LiveOccupancyCard counts={seatCounts} />
      </div>

      <div className="mt-6">
        <ChartCard title="Occupancy today" description="Seats in use each hour today, compared with a typical day." action={<Button href="/admin/analytics" size="sm">Open analytics</Button>}>
          <TrendChart data={trend} height={260} series={[{ key: "today", name: "Today", color: CHART_COLORS.brand }, { key: "typical", name: "Typical", color: CHART_COLORS.neutral, type: "line" }]} />
        </ChartCard>
      </div>

      <div className="mt-6">
        <RecentReservations reservations={reservationViews.slice(0, 6)} now={now} />
      </div>
    </>
  );
}
