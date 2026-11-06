"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SeatStatCard } from "@/components/seats/SeatStatCard";
import { FilterBar } from "@/components/ui/FilterBar";
import { FilterSelect, SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/ui/DataTable";
import { useLibrary } from "@/context/LibraryContext";
import { formatDateTime } from "@/lib/utils";

export default function ReservationsPage() {
  const { reservationViews } = useLibrary();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  // Cancelled holds are not part of this view.
  const inRange = useMemo(() => reservationViews.filter((r) => r.status !== "cancelled"), [reservationViews]);
  const counts = useMemo(() => {
    const c = { active: 0, completed: 0, expired: 0 };
    inRange.forEach((r) => (c[r.status] += 1));
    return c;
  }, [inRange]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inRange.filter((r) => (status === "all" || r.status === status) && (!q || [r.id, r.seat?.number, r.studentName, r.studentId].some((v) => v?.toLowerCase().includes(q))));
  }, [inRange, search, status]);

  const columns = [
    { key: "id", header: "Reservation", sortable: true, render: (r) => <span className="font-semibold">{r.id}</span> },
    { key: "seat", header: "Seat", sortable: true, sortValue: (r) => r.seat?.number, render: (r) => `${r.seat?.number ?? "—"}` },
    { key: "studentName", header: "Student", sortable: true, render: (r) => (<div><p>{r.studentName}</p><p className="text-xs text-muted">{r.studentId}</p></div>) },
    { key: "createdAt", header: "Created", sortable: true, render: (r) => formatDateTime(r.createdAt) },
    { key: "status", header: "Status", sortable: true, render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <>
      <PageHeader title="Reservations" description="Short seat holds, not proof of occupancy." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <SeatStatCard label="Total reservations" value={inRange.length} total={inRange.length} suffix="holds" tone="neutral" />
        <SeatStatCard label="Active" value={counts.active} total={inRange.length} tone="warn" />
        <SeatStatCard label="Completed" value={counts.completed} total={inRange.length} tone="ok" />
        <SeatStatCard label="Expired" value={counts.expired} total={inRange.length} tone="brand" />
      </div>

      <Card className="mt-6">
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search ID, seat or student" label="Search reservations" className="sm:min-w-56 sm:flex-1" />
          <FilterSelect label="Filter by status" value={status} onChange={setStatus} allLabel="All statuses" options={["active", "completed", "expired"].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} />
        </FilterBar>
        <DataTable caption="Reservations" columns={columns} rows={rows} initialSort={{ key: "createdAt", dir: "desc" }} />
      </Card>
    </>
  );
}
