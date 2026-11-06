"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SeatStatCard } from "@/components/seats/SeatStatCard";
import { Card } from "@/components/ui/Card";
import { FilterSelect, SearchInput } from "@/components/ui/SearchInput";
import { SeatMap } from "@/app/admin/monitoring/SeatMap";
import { SeatDetails } from "@/components/seats/SeatDetails";
import { useLibrary } from "@/context/LibraryContext";

export default function MonitoringPage() {
  const { seatViews, seatCounts, floors } = useLibrary();
  const [search, setSearch] = useState("");
  const [floorId, setFloorId] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  const seats = useMemo(
    () =>
      seatViews.filter(
        (s) =>
          (floorId === "all" || s.floorId === floorId) &&
          (status === "all" || s.status === status) &&
          (!search.trim() || s.number.toLowerCase().includes(search.trim().toLowerCase())),
      ),
    [seatViews, floorId, status, search],
  );

  return (
    <>
      <PageHeader
        title="Live Monitoring"
        description="Seat status in real time."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-1"><SeatStatCard label="Total seats" value={seatCounts.total} total={seatCounts.total} suffix="seats" tone="neutral" /></div>
        <SeatStatCard label="Available" value={seatCounts.available} total={seatCounts.total} tone="ok" />
        <SeatStatCard label="Occupied" value={seatCounts.occupied} total={seatCounts.total} tone="brand" />
        <SeatStatCard label="Reserved" value={seatCounts.reserved} total={seatCounts.total} tone="warn" />
        <SeatStatCard label="Unavailable" value={seatCounts.unavailable} total={seatCounts.total} tone="neutral" />
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search seat number, e.g. A-01" label="Search by seat number" className="sm:min-w-56 sm:flex-1" />
          <FilterSelect label="Filter by floor" value={floorId} onChange={setFloorId} allLabel="All floors" options={floors.map((f) => ({ value: f.id, label: f.name }))} />
          <FilterSelect label="Filter by status" value={status} onChange={setStatus} allLabel="All statuses" options={["available", "occupied", "reserved", "unavailable"].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} />
        </div>
        <SeatMap bare seats={seats} selectedId={selectedId} onSelect={(s) => setSelectedId(s.id)} />
      </Card>

      <SeatDetails admin seatId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}
