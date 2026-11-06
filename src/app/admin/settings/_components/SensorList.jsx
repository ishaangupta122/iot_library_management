"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useLibrary } from "@/context/LibraryContext";
import { relativeTime } from "@/lib/utils";

/** Read-only list of the installed sensors and their current connection. */
export function SensorList() {
  const { deviceViews, now } = useLibrary();

  const columns = [
    { key: "id", header: "Sensor", sortable: true, render: (d) => (<div><p className="font-semibold">{d.id}</p><p className="text-xs text-muted">{d.sensorType}</p></div>) },
    { key: "seat", header: "Seat", sortable: true, sortValue: (d) => d.seat?.number ?? "zzz", render: (d) => d.seat?.number ?? <span className="text-muted">Unassigned</span> },
    { key: "status", header: "Status", sortable: true, render: (d) => <StatusBadge status={d.status} /> },
    { key: "lastSeenAt", header: "Last heard", sortable: true, render: (d) => relativeTime(d.lastSeenAt, now) },
    { key: "signalDbm", header: "Signal", sortable: true, align: "right", render: (d) => (d.signalDbm != null ? `${d.signalDbm} dBm` : "—") },
  ];

  return (
    <Card>
      <CardHeader title="Installed sensors" description="Connection status of every sensor." className="pb-4" />
      <DataTable caption="Installed sensors" columns={columns} rows={deviceViews} initialSort={{ key: "id", dir: "asc" }} pageSize={10} />
    </Card>
  );
}
